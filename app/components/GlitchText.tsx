"use client";

/**
 * Glitch loop built from three stacked copies of the text: the base plus
 * two color-shifted layers (cyan / pink) that get sliced by animated
 * clip-path insets. Pure CSS keyframes - see .glitch rules in globals.css.
 */
export default function GlitchText({ text }: { text: string }) {
  return (
    <span className="glitch" data-text={text}>
      {text}
    </span>
  );
}
