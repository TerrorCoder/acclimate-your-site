import { useEffect, useMemo, useRef, useState } from "react";

import { atmosphereFor, paletteForState } from "@/lib/atmosphere";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

/**
 * Weather-reactive environmental scene.
 *
 * A volumetric-looking sky renderer: fractal (fBm) cloud density is evaluated into a small
 * offscreen buffer every frame, shaded against the sun/moon direction for lit tops and dark
 * bases, then upscaled — giving photographic cumulus, storm decks, fog and moonlit night
 * clouds. Precipitation, god rays, lightning and stars are composited on top.
 *
 * Everything is driven by the same atmosphere contract (state, night, mode, palette, intensity),
 * so a 3D runtime could later replace the renderer without touching the rest of the app.
 */

type CloudLook = {
  /** 0 = empty sky, 1 = full deck. */
  coverage: number;
  /** Sunlit / moonlit face of the cloud, RGB. */
  lit: [number, number, number];
  /** Shadowed underside, RGB. */
  shade: [number, number, number];
  /** How high the deck sits (0 = top of frame). */
  top: number;
  /** Softness of the fractal detail. */
  detail: number;
  /** Extra contrast between lit and shaded faces. */
  contrast: number;
  /** Opacity ceiling of the deck. */
  opacity: number;
  rays: number;
};

function look(state: string, night: boolean, golden: boolean): CloudLook {
  const base: Record<string, CloudLook> = {
    clear: {
      coverage: 0.36,
      lit: [255, 255, 255],
      shade: [168, 190, 220],
      top: 0.38,
      detail: 1,
      contrast: 1,
      opacity: 0.95,
      rays: 0.55,
    },
    "partly-cloudy": {
      coverage: 0.52,
      lit: [255, 255, 255],
      shade: [148, 172, 205],
      top: 0.26,
      detail: 1.05,
      contrast: 1.1,
      opacity: 1,
      rays: 0.75,
    },
    overcast: {
      coverage: 0.78,
      lit: [214, 219, 226],
      shade: [140, 148, 160],
      top: 0.05,
      detail: 0.8,
      contrast: 0.55,
      opacity: 1,
      rays: 0.12,
    },
    fog: {
      coverage: 0.86,
      lit: [226, 228, 231],
      shade: [186, 190, 196],
      top: 0,
      detail: 0.55,
      contrast: 0.25,
      opacity: 0.92,
      rays: 0.05,
    },
    rain: {
      coverage: 0.85,
      lit: [156, 166, 178],
      shade: [78, 88, 100],
      top: 0.02,
      detail: 0.95,
      contrast: 0.9,
      opacity: 1,
      rays: 0.06,
    },
    thunderstorm: {
      coverage: 0.92,
      lit: [126, 134, 148],
      shade: [38, 42, 54],
      top: 0,
      detail: 1.15,
      contrast: 1.25,
      opacity: 1,
      rays: 0,
    },
    snow: {
      coverage: 0.8,
      lit: [235, 238, 243],
      shade: [166, 176, 190],
      top: 0.04,
      detail: 0.85,
      contrast: 0.5,
      opacity: 1,
      rays: 0.1,
    },
  };

  const l = { ...(base[state] ?? base["clear"]!) };

  if (golden && !night) {
    l.lit = [255, 214, 168];
    l.shade = [148, 108, 116];
    l.rays = Math.max(l.rays, 0.9);
  }

  if (night) {
    // Moonlit: silver rims against near-black bodies (reference: moon in dark cloud).
    l.lit = [214, 222, 236];
    l.shade = [16, 19, 28];
    l.contrast = Math.max(1.5, l.contrast * 1.5);
    l.opacity = 1;
    l.rays = state === "clear" ? 0.25 : 0.35;
    if (state === "clear") l.coverage = 0.26;
  }

  return l;
}

/* --- value noise / fBm ------------------------------------------------- */

function makePerm(seed: number) {
  const p = new Uint8Array(512);
  let s = seed >>> 0;
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = base[i]!;
    base[i] = base[j]!;
    base[j] = t;
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255]!;
  return p;
}

const PERM = makePerm(20260820);

function fade(t: number) {
  return t * t * (3 - 2 * t);
}

function vnoise(x: number, y: number) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const a = PERM[(PERM[xi]! + yi) & 511]! / 255;
  const b = PERM[(PERM[(xi + 1) & 255]! + yi) & 511]! / 255;
  const c = PERM[(PERM[xi]! + yi + 1) & 511]! / 255;
  const d = PERM[(PERM[(xi + 1) & 255]! + yi + 1) & 511]! / 255;
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

function fbm(x: number, y: number, octaves: number) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

export function EnvironmentScene({ height = "full" }: { height?: "full" | "short" }) {
  const { context } = useEnvironment();
  const atmo = useMemo(() => atmosphereFor(context), [context]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const intensity = context?.current.precipitation ?? 0;
  const wind = context?.current.windSpeed ?? 8;
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => setParams(new URLSearchParams(window.location.search)), []);

  const override = params?.get("sky") as typeof atmo.state | null;
  const state = override || atmo.state;
  const night = params?.get("night") === "1" ? true : atmo.night;
  const preview = override || params?.get("night") === "1" ? paletteForState(state, night) : null;
  const sky = preview ?? atmo;
  const light = (preview?.mode ?? atmo.mode) === "light";
  const golden = !preview && (atmo.key.startsWith("sunset") || atmo.key.startsWith("sunrise"));


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 768;
    const L = look(state, night, golden);

    // Sun / moon anchor in normalised frame coords.
    const sunX = 0.74;
    const sunY = night ? 0.14 : golden ? 0.3 : 0.13;

    let raf = 0;
    let width = 0;
    let heightPx = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    // Low-res cloud buffer, upscaled with smoothing for soft volumetric edges.
    const bw = mobile ? 128 : 208;
    let bh = 96;
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d")!;
    let image: ImageData | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      heightPx = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(heightPx * dpr));
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.imageSmoothingEnabled = true;
      bh = Math.max(48, Math.round(bw * (heightPx / Math.max(1, width))));
      buffer.width = bw;
      buffer.height = bh;
      image = bctx.createImageData(bw, bh);
    };
    resize();
    window.addEventListener("resize", resize);

    const precipitating = state === "rain" || state === "thunderstorm" || state === "snow";
    const dropCount = precipitating ? Math.round((mobile ? 90 : 190) * Math.min(1.8, 0.7 + intensity)) : 0;
    const starCount = night ? (mobile ? 90 : 190) : 0;

    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      r: Math.random() * 1.5 + 0.5,
    }));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random() * 0.72,
      r: Math.random() * 1.1 + 0.25,
      tw: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 1.2,
    }));

    let flash = 0;
    let last = performance.now();
    let t = 0;

    /** Renders the fBm cloud deck into the low-res buffer. */
    const renderClouds = () => {
      if (!image) return;
      const data = image.data;
      const oct = mobile ? 4 : 5;
      const aspect = bh / bw;
      // Isotropic-ish sampling so puffs read as round volumes, not horizontal smears.
      const FX = 4.6 * L.detail;
      const FY = FX * aspect * 2.4;
      const drift = t * 0.008;
      const boil = t * 0.00035;
      // Offset (in noise space) used to sample "toward the light" for rim shading.
      const stepX = -Math.sign(sunX - 0.5 || 1) * 0.14 * FX * 0.1;
      const stepY = -0.16 * FY * 0.1;

      for (let y = 0; y < bh; y++) {
        const v = y / bh;
        // Vertical placement: deck starts at L.top and thickens downward, then fades to horizon.
        const band = Math.min(1, Math.max(0, (v - L.top) / 0.34));
        const horizon = 1 - Math.min(1, Math.max(0, (v - 0.68) / 0.3));
        const mask = Math.pow(band, 0.65) * Math.pow(horizon, 0.9);
        // Mild perspective: detail compresses as the deck recedes.
        const vv = Math.pow(Math.max(0, v), 1.25);
        for (let x = 0; x < bw; x++) {
          const i = (y * bw + x) << 2;
          if (mask <= 0.004) {
            data[i + 3] = 0;
            continue;
          }
          const u = x / bw;
          const bx = (u - drift) * FX;
          const by = vv * FY + boil;

          // Domain warp for billowing cauliflower edges.
          const wx = fbm(bx * 1.7 + 5.2, by * 1.7 - 3.1, 3) - 0.5;
          const wy = fbm(bx * 1.7 - 8.4, by * 1.7 + 2.6, 3) - 0.5;
          const nx = bx + wx * 1.1;
          const ny = by + wy * 1.1;
          const d = fbm(nx, ny, oct);


          const cov = L.coverage * (0.55 + mask * 0.75);
          let dens = (d - (1 - cov)) / 0.26;
          dens = dens <= 0 ? 0 : dens > 1 ? 1 : dens;
          dens *= mask;
          if (dens <= 0.004) {
            data[i + 3] = 0;
            continue;
          }

          // Light transmission: sample density between here and the light source.
          const s1 = fbm(nx + stepX, ny + stepY, oct - 1);
          const s2 = fbm(nx + stepX * 2.4, ny + stepY * 2.4, oct - 1);

          const occl = Math.max(0, (s1 - (1 - cov)) / 0.26) * 0.65 + Math.max(0, (s2 - (1 - cov)) / 0.26) * 0.35;
          let litAmt = 1 - Math.min(1, occl * 1.35 * L.contrast);
          // Bright silver rim where density thins out toward the light.
          const rim = Math.max(0, 1 - dens * 1.9) * (1 - Math.min(1, occl * 1.6));
          litAmt = Math.min(1, litAmt * 0.82 + rim * 0.85);
          // Sun proximity brightens nearby cloud.
          const dx = u - sunX;
          const dy = v - sunY;
          const prox = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 1.9);
          litAmt = Math.min(1, litAmt + prox * prox * 0.5);

          const e = litAmt * litAmt * (3 - 2 * litAmt);
          data[i] = L.shade[0] + (L.lit[0] - L.shade[0]) * e;
          data[i + 1] = L.shade[1] + (L.lit[1] - L.shade[1]) * e;
          data[i + 2] = L.shade[2] + (L.lit[2] - L.shade[2]) * e;
          data[i + 3] = Math.min(255, Math.pow(dens, 0.72) * 255 * L.opacity);
        }
      }
      bctx.putImageData(image, 0, 0);
    };

    const drawRays = () => {
      if (L.rays <= 0.02) return;
      const px = sunX * width;
      const py = sunY * heightPx;
      ctx2d.save();
      ctx2d.globalCompositeOperation = "lighter";
      ctx2d.filter = `blur(${Math.max(14, width * 0.02)}px)`;
      const rayCount = 5;
      for (let i = 0; i < rayCount; i++) {
        const a = Math.PI / 2 + (i - (rayCount - 1) / 2) * 0.22 + Math.sin(t * 0.0004 + i) * 0.012;
        const len = heightPx * 1.25;
        const spread = 40 + i * 14;
        const g = ctx2d.createLinearGradient(px, py, px + Math.cos(a) * len, py + Math.sin(a) * len);
        const tint = night ? "226,236,255" : golden ? "255,206,150" : "255,250,235";
        g.addColorStop(0, `rgba(${tint},${0.1 * L.rays})`);
        g.addColorStop(0.5, `rgba(${tint},${0.045 * L.rays})`);
        g.addColorStop(1, `rgba(${tint},0)`);
        ctx2d.fillStyle = g;
        ctx2d.beginPath();
        ctx2d.moveTo(px, py);
        ctx2d.lineTo(px + Math.cos(a - 0.02) * len - spread, py + Math.sin(a) * len);
        ctx2d.lineTo(px + Math.cos(a + 0.02) * len + spread, py + Math.sin(a) * len);
        ctx2d.closePath();
        ctx2d.fill();
      }
      ctx2d.restore();
    };

    const drawLuminary = () => {
      const px = sunX * width;
      const py = sunY * heightPx;
      ctx2d.save();
      ctx2d.globalCompositeOperation = "lighter";
      if (night) {
        const r = Math.max(22, Math.min(52, width * 0.035));
        const halo = ctx2d.createRadialGradient(px, py, r * 0.6, px, py, r * 7);
        halo.addColorStop(0, "rgba(226,235,255,0.42)");
        halo.addColorStop(0.35, "rgba(200,215,245,0.1)");
        halo.addColorStop(1, "rgba(200,215,245,0)");
        ctx2d.fillStyle = halo;
        ctx2d.fillRect(px - r * 7, py - r * 7, r * 14, r * 14);

        const disc = ctx2d.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
        disc.addColorStop(0, "rgba(255,255,255,0.98)");
        disc.addColorStop(0.75, "rgba(236,241,250,0.92)");
        disc.addColorStop(1, "rgba(206,216,234,0.75)");
        ctx2d.fillStyle = disc;
        ctx2d.beginPath();
        ctx2d.arc(px, py, r, 0, Math.PI * 2);
        ctx2d.fill();

        // Maria — deterministic craters, subtractive so the disc keeps its shape.
        ctx2d.globalCompositeOperation = "source-atop";
        const craters: Array<[number, number, number]> = [
          [-0.32, -0.28, 0.3],
          [0.18, -0.4, 0.16],
          [0.3, 0.12, 0.26],
          [-0.14, 0.34, 0.2],
          [-0.5, 0.16, 0.13],
          [0.02, -0.02, 0.12],
          [0.46, -0.2, 0.1],
        ];
        for (const [cx, cy, cr] of craters) {
          const g = ctx2d.createRadialGradient(px + cx * r, py + cy * r, 0, px + cx * r, py + cy * r, cr * r);
          g.addColorStop(0, "rgba(150,162,186,0.32)");
          g.addColorStop(1, "rgba(150,162,186,0)");
          ctx2d.fillStyle = g;
          ctx2d.beginPath();
          ctx2d.arc(px + cx * r, py + cy * r, cr * r, 0, Math.PI * 2);
          ctx2d.fill();
        }
      } else {
        const r = Math.max(28, Math.min(90, width * 0.05));
        const g = ctx2d.createRadialGradient(px, py, 0, px, py, r * 6);
        const c = golden ? "255,196,128" : "255,246,214";
        g.addColorStop(0, `rgba(${c},0.85)`);
        g.addColorStop(0.12, `rgba(${c},0.4)`);
        g.addColorStop(0.4, `rgba(${c},0.1)`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx2d.fillStyle = g;
        ctx2d.fillRect(px - r * 6, py - r * 6, r * 12, r * 12);
      }
      ctx2d.restore();
    };

    const draw = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      t += dt;
      ctx2d.clearRect(0, 0, width, heightPx);

      if (starCount) {
        for (const s of stars) {
          s.tw += (dt / 1000) * s.sp;
          const a = 0.28 + Math.sin(s.tw) * 0.28;
          ctx2d.fillStyle = `rgba(230,238,255,${Math.max(0, a)})`;
          ctx2d.beginPath();
          ctx2d.arc(s.x * width, s.y * heightPx, s.r, 0, Math.PI * 2);
          ctx2d.fill();
        }
      }

      drawLuminary();
      drawRays();

      renderClouds();
      ctx2d.drawImage(buffer, 0, 0, bw, bh, 0, 0, width, heightPx);

      if (state === "thunderstorm") {
        if (Math.random() < 0.0014 * dt) flash = 1;
        if (flash > 0) {
          ctx2d.save();
          ctx2d.globalCompositeOperation = "lighter";
          const g = ctx2d.createLinearGradient(0, 0, 0, heightPx);
          g.addColorStop(0, `rgba(226,234,255,${flash * 0.42})`);
          g.addColorStop(0.6, `rgba(200,214,246,${flash * 0.12})`);
          g.addColorStop(1, "rgba(200,214,246,0)");
          ctx2d.fillStyle = g;
          ctx2d.fillRect(0, 0, width, heightPx);
          ctx2d.restore();
          flash = Math.max(0, flash - dt / 240);
        }
      }

      if (precipitating) {
        for (const p of drops) {
          const speed = (state === "snow" ? 0.00016 : 0.0014) * p.z * dt * (1 + intensity * 0.6);
          p.y += speed * 4;
          p.x += ((wind / 90) * dt * p.z * (state === "snow" ? 0.0007 : 0.0013));
          if (p.y > 1) {
            p.y = -0.05;
            p.x = Math.random();
          }
          if (p.x > 1.02) p.x = -0.02;
          const px = p.x * width;
          const py = p.y * heightPx;
          if (state === "snow") {
            ctx2d.fillStyle = light
              ? `rgba(255,255,255,${0.6 + p.z * 0.35})`
              : `rgba(255,255,255,${0.3 + p.z * 0.4})`;
            ctx2d.beginPath();
            ctx2d.arc(px + Math.sin(p.y * 12 + p.z * 6) * 6, py, p.r, 0, Math.PI * 2);
            ctx2d.fill();
          } else {
            ctx2d.strokeStyle = light
              ? `rgba(96,116,150,${0.1 + p.z * 0.2})`
              : `rgba(198,222,255,${0.14 + p.z * 0.3})`;
            ctx2d.lineWidth = p.z * 1.05;
            ctx2d.beginPath();
            ctx2d.moveTo(px, py);
            ctx2d.lineTo(px - wind / 14, py + 12 + p.z * 14);
            ctx2d.stroke();
          }
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [state, night, light, golden, intensity, wind]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 overflow-hidden ${
        height === "full" ? "h-[86vh]" : "h-[42vh]"
      }`}
      style={{
        background: `radial-gradient(130% 90% at ${night ? "74% 10%" : "74% 6%"}, ${sky.sky1} 0%, ${sky.sky2} 40%, ${sky.sky3} 74%, var(--color-background) 100%)`,
        transition: "background 1200ms ease",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Readability scrim: keeps hero copy legible over bright cloud tops */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(100deg, color-mix(in oklab, var(--color-background) 74%, transparent) 0%, color-mix(in oklab, var(--color-background) 40%, transparent) 34%, transparent 58%)`,
        }}
      />
      {/* Haze / fog fading into the page background so text stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 46%, color-mix(in oklab, var(--color-background) 62%, transparent) 74%, var(--color-background) 100%)`,
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
