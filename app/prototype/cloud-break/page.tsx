"use client";
import dynamic from "next/dynamic";
import Panel from "./Panel";
import { useScrollDriver } from "./useScrollDriver";

/**
 * GATE 1 PROTOTYPE - THROWAWAY. /prototype/cloud-break
 *
 * Isolated route. Nothing outside app/prototype/cloud-break/ is modified, so
 * `rm -rf app/prototype` removes it without a trace. No styling, no content,
 * no chrome, no responsive work - deliberately. A prototype that looks
 * finished is harder to throw away, and throwing this away is an acceptable
 * outcome.
 */

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function CloudBreakPrototype() {
  useScrollDriver();

  return (
    <>
      {/*
        The root layout mounts ORION, which is a SECOND WebGL context. Left
        alive it competes for the GPU and makes the framerate number a lie.
        Scoped to this route and deleted with the folder.
      */}
      <style>{`.orion-launcher, .orion-panel { display: none !important; }`}</style>

      <Scene />
      <Panel />

      {/* Scroll runway. The break is the first 55%; the rest is light world. */}
      <div style={{ height: "1300vh", flexShrink: 0, pointerEvents: "none" }} />
    </>
  );
}
