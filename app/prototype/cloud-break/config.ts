/**
 * GATE 1 PROTOTYPE - THROWAWAY. Everything under app/prototype/cloud-break/
 * is deletable with no trace. Nothing outside this folder is touched.
 *
 * ============================================================================
 * TUNING BLOCK
 * ============================================================================
 * Every number in the brief is a starting point that will be wrong. Everything
 * a human would want to move by eye lives in TUNE and is wired to the on-screen
 * panel. Structural values (slab geometry, timeline knots) are below it and
 * are edited here, not from the panel.
 */

// ---------------------------------------------------------------------------
// Inherited from the existing hero rig - app/components/RippleGrid.tsx:146-155
// position (0, 12.5, 4.5), lookAt (0, -0.5, -7) => pitch -48.50 deg, yaw 0.
// FOV is held at the inherited 38 deg. No FOV animation anywhere: the brief's
// 42 deg correction points the wrong way from an already-narrower lens.
// ---------------------------------------------------------------------------
export const CAM = {
  fov: 38,
  near: 1,
  far: 40000,
  x: 0,
  z: 4.5,
  groundY: 12.5,
  groundPitch: -48.5,
} as const;

// The cloud slab in world units. The camera passes through it.
export const SLAB = {
  bottom: 90,
  top: 156,
  /** how far the deck runs before haze has fully eaten it */
  reach: 9000,
  /** radial rings / angular segments of the deck mesh. Exponential ring
   *  spacing puts the vertices where the visitor is looking closely. */
  rings: 320,
  segments: 320,
} as const;

// ---------------------------------------------------------------------------
// Live-tunable. Mutated in place by the panel, read in useFrame. Never replaced.
// ---------------------------------------------------------------------------
export const TUNE = {
  // --- climb ---------------------------------------------------------------
  /** exponent of the shared slow-in curve driving BOTH pitch and altitude
   *  through climb-initiate. 1 = linear, higher = later departure.
   *  Pitch and altitude read this same curve so the terrain recedes because
   *  the camera leaves it, not because it tilts off it. */
  initiateEase: 2.1,
  /** Floor on the whole climb, ground-leave (0.10) to reveal-end (0.84).
   *  Of this, climb-initiate takes 1.2s and beats 1-4 take the briefed 3.0s. */
  climbSeconds: 4.2,
  /** Floor on the settle-to-cruise band (0.84 -> 1.0). */
  settleSeconds: 2.5,
  /** altitude units/sec outside the clamped zone */
  freeRate: 1.15,
  /** camera inertia - higher converges faster */
  followLambda: 5.5,

  // --- level-off settle (beat 4) ------------------------------------------
  // Parameterised by altitude, not by a spring integrator, so scrolling back
  // up re-runs it identically. A stateful spring would not be reversible.
  /** altitude the aerodynamic settle begins at */
  settleFrom: 0.8,
  /** peak of the single settle, degrees. Brief: under 3. */
  settleAmp: 2.3,
  /** altitude span of one settle cycle (~1.5s at the clamped settle rate) */
  settlePeriod: 0.1,
  /** decay span. Kept well under settlePeriod so the second lobe is invisible. */
  settleDecay: 0.045,

  // --- resting attitudes ---------------------------------------------------
  /** pitch at the moment of reveal - puts the horizon in the upper third */
  revealPitch: -6,
  /** final cruise attitude. Brief says +2.5; at 38 deg FOV that sits the
   *  horizon just below centre rather than at the lower third. Tunable. */
  cruisePitch: 2.5,

  // --- pointer (cruise only) ----------------------------------------------
  pointerDeg: 0.8,
  pointerLambda: 1.4,
  pointerFrom: 0.88,

  // --- flight --------------------------------------------------------------
  /** constant forward velocity, world units/sec. Never stops, including cruise. */
  forwardSpeed: 16,

  // --- cloud shape ---------------------------------------------------------
  /** Amplitudes of the three billow octaves riding the smooth base. This is
   *  where self-similarity lives: large forms, medium lumps, fine erosion. */
  /** clump mask thresholds - lower gap = more separated lobes */
  clumpLo: 0.40,
  clumpHi: 0.62,
  oct2: 0.55,
  oct3: 0.22,
  oct4: 0.09,
  /** base of the top surface, as a fraction of slab height */
  topBase: 0.30,
  /** how much the top surface varies - this is the lumpiness */
  topVar: 0.39,

  // --- cloud noise scales --------------------------------------------------
  /** Top-surface heightfield. Sets the deck's feature width, and therefore
   *  whether it can cast shadow at all: at 0.00021 the steepest face was
   *  2.9 deg against a 15 deg sun, so self-shadowing was geometrically
   *  impossible. 0.0014 gives ~180u features against 30u of height. */
  shapeScale: 0.0016,

  // --- living environment --------------------------------------------------
  // Nothing shares a period. These are deliberately not round numbers and are
  // deliberately slower than feels right while building.
  driftShape: 0.0121, // body
  driftDetail: 0.0313, // detail - fastest, so it reads as the near layer
  driftHeight: 0.00748, // top surface - slowest, the far deck
  breathA: 0.0173,
  breathB: 0.01069,
  breathAmp: 0.035,

  // --- light ---------------------------------------------------------------
  sunAz: 40, // degrees off directly-behind, toward the right shoulder
  sunEl: 32, // still raking (shadows ~1.6x height) but crowns can catch it
  /** world units between shadow-march taps, x6 taps */
  shadowStep: 26,
  shadowStrength: 0.48,
  /** world units of penetration before a shadow is fully dark */
  shadowSoft: 11.0,
  /** wrapped diffuse. Cloud scatters, so shaded faces must not go charcoal. */
  wrap: 0.72,
  /** ambient from the sky dome */
  skyBounce: 0.20,
  /** light bleeding through lobe tips - the strongest "this is vapour" cue */
  translucency: 0.30,
  /** world units of lift above the coarse body that counts as a thin tip */
  thickScale: 22.0,
  /** finite-difference step for fragment normals, world units */
  normalEps: 0.5,

  // --- atmosphere ----------------------------------------------------------
  hazeDensity: 0.00020,
  farCut: 9000,
  skyPow: 0.5,
  sunGlow: 0.05,

  /** how far past the break the sky keeps darkening, and star brightness */
  starAmount: 0.85,

  /** brightness ramp toward the top of frame during the whiteout - beat 2's
   *  "something is above", carried by fog before any surface is visible */
  whiteTop: 1.4,

  // --- observed, not rendered ---------------------------------------------
  chromatic: 0.0028,
  vignette: 0.24,
  grain: 0.022,
} satisfies Record<string, number>;

export type TuneKey = keyof typeof TUNE;

/** Panel wiring. Order is the order they appear. */
export const SLIDERS: { key: TuneKey; min: number; max: number; step: number; group: string }[] = [
  { key: "initiateEase", min: 1, max: 4, step: 0.05, group: "climb" },
  { key: "climbSeconds", min: 2, max: 9, step: 0.1, group: "climb" },
  { key: "settleSeconds", min: 0.5, max: 6, step: 0.1, group: "climb" },
  { key: "followLambda", min: 1, max: 14, step: 0.1, group: "climb" },
  { key: "revealPitch", min: -18, max: 6, step: 0.25, group: "climb" },
  { key: "cruisePitch", min: -6, max: 12, step: 0.25, group: "climb" },
  { key: "settleAmp", min: 0, max: 5, step: 0.05, group: "climb" },
  { key: "settlePeriod", min: 0.03, max: 0.4, step: 0.005, group: "climb" },
  { key: "settleDecay", min: 0.01, max: 0.2, step: 0.002, group: "climb" },
  { key: "forwardSpeed", min: 0, max: 60, step: 0.5, group: "climb" },
  { key: "clumpLo", min: 0.1, max: 0.7, step: 0.005, group: "cloud" },
  { key: "clumpHi", min: 0.3, max: 0.95, step: 0.005, group: "cloud" },
  { key: "oct2", min: 0, max: 1.5, step: 0.005, group: "cloud" },
  { key: "oct3", min: 0, max: 0.8, step: 0.002, group: "cloud" },
  { key: "oct4", min: 0, max: 0.4, step: 0.001, group: "cloud" },
  { key: "topBase", min: 0.1, max: 0.9, step: 0.005, group: "cloud" },
  { key: "topVar", min: 0, max: 0.8, step: 0.005, group: "cloud" },
  { key: "shapeScale", min: 0.0002, max: 0.006, step: 0.00002, group: "cloud" },

  { key: "driftShape", min: 0, max: 0.12, step: 0.0005, group: "alive" },
  { key: "driftDetail", min: 0, max: 0.2, step: 0.0005, group: "alive" },
  { key: "driftHeight", min: 0, max: 0.08, step: 0.0002, group: "alive" },
  { key: "breathAmp", min: 0, max: 0.15, step: 0.001, group: "alive" },

  { key: "sunAz", min: 0, max: 90, step: 1, group: "light" },
  { key: "sunEl", min: 2, max: 45, step: 0.5, group: "light" },
  { key: "shadowStep", min: 2, max: 120, step: 1, group: "light" },
  { key: "shadowStrength", min: 0, max: 1, step: 0.01, group: "light" },
  { key: "shadowSoft", min: 0.5, max: 30, step: 0.25, group: "light" },
  { key: "wrap", min: 0, max: 1.5, step: 0.01, group: "light" },
  { key: "translucency", min: 0, max: 1, step: 0.01, group: "light" },
  { key: "thickScale", min: 2, max: 80, step: 1, group: "light" },
  { key: "skyBounce", min: 0, max: 0.6, step: 0.005, group: "light" },
  { key: "normalEps", min: 0.05, max: 4, step: 0.05, group: "light" },

  { key: "hazeDensity", min: 0.0001, max: 0.004, step: 0.00002, group: "air" },
  { key: "farCut", min: 2000, max: 16000, step: 100, group: "air" },
  { key: "skyPow", min: 0.2, max: 2, step: 0.01, group: "air" },
  { key: "sunGlow", min: 0, max: 0.6, step: 0.005, group: "air" },
  { key: "whiteTop", min: 0.6, max: 2.2, step: 0.01, group: "air" },
  { key: "starAmount", min: 0, max: 2, step: 0.02, group: "air" },

  { key: "chromatic", min: 0, max: 0.02, step: 0.0002, group: "lens" },
  { key: "vignette", min: 0, max: 1.2, step: 0.01, group: "lens" },
  { key: "grain", min: 0, max: 0.1, step: 0.001, group: "lens" },
  { key: "pointerDeg", min: 0, max: 4, step: 0.05, group: "lens" },
];

// ---------------------------------------------------------------------------
// Colour. Broken-out overcast is desaturated, cold and pale - mostly white and
// grey. Too much blue is on the kill list.
// ---------------------------------------------------------------------------
// Near-monochrome. Greys from near-white to charcoal, zero saturated colour.
// Cloud and haze values are the 05-DESIGN-SYSTEM tokens as written; the sky
// tokens there (#7FA3C4 / #4A7196, 35% and 51% saturation) are the "flat mid
// blue" the surface brief rejects, so they are desaturated here to a cool grey
// carrying the same vertical value range. See the note in the report.
export const COLOR = {
  cloudLit: "#FBFCFC",
  // NOT --above-cloud-shadow (#C9D2DA): as the dark end of a lighting ramp
  // that token leaves 15.7% of total contrast, through which no amount of
  // shadow marching can show form. But #8A96A2 (2:1, photographic) reads as
  // wet rock under a stylised target. This sits between: ~30% of range, enough
  // for form, high enough to stay vapour.
  cloudShadow: "#A2AEB8",
  deckBase: "#93A0AC", // overcast ceiling, seen from underneath
  haze: "#E4E9ED", // brighter than the deck: distance scatters light IN
  skyHorizon: "#D6DCE1",
  skyZenith: "#66727C",
  // D-020: the aircraft never stops climbing, so the sky keeps deepening for
  // the whole remainder of the experience.
  skyZenithDeep: "#141E33",
  skyHorizonDeep: "#5A6878",
  hazeDeep: "#8E9AA6",
  skyBelow: "#CFD6DB",
  whiteout: "#E2E7EB",
  groundBg: "#06060f", // inherited
  terrainBase: "#0A0E1A",
  terrainLit: "#24425E",
  fogInCloud: "#C6CDD3",
} as const;

// ---------------------------------------------------------------------------
// TIMELINE
// Altitude a in [0,1] is the single source of truth. Beats are altitude bands,
// never timers, so the whole thing is reversible by construction.
// ---------------------------------------------------------------------------
/**
 * Bands are sized in proportion to their intended duration, because inside the
 * clamped zone altitude advances at a constant rate. At climbSeconds = 4.2 over
 * the 0.74-unit span 0.10 -> 0.84 the rate is 0.176/s, giving:
 *
 *   climb-initiate  0.10 -> 0.31   1.2s   (beat 1's fog closes over its back half)
 *   1 loss of ref   0.31 -> 0.42   0.6s
 *   2 brightening   0.42 -> 0.56   0.8s
 *   3 glare         0.56 -> 0.63   0.4s
 *   4 level-off     0.63 -> 0.84   1.2s   <- the payload, most frames
 *                                  ----
 *                          beats 1-4 = 3.0s, inside the briefed 2.4-3.0s
 */
export const PHASE = {
  groundEnd: 0.1,
  initiateEnd: 0.31,
  beat1End: 0.42,
  beat2End: 0.56,
  beat3End: 0.63,
  /** beat 4: level-off and reveal */
  levelEnd: 0.84,
} as const;

/** The band inside which altitude rate is clamped. */
export const CLAMP_ZONE = { from: PHASE.groundEnd, to: PHASE.levelEnd } as const;

export const EASE = {
  LINEAR: 0,
  SMOOTH: 1,
  /** shared by pitch and altitude through climb-initiate */
  SLOW_IN: 2,
  SLOW_OUT: 3,
} as const;

export type Track = { a: number[]; v: number[]; e: number[] };

/** Camera height. Rises on the same SLOW_IN curve as pitch through initiate, so
 *  the terrain recedes because the camera departs it, not because it tilts away.
 *
 *  These knots are keyed to the deck's ACTUAL top surface, not to SLAB.top.
 *  The surface sits at `topBase + heightfield * topVar` of the slab, which with
 *  the current values puts it at world y 121 (thinnest) to 145 (tallest),
 *  mean ~133 - well below SLAB.top of 156. Keying to 156 is what put beats 2
 *  and 3 in clear air above the deck.
 *
 *    beat 1  0.31 -> 0.42   y  96 -> 108   solid, far below the thinnest top
 *    beat 2  0.42 -> 0.56   y 108 -> 118   still under 121, brightening from within
 *    beat 3  0.56 -> 0.63   y 118 -> 140   breaks through the 121-145 band
 *    beat 4  0.63 -> 0.84   y 140 -> 196   clears the tops, wisps fall away below
 *
 *  Vertical speed is uneven across beats 2 and 3 as a consequence. That is
 *  invisible: beat 2 has no visual reference and beat 3 is blown out. */
export const TRACK_Y: Track = {
  a: [0.0, 0.1, 0.31, 0.42, 0.56, 0.63, 0.84, 1.0],
  v: [12.5, 12.5, 96, 108, 118, 140, 196, 215],
  e: [EASE.LINEAR, EASE.SLOW_IN, EASE.SMOOTH, EASE.LINEAR, EASE.SMOOTH, EASE.SMOOTH, EASE.SLOW_OUT],
};

/** Pitch, degrees. The only expressive axis. No roll, no yaw, ever.
 *  Index 5 and 6/7 are overwritten each frame from TUNE.revealPitch / cruisePitch. */
export const TRACK_PITCH: Track = {
  a: [0.0, 0.1, 0.31, 0.63, 0.73, 0.8, 0.92, 1.0],
  v: [-48.5, -48.5, 18, 18, 0, -6, 2.5, 2.5],
  e: [EASE.LINEAR, EASE.SLOW_IN, EASE.LINEAR, EASE.SMOOTH, EASE.SMOOTH, EASE.SMOOTH, EASE.LINEAR],
};
export const PITCH_REVEAL_INDEX = 5;
export const PITCH_CRUISE_INDEX = 6;

/** Beat 3 is clipping, not bloom. Linear exposure multiply, then a hard clamp. */
// Beat 3 still clips hard, it just stops sooner. The old curve was still at
// 3.89 at alt 0.630 - beat 4 opened fully blown out and the glare ate the
// payload. It now recovers to ~1.27 by the time the reveal band starts.
export const TRACK_EXPOSURE: Track = {
  a: [0.0, 0.42, 0.53, 0.57, 0.598, 0.632, 0.68, 1.0],
  v: [1.0, 1.0, 1.35, 4.6, 3.4, 1.25, 1.0, 1.0],
  e: [EASE.LINEAR, EASE.SMOOTH, EASE.SLOW_IN, EASE.SMOOTH, EASE.SMOOTH, EASE.SMOOTH, EASE.LINEAR],
};

/** Scene fog for the terrain. Ramps to a whiteout as beat 1 closes in. */
export const TRACK_FOG_DENSITY: Track = {
  a: [0.0, 0.1, 0.22, 0.31, 1.0],
  v: [0.045, 0.045, 0.075, 0.16, 0.16],
  e: [EASE.LINEAR, EASE.SMOOTH, EASE.SMOOTH, EASE.LINEAR],
};

/** 0 = inherited #06060f, 1 = in-cloud grey. Terrain dissolves into cloud, not black. */
export const TRACK_FOG_MIX: Track = {
  a: [0.0, 0.12, 0.29, 1.0],
  v: [0.0, 0.0, 1.0, 1.0],
  e: [EASE.LINEAR, EASE.SMOOTH, EASE.LINEAR],
};

/** 0 = sky dome reads as the dark world, 1 = full daylight gradient. */
export const TRACK_SKY_MIX: Track = {
  a: [0.0, 0.2, 0.5, 1.0],
  v: [0.0, 0.0, 1.0, 1.0],
  e: [EASE.LINEAR, EASE.SMOOTH, EASE.LINEAR],
};

/** Full-frame whiteout. With the deck as a surface, beats 1-3 are carried
 *  entirely by fog: the camera is under the deck, sees nothing, and the world
 *  is uniform cloud. Fades out across beat 3 as the surface emerges. */
export const TRACK_WHITEOUT: Track = {
  a: [0.0, 0.24, 0.33, 0.52, 0.605, 1.0],
  v: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0],
  e: [EASE.LINEAR, EASE.SMOOTH, EASE.LINEAR, EASE.SMOOTH, EASE.LINEAR],
};

/** Fraction of the scroll runway the break occupies. Everything past it is
 *  light-world journey: the camera has trimmed for cruise but the climb has
 *  not stopped, so the sky keeps deepening. Altitude, and therefore every
 *  phase timing and the velocity clamp, is unchanged - only the mapping from
 *  DOM scroll into altitude is compressed. */
export const BREAK_SPAN = 0.55;

/** Sky deepening across the light world, keyed to journey (not altitude). */
export const TRACK_SKY_DEEPEN: Track = {
  a: [0.0, BREAK_SPAN, 0.72, 0.9, 1.0],
  v: [0.0, 0.0, 0.35, 0.82, 1.0],
  e: [EASE.LINEAR, EASE.SMOOTH, EASE.LINEAR, EASE.SMOOTH],
};

/** Stars only at the very end, and faintly. Sunlit cloud tops and visible
 *  stars cannot coexist, so this stays at zero until the sky is genuinely
 *  navy (R-007). */
export const TRACK_STARS: Track = {
  a: [0.0, 0.88, 1.0],
  v: [0.0, 0.0, 1.0],
  e: [EASE.LINEAR, EASE.SMOOTH],
};

/** Terrain unmounts here - never co-resident with the view.
 *  0.42 kept 263k vertices alive through the whole of beat 1, the one phase
 *  where max cloud fill and the terrain overlap, and beat 1 measured 13.8ms
 *  median (a sustained halving) because of it. From alt 0.31 the camera is
 *  inside the deck: the terrain is >=96u away at fog density 0.16 (opacity
 *  1.000000) AND behind an opaque cloud pass, so unmounting at 0.33 removes
 *  it from the heaviest phase with no visual change whatsoever. */
export const TERRAIN_UNMOUNT = 0.33;

export const BEAT_LABEL: { at: number; name: string }[] = [
  { at: 0, name: "ground" },
  { at: PHASE.groundEnd, name: "climb initiate" },
  { at: PHASE.initiateEnd, name: "1 loss of reference" },
  { at: PHASE.beat1End, name: "2 uneven brightening" },
  { at: PHASE.beat2End, name: "3 glare" },
  { at: PHASE.beat3End, name: "4 level-off / reveal" },
  { at: PHASE.levelEnd, name: "settle to cruise" },
];
