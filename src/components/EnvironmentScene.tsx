import { useEffect, useMemo, useRef } from "react";

import { atmosphereFor } from "@/lib/atmosphere";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

/**
 * Weather-reactive environmental scene.
 *
 * This is the integration slot a Spline (or any WebGL) scene plugs into: the same atmosphere
 * contract (state, night, mode, palette, intensity) drives it, so a 3D runtime can be mounted
 * here later without touching any other part of the app. Today it renders a lightweight layered
 * canvas + CSS environment that stays smooth on mobile and respects reduced-motion preferences.
 */
export function EnvironmentScene({ height = "full" }: { height?: "full" | "short" }) {
  const { context } = useEnvironment();
  const atmo = useMemo(() => atmosphereFor(context), [context]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const intensity = context?.current.precipitation ?? 0;
  const wind = context?.current.windSpeed ?? 8;
  const state = atmo.state;
  const night = atmo.night;
  const light = atmo.mode === "light";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 768;
    let raf = 0;
    let width = 0;
    let heightPx = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      heightPx = rect.height;
      canvas.width = width * dpr;
      canvas.height = heightPx * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const precipitating = state === "rain" || state === "thunderstorm" || state === "snow";
    const baseCount = mobile ? 70 : 150;
    const count = precipitating
      ? Math.round(baseCount * Math.min(2, 0.6 + intensity))
      : night
        ? baseCount
        : Math.round(baseCount * 0.25);

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * (width || 1),
      y: Math.random() * (heightPx || 1),
      z: 0.3 + Math.random() * 0.7,
      r: Math.random() * 1.6 + 0.4,
      tw: Math.random() * Math.PI * 2,
    }));

    let flash = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      ctx2d.clearRect(0, 0, width, heightPx);

      if (state === "thunderstorm") {
        if (Math.random() < 0.0016 * dt) flash = 1;
        if (flash > 0) {
          ctx2d.fillStyle = `rgba(255,255,255,${flash * 0.35})`;
          ctx2d.fillRect(0, 0, width, heightPx);
          flash = Math.max(0, flash - dt / 260);
        }
      }

      for (const p of particles) {
        if (precipitating) {
          const speed = (state === "snow" ? 0.05 : 0.55) * p.z * dt * (1 + intensity * 0.5);
          p.y += speed * 4;
          p.x += (wind / 90) * dt * p.z * (state === "snow" ? 0.6 : 1.2);
          if (p.y > heightPx) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x > width + 10) p.x = -10;
          if (state === "snow") {
            ctx2d.fillStyle = light
              ? `rgba(255,255,255,${0.7 + p.z * 0.3})`
              : `rgba(255,255,255,${0.35 + p.z * 0.4})`;
            ctx2d.beginPath();
            ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx2d.fill();
          } else {
            ctx2d.strokeStyle = light
              ? `rgba(70,95,135,${0.12 + p.z * 0.22})`
              : `rgba(198,222,255,${0.18 + p.z * 0.35})`;
            ctx2d.lineWidth = p.z * 1.1;
            ctx2d.beginPath();
            ctx2d.moveTo(p.x, p.y);
            ctx2d.lineTo(p.x - wind / 14, p.y + 10 + p.z * 12);
            ctx2d.stroke();
          }
        } else {
          // Stars at night, faint drifting motes during the day.
          p.tw += dt / 900;
          const alpha = night ? 0.35 + Math.sin(p.tw) * 0.3 : 0.06 + Math.sin(p.tw) * 0.04;
          p.x += (wind / 700) * dt * p.z;
          if (p.x > width + 4) p.x = -4;
          ctx2d.fillStyle = night
            ? `rgba(226,235,255,${Math.max(0, alpha)})`
            : `rgba(255,255,255,${Math.max(0, alpha)})`;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, p.r * (night ? 0.9 : 1.8), 0, Math.PI * 2);
          ctx2d.fill();
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [state, night, light, intensity, wind]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 overflow-hidden ${
        height === "full" ? "h-[86vh]" : "h-[42vh]"
      }`}
      style={{
        background: `radial-gradient(120% 80% at 70% 0%, ${atmo.sky1} 0%, ${atmo.sky2} 42%, ${atmo.sky3} 78%, var(--color-background) 100%)`,
        transition: "background 1200ms ease",
      }}
    >
      {/* Sun / moon */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: night ? "10vw" : "18vw",
          height: night ? "10vw" : "18vw",
          top: night ? "8%" : "10%",
          right: "12%",
          background: `radial-gradient(circle, ${atmo.glow} 0%, transparent 70%)`,
          opacity: night ? 0.55 : 0.85,
          animation: "slow-float 14s ease-in-out infinite",
          transition: "all 1200ms ease",
        }}
      />
      {/* Cloud bands */}
      {["clear"].includes(state) ? null : (
        <>
          <div
            className="absolute inset-x-[-20%] top-[12%] h-[22vh] blur-3xl"
            style={{
              background: `linear-gradient(90deg, transparent, ${light ? "oklch(1 0 0)" : atmo.sky2}, transparent)`,
              opacity: state === "overcast" || state === "rain" || state === "thunderstorm" ? 0.8 : 0.5,
              animation: `drift ${Math.max(28, 90 - wind)}s ease-in-out infinite alternate`,
            }}
          />
          <div
            className="absolute inset-x-[-25%] top-[26%] h-[18vh] blur-3xl"
            style={{
              background: `linear-gradient(90deg, transparent, ${light ? "oklch(0.98 0.01 240)" : atmo.sky1}, transparent)`,
              opacity: 0.4,
              animation: `drift ${Math.max(40, 120 - wind)}s ease-in-out infinite alternate-reverse`,
            }}
          />
        </>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Haze / fog fading into the page background so text stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 26%, color-mix(in oklab, var(--color-background) 72%, transparent) 68%, var(--color-background) 100%)`,
          backdropFilter: atmo.haze > 0.4 ? "blur(2px)" : undefined,
        }}
      />
      {/* Ground horizon */}
      <div
        className="absolute inset-x-0 bottom-0 h-[18vh]"
        style={{ background: `linear-gradient(to top, var(--color-background), transparent)` }}
      />
    </div>
  );
}
