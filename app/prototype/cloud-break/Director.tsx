"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  CAM,
  COLOR,
  PHASE,
  PITCH_CRUISE_INDEX,
  PITCH_REVEAL_INDEX,
  TRACK_EXPOSURE,
  TRACK_FOG_DENSITY,
  TRACK_FOG_MIX,
  TRACK_PITCH,
  TRACK_SKY_DEEPEN,
  TRACK_SKY_MIX,
  TRACK_STARS,
  TRACK_WHITEOUT,
  BREAK_SPAN,
  TRACK_Y,
  TUNE,
} from "./config";
import { sampleTrack } from "./curves";
import { STATE, U } from "./uniforms";

/**
 * GATE 1 PROTOTYPE - THROWAWAY.
 *
 * The single frame authority. Altitude is derived here and nowhere else; the
 * camera, the atmosphere and every shared uniform read from it. Runs at
 * priority 0 so it lands before Composite (priority 1) takes over rendering.
 *
 * Nothing in this function allocates.
 */

const DEG = Math.PI / 180;

// Preallocated. No `new` inside useFrame, ever.
const FOG_DARK = new THREE.Color(COLOR.groundBg);
const FOG_CLOUD = new THREE.Color(COLOR.fogInCloud);

export default function Director() {
  const { camera } = useThree();
  const ptr = useRef({ x: 0, y: 0 });

  useFrame((state, rawDelta) => {
    // A tab that was backgrounded returns with a huge delta. Letting that
    // through would teleport the visitor through the break on re-focus.
    const dt = Math.min(rawDelta, 1 / 20);
    const t = (U.uTime.value += dt);

    // Constant forward velocity, always, including at cruise. Applied to the
    // sample coordinate rather than the camera so the camera only ever moves
    // in Y and float precision stays flat forever.
    U.uFlow.value += TUNE.forwardSpeed * dt;

    // ---------------------------------------------------------------- altitude
    // The break occupies the first BREAK_SPAN of the runway; the rest is
    // light-world journey. Altitude, phase timings and the clamp are untouched.
    const target = Math.min(1, STATE.scroll / BREAK_SPAN);
    const alt = STATE.altitude;

    STATE.journey += (STATE.scroll - STATE.journey) * (1 - Math.exp(-TUNE.followLambda * dt));

    // Inertia first: the camera is a mass, it does not stop when scrolling does.
    const damped = alt + (target - alt) * (1 - Math.exp(-TUNE.followLambda * dt));

    // Then the velocity clamp. Input is never blocked - the DOM scrolls
    // normally and the world simply cannot climb faster than this. Scroll and
    // altitude decouple briefly and reconverge above the deck.
    let rate: number;
    if (alt < PHASE.groundEnd) rate = TUNE.freeRate;
    else if (alt < PHASE.levelEnd)
      rate = (PHASE.levelEnd - PHASE.groundEnd) / Math.max(TUNE.climbSeconds, 0.1);
    else rate = (1 - PHASE.levelEnd) / Math.max(TUNE.settleSeconds, 0.1);

    const step = rate * dt;
    let delta = damped - alt;
    STATE.clamped = Math.abs(delta) > step * 1.001;
    if (delta > step) delta = step;
    else if (delta < -step) delta = -step;

    const a = alt + delta;
    STATE.altitude = a;

    // ------------------------------------------------------------------ camera
    TRACK_PITCH.v[PITCH_REVEAL_INDEX] = TUNE.revealPitch;
    TRACK_PITCH.v[PITCH_CRUISE_INDEX] = TUNE.cruisePitch;
    TRACK_PITCH.v[PITCH_CRUISE_INDEX + 1] = TUNE.cruisePitch;

    let pitch = sampleTrack(TRACK_PITCH, a);

    // One aerodynamic settle on the level-off. Deliberately slightly under-
    // damped: a decaying sine in ALTITUDE, not in time, so scrolling back up
    // replays it exactly. A second visible oscillation is a bug, which is why
    // settleDecay is well under settlePeriod.
    const s = a - TUNE.settleFrom;
    if (s > 0) {
      pitch +=
        TUNE.settleAmp *
        Math.sin((s / Math.max(TUNE.settlePeriod, 1e-3)) * Math.PI * 2) *
        Math.exp(-s / Math.max(TUNE.settleDecay, 1e-3));
    }

    // Pointer influence is off for the whole break and returns only at cruise,
    // clamped and heavily damped. The world acknowledges; it does not chase.
    const gate = a > TUNE.pointerFrom ? 1 : 0;
    const px = state.pointer.x * TUNE.pointerDeg * gate;
    const py = -state.pointer.y * TUNE.pointerDeg * gate;
    const k = 1 - Math.exp(-TUNE.pointerLambda * dt);
    ptr.current.x += (px - ptr.current.x) * k;
    ptr.current.y += (py - ptr.current.y) * k;

    const y = sampleTrack(TRACK_Y, a);
    camera.position.set(CAM.x, y, CAM.z);
    // YXZ so pitch and the tiny pointer yaw compose without ever inducing roll.
    camera.rotation.set((pitch + ptr.current.y) * DEG, ptr.current.x * DEG, 0, "YXZ");

    STATE.pitch = pitch;
    U.uCamPos.value.copy(camera.position);

    // -------------------------------------------------------------- atmosphere
    U.uExposure.value = sampleTrack(TRACK_EXPOSURE, a);
    U.uFogDensity.value = sampleTrack(TRACK_FOG_DENSITY, a);
    U.uFogColor.value.copy(FOG_DARK).lerp(FOG_CLOUD, sampleTrack(TRACK_FOG_MIX, a));
    U.uSkyMix.value = sampleTrack(TRACK_SKY_MIX, a);
    U.uWhiteout.value = sampleTrack(TRACK_WHITEOUT, a);
    U.uWhiteTop.value = TUNE.whiteTop;

    // The aircraft never stops climbing, so the sky keeps deepening for the
    // whole remainder. Deck brightness follows it - a white deck under a navy
    // sky is incoherent.
    const deepen = sampleTrack(TRACK_SKY_DEEPEN, STATE.journey);
    U.uSkyDeepen.value = deepen;
    U.uStars.value = sampleTrack(TRACK_STARS, STATE.journey) * TUNE.starAmount;
    U.uDeckDim.value = 1 - 0.62 * deepen;

    // ------------------------------------------------------------------- alive
    // Nothing shares a period. Three layers, three speeds - detail moves
    // fastest so it reads as the near layer, the top surface slowest so the far
    // deck only breathes.
    // The deck evolves by walking through the volume's third axis at a rate
    // incommensurate with the forward flow, so the composite never repeats.
    const breath = Math.sin(t * TUNE.breathA) * 0.6 + Math.sin(t * TUNE.breathB) * 0.4;
    U.uDriftH.value = t * TUNE.driftHeight + breath * TUNE.breathAmp;

    // ----------------------------------------------------------------- tunables
    U.uSunDir.value
      .set(
        Math.sin(TUNE.sunAz * DEG) * Math.cos(TUNE.sunEl * DEG),
        Math.sin(TUNE.sunEl * DEG),
        Math.cos(TUNE.sunAz * DEG) * Math.cos(TUNE.sunEl * DEG),
      )
      .normalize();

    U.uTopBase.value = TUNE.topBase;
    U.uTopVar.value = TUNE.topVar;
    U.uShapeScale.value = TUNE.shapeScale;
    U.uShadowStep.value = TUNE.shadowStep;
    U.uShadowStrength.value = TUNE.shadowStrength;
    U.uShadowSoft.value = TUNE.shadowSoft;
    U.uWrap.value = TUNE.wrap;
    U.uSkyBounce.value = TUNE.skyBounce;
    U.uTranslucency.value = TUNE.translucency;
    U.uThickScale.value = TUNE.thickScale;
    U.uNormalEps.value = TUNE.normalEps;
    U.uClumpLo.value = TUNE.clumpLo;
    U.uClumpHi.value = TUNE.clumpHi;
    U.uOct2.value = TUNE.oct2;
    U.uOct3.value = TUNE.oct3;
    U.uOct4.value = TUNE.oct4;
    U.uHazeDensity.value = TUNE.hazeDensity;
    U.uFarCut.value = TUNE.farCut;
    U.uSkyPow.value = TUNE.skyPow;
    U.uSunGlow.value = TUNE.sunGlow;
    U.uChromatic.value = TUNE.chromatic;
    U.uVignette.value = TUNE.vignette;
    U.uGrain.value = TUNE.grain;
  }, 0);

  return null;
}
