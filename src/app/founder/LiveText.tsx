"use client";

import { Fragment, useEffect, useRef } from "react";
import styles from "./founder.module.css";

type RGB = [number, number, number];

const WHITE: RGB = [255, 255, 255];
const VIOLET: RGB = [167, 139, 250];
const DIM: RGB = [84, 76, 118];

function mix(a: RGB, b: RGB, t: number) {
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
}

export function LiveHeadline({ lines, label }: { lines: string[]; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-l]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;

    const paint = (now: number) => {
      const y = window.scrollY;
      const phase = reduce ? 0 : now * 0.0007 + y * 0.006;
      letters.forEach((el, i) => {
        const w = (Math.sin(phase + i * 0.5) + 1) / 2;
        el.style.color = mix(WHITE, VIOLET, w);
        el.style.transform = `translateY(${((w - 0.5) * -10).toFixed(2)}px)`;
        el.style.textShadow = `0 0 ${(w * 30).toFixed(1)}px rgba(139, 92, 246, ${(w * 0.5).toFixed(2)})`;
      });
      raf = visible && !reduce ? requestAnimationFrame(paint) : 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(paint);
    });
    io.observe(root);
    raf = requestAnimationFrame(paint);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.bigText}
      role="heading"
      aria-level={2}
      aria-label={label}
    >
      {lines.map((line, li) => (
        <span className={styles.bigLine} key={li} aria-hidden="true">
          {line.split(" ").map((word, wi) => (
            <span className={styles.liveWord} key={wi}>
              {word.split("").map((ch, ci) => (
                <span key={ci} data-l="" className={styles.liveLetter}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

export function LiveQuote({ words }: { words: { t: string; e?: boolean }[] }) {
  const ref = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const paint = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = reduce
        ? 1
        : Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.5 + r.height * 0.6)));
      const n = spans.length;
      spans.forEach((s, i) => {
        const t = Math.min(1, Math.max(0, p * (n + 3) - i));
        const base = s.dataset.e === "1" ? VIOLET : WHITE;
        s.style.color = mix(DIM, base, t);
        s.style.opacity = (0.4 + 0.6 * t).toFixed(2);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <blockquote ref={ref} className={styles.liveQuote}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span data-w="" data-e={w.e ? "1" : "0"} className={styles.wordLive}>
            {w.t}
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </blockquote>
  );
}
