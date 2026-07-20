"use client";
import { useEffect, useState } from "react";

const TYPE_MS = 75;
const DELETE_MS = 38;
const HOLD_MS = 1700;
const GAP_MS = 350;

/** Types a word out, holds, deletes it, then moves to the next — forever. */
export default function Typewriter({ words }: { words: string[] }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex % words.length];
    let delay: number;

    if (!deleting) {
      if (text === word) {
        delay = HOLD_MS;
      } else {
        delay = TYPE_MS;
      }
    } else {
      delay = text === "" ? GAP_MS : DELETE_MS;
    }

    const t = setTimeout(() => {
      if (!deleting) {
        if (text === word) {
          setDeleting(true);
        } else {
          setText(word.slice(0, text.length + 1));
        }
      } else {
        if (text === "") {
          setDeleting(false);
          setWordIndex((i) => (i + 1) % words.length);
        } else {
          setText(text.slice(0, -1));
        }
      }
    }, delay);

    return () => clearTimeout(t);
  }, [text, deleting, wordIndex, words]);

  return (
    <span className="typewriter">
      {text}
      <span className="typewriter-caret" aria-hidden />
    </span>
  );
}
