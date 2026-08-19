import { useEffect, useMemo } from "react";

import { atmosphereFor } from "@/lib/atmosphere";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";

/**
 * Applies the live sky as the app theme.
 *
 * The palette derived from real conditions (state + day/night + golden hour) is written
 * straight onto :root, so every semantic token — background, foreground, borders, accents —
 * shifts with the weather while keeping foreground/background contrast readable.
 */
export function AtmosphereTheme() {
  const { context } = useEnvironment();
  const atmo = useMemo(() => atmosphereFor(context), [context]);

  useEffect(() => {
    const root = document.documentElement;
    for (const [token, value] of Object.entries(atmo.theme)) {
      root.style.setProperty(token, value);
    }
    root.style.setProperty("--sky-1", atmo.sky1);
    root.style.setProperty("--sky-2", atmo.sky2);
    root.style.setProperty("--sky-3", atmo.sky3);
    root.style.setProperty("--glow", atmo.glow);
    root.style.setProperty("--haze", String(atmo.haze));
    root.dataset["mode"] = atmo.mode;
    root.style.colorScheme = atmo.mode;
  }, [atmo]);

  return null;
}
