import { useEffect, useId, useRef, useState } from "react";
export function Breath({
  deadline,
  duration,
  motion,
  onComplete,
}: {
  deadline: number;
  duration: number;
  motion: "full" | "gentle" | "still";
  onComplete: () => void;
}) {
  const unique = useId().replace(/:/g, ""),
    shape = useRef<SVGPathElement>(null),
    light = useRef<SVGPathElement>(null),
    frame = useRef(0),
    done = useRef(false),
    complete = useRef(onComplete);
  const [phase, setPhase] = useState("Breathe in"),
    [seconds, setSeconds] = useState(duration),
    [osStill, setOsStill] = useState(
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  complete.current = onComplete;
  const still = osStill || motion === "still";
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)"),
      fn = () => setOsStill(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    const path = (r: number, b: number) => {
      const points = Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6,
          v =
            r *
            (1 + 0.014 * Math.sin(a * 3 + b * 0.4) + 0.012 * Math.cos(a * 2));
        return [150 + Math.cos(a) * v, 150 + Math.sin(a) * v];
      });
      let d = `M${points[0].join(",")}`;
      for (let i = 0; i < 12; i++) {
        const a = points[(i + 11) % 12],
          b = points[i],
          c = points[(i + 1) % 12],
          e = points[(i + 2) % 12];
        d += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c.join(",")}`;
      }
      return d + "Z";
    };
    const update = () => {
      const p = Math.max(
          0,
          Math.min(1, 1 - (deadline - Date.now()) / (duration * 1000)),
        ),
        ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
      const b = still
          ? 0.4
          : p < 0.4
            ? ease(p / 0.4)
            : 1 - ease((p - 0.4) / 0.6),
        r = motion === "gentle" ? 88 + 10 * b : 79 + 22 * b;
      const d = path(r, b);
      shape.current?.setAttribute("d", d);
      light.current?.setAttribute("d", d);
      setPhase(
        p >= 1
          ? "Your moment, your choice."
          : p < 0.4
            ? "Breathe in"
            : "Breathe out",
      );
      setSeconds(Math.ceil((1 - p) * duration));
      if (p >= 1) {
        if (!done.current) {
          done.current = true;
          complete.current();
        }
        return;
      }
      if (!document.hidden) frame.current = requestAnimationFrame(update);
    };
    const visibility = () => {
      cancelAnimationFrame(frame.current);
      if (!document.hidden) update();
    };
    update();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame.current);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [deadline, duration, motion, still]);
  return (
    <div className="breath-wrap">
      <svg className="breath" viewBox="0 0 300 300" aria-hidden="true">
        <defs>
          <radialGradient id={`${unique}-body`} cx="40%" cy="35%" r="67%">
            <stop offset="0" stopColor="var(--orb-light)" stopOpacity=".30" />
            <stop offset=".56" stopColor="var(--orb)" stopOpacity=".64" />
            <stop offset=".82" stopColor="var(--orb)" stopOpacity=".37" />
            <stop offset="1" stopColor="var(--orb)" stopOpacity=".12" />
          </radialGradient>
          <radialGradient id={`${unique}-light`} cx="28%" cy="22%" r="68%">
            <stop stopColor="var(--orb-light)" stopOpacity=".56" />
            <stop offset="1" stopColor="var(--orb-light)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path ref={shape} fill={`url(#${unique}-body)`} />
        <path ref={light} fill={`url(#${unique}-light)`} />
      </svg>
      <p className="breath-cue" role="status">
        {phase}
      </p>
      <p className="breath-note">
        {still && seconds > 0
          ? `${seconds} seconds of space`
          : "Breathe along, or simply watch."}
      </p>
    </div>
  );
}
