import { useEffect, useRef, useState } from "react";

/** Same printable ASCII cipher alphabet as DecryptReveal DEFAULTS.charset. */
export const DECRYPT_CHARSET = Array.from({ length: 95 }, (_, i) =>
  String.fromCharCode(32 + i),
).join("");

export const DECRYPT_DURATION_MS = 420;

const SCRAMBLE_GLYPHS = DECRYPT_CHARSET.replaceAll(" ", "");

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function glyph(random: () => number): string {
  const index = Math.min(
    SCRAMBLE_GLYPHS.length - 1,
    Math.floor(random() * SCRAMBLE_GLYPHS.length),
  );
  return SCRAMBLE_GLYPHS[index] ?? "?";
}

function mix(target: string, resolvedCount: number, random: () => number): string {
  return Array.from(target, (ch, i) => {
    if (ch === " ") return " ";
    if (i < resolvedCount) return ch;
    return glyph(random);
  }).join("");
}

export function useDecryptLabel(
  target: string,
  active: boolean,
  random: () => number = Math.random,
): string {
  const randomRef = useRef(random);
  randomRef.current = random;
  const reduced = prefersReducedMotion();
  const [text, setText] = useState(() =>
    active && !reduced ? mix(target, 0, random) : target,
  );

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setText(target);
      return;
    }
    const pick = () => randomRef.current();
    setText(mix(target, 0, pick));
    let start: number | undefined;
    let frame = 0;
    const tick = (now: number) => {
      if (start === undefined) start = now;
      const progress = Math.min(1, (now - start) / DECRYPT_DURATION_MS);
      const resolved = Math.floor(progress * target.length);
      if (progress >= 1) {
        setText(target);
        return;
      }
      setText(mix(target, resolved, pick));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  if (!active || reduced) return target;
  return text;
}
