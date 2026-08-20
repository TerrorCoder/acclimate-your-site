import { useEffect, useMemo, useRef } from "react";

import clearSky from "@/assets/sky/clear.png.asset.json";
import fogSky from "@/assets/sky/fog.jpg.asset.json";
import nightRainSky from "@/assets/sky/night-rain.jpg.asset.json";
import nightSky from "@/assets/sky/night.png.asset.json";
import overcastSky from "@/assets/sky/overcast.jpg.asset.json";
import partlyCloudySky from "@/assets/sky/partly-cloudy.jpg.asset.json";
import rainSky from "@/assets/sky/rain.png.asset.json";
import snowSky from "@/assets/sky/snow.jpg.asset.json";
import sunriseSky from "@/assets/sky/sunrise.jpg.asset.json";
import sunsetSky from "@/assets/sky/sunset.jpg.asset.json";
import thunderstormSky from "@/assets/sky/thunderstorm.png.asset.json";
import { atmosphereFor } from "@/lib/atmosphere";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

/**
 * Weather-reactive environmental scene.
 *
 * Instead of a 3D runtime we render a high-detail photographic sky chosen from the live
 * conditions, animated with a very slow ken-burns drift so it feels alive without motion
 * sickness or GPU cost. A light particle canvas layers rain / snow / stars on top, and a
 * scrim fades the photo into the page background so text always stays readable.
 */
const SKY_IMAGES: Record<string, string> = {
  clear: clearSky.url,
  "partly-cloudy": partlyCloudySky.url,
  overcast: overcastSky.url,
  fog: fogSky.url,
  rain: rainSky.url,
  thunderstorm: thunderstormSky.url,
  snow: snowSky.url,
  night: nightSky.url,
  "night-rain": nightRainSky.url,
  sunrise: sunriseSky.url,
  sunset: sunsetSky.url,
};

export function EnvironmentScene({ height = "full" }: { height?: "full" | "short" }) {
  const { context } = useEnvironment();
  const atmo = useMemo(() => atmosphereFor(context), [context]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const intensity = context?.current.precipitation ?? 0;
  const wind = context?.current.windSpeed ?? 8;
  const state = atmo.state;
  const night = atmo.night;
  const light = atmo.mode === "light";
  const image = SKY_IMAGES[atmo.paletteKey] ?? SKY_IMAGES["clear"]!;

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
    const baseCount = mobile ? 60 : 130;
    const count = precipitating
      ? Math.round(baseCount * Math.min(2, 0.6 + intensity))
      : night
        ? Math.round(baseCount * 0.5)
        : 0;

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
          ctx2d.fillStyle = `rgba(255,255,255,${flash * 0.3})`;
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
            ctx2d.fillStyle = `rgba(255,255,255,${0.5 + p.z * 0.35})`;
            ctx2d.beginPath();
            ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx2d.fill();
          } else {
            ctx2d.strokeStyle = light
              ? `rgba(235,245,255,${0.18 + p.z * 0.25})`
              : `rgba(198,222,255,${0.16 + p.z * 0.3})`;
            ctx2d.lineWidth = p.z * 1.1;
            ctx2d.beginPath();
            ctx2d.moveTo(p.x, p.y);
            ctx2d.lineTo(p.x - wind / 14, p.y + 10 + p.z * 12);
            ctx2d.stroke();
          }
        } else {
          // Faint twinkling stars over the night photograph.
          p.tw += dt / 900;
          const alpha = 0.25 + Math.sin(p.tw) * 0.25;
          p.x += (wind / 900) * dt * p.z;
          if (p.x > width + 4) p.x = -4;
          ctx2d.fillStyle = `rgba(226,235,255,${Math.max(0, alpha)})`;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2);
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
      style={{ backgroundColor: atmo.sky2 }}
    >
      {/* High-detail photographic sky, cross-faded per condition and very slowly drifting. */}
      <img
        key={atmo.paletteKey}
        src={image}
        alt=""
        width={1920}
        height={1080}
        className="sky-photo absolute inset-0 h-full w-full object-cover"
      />
      {/* Warm/cool light bloom tinted by temperature and sun position. */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: night ? "16vw" : "26vw",
          height: night ? "16vw" : "26vw",
          top: night ? "6%" : "8%",
          right: "12%",
          background: `radial-gradient(circle, ${atmo.glow} 0%, transparent 70%)`,
          opacity: night ? 0.28 : 0.4,
          animation: "slow-float 26s ease-in-out infinite",
          transition: "all 1200ms ease",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Scrim: fades the photo into the page background so text keeps its contrast. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklab, var(--color-background) 34%, transparent) 0%, color-mix(in oklab, var(--color-background) 58%, transparent) 46%, color-mix(in oklab, var(--color-background) 88%, transparent) 78%, var(--color-background) 100%)`,
          backdropFilter: atmo.haze > 0.4 ? "blur(2px)" : undefined,
        }}
      />
    </div>
  );
}
