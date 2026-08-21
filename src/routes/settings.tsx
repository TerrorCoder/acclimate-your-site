import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { EnvironmentScene } from "@/components/EnvironmentScene";
import { LocationSelector } from "@/components/LocationSelector";
import { useEnvironment } from "@/lib/env/EnvironmentProvider";
import { getActiveAIStatus, testAIConnection, type AIStatus } from "@/lib/ai/aiProvider";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & AI Configuration — Acclimate" },
      {
        name: "description",
        content: "Configure location, units, time format and AI inference providers (Google Gemini & OpenAI).",
      },
      { property: "og:title", content: "Settings & AI Configuration — Acclimate" },
      { property: "og:description", content: "Location, units and AI inference engine settings." },
    ],
  }),
  component: SettingsPage,
});

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-border p-1" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="rounded-full px-4 py-1.5 text-sm transition-colors"
          style={
            value === o.value
              ? { background: "var(--color-primary)", color: "var(--color-primary-foreground)" }
              : { color: "var(--color-muted-foreground)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPage() {
  const { settings, updateSettings, context } = useEnvironment();
  const [aiStatus, setAiStatus] = useState<AIStatus>(getActiveAIStatus());
  const [geminiKey, setGeminiKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setGeminiKey(localStorage.getItem("acclimate_gemini_key") || "");
    setOpenAiKey(localStorage.getItem("acclimate_openai_key") || "");
    setAiStatus(getActiveAIStatus());
  }, []);

  const handleSaveGemini = (key: string) => {
    setGeminiKey(key);
    if (key.trim()) {
      localStorage.setItem("acclimate_gemini_key", key.trim());
    } else {
      localStorage.removeItem("acclimate_gemini_key");
    }
    setAiStatus(getActiveAIStatus());
  };

  const handleSaveOpenAI = (key: string) => {
    setOpenAiKey(key);
    if (key.trim()) {
      localStorage.setItem("acclimate_openai_key", key.trim());
    } else {
      localStorage.removeItem("acclimate_openai_key");
    }
    setAiStatus(getActiveAIStatus());
  };

  const runTest = async (provider: "gemini" | "openai", key: string) => {
    if (!key.trim()) {
      setTestResult({ success: false, message: "Please provide an API key to test." });
      return;
    }
    setTestingProvider(provider);
    setTestResult(null);
    const res = await testAIConnection(provider, key.trim());
    setTestResult(res);
    setTestingProvider(null);
    setAiStatus(getActiveAIStatus());
  };

  return (
    <div className="relative">
      <EnvironmentScene height="short" />
      <div className="relative mx-auto max-w-3xl space-y-8 px-4 pt-8 pb-16 md:px-6">
        <header>
          <p className="eyebrow">Settings &amp; Engine</p>
          <h1 className="display-lg mt-2">Preferences</h1>
          <p className="mt-3 text-muted-foreground">
            Configure units, location, and connect live AI inference models.
          </p>
        </header>

        {/* AI Engine Section */}
        <section aria-labelledby="ai-settings" className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="eyebrow" style={{ color: "var(--color-ai)" }}>
                Intelligence Engine
              </p>
              <h2 id="ai-settings" className="display-md mt-1">
                AI Inference Configuration
              </h2>
            </div>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: aiStatus.hasKey ? "var(--color-good)" : "var(--color-warn)",
                color: aiStatus.hasKey ? "var(--color-good)" : "var(--color-warn)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: aiStatus.hasKey ? "var(--color-good)" : "var(--color-warn)" }}
              />
              {aiStatus.hasKey
                ? `Active: ${aiStatus.provider.toUpperCase()} (${aiStatus.model})`
                : "Rule-Based Fallback Mode"}
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Acclimate delivers deep contextual interpretations using Google Gemini or OpenAI. Enter your API key below to enable live AI reasoning (keys are stored locally in your browser only).
          </p>

          <div className="mt-6 space-y-6">
            {/* Gemini Key Input */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="gemini-key" className="text-sm font-semibold">
                  Google Gemini API Key (Recommended)
                </label>
                <span className="text-xs text-muted-foreground">gemini-2.0-flash</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Free tier available at ai.google.dev with fast, structured reasoning.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 sm:flex-nowrap">
                <input
                  id="gemini-key"
                  type="password"
                  value={geminiKey}
                  onChange={(e) => handleSaveGemini(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                />
                <button
                  type="button"
                  onClick={() => void runTest("gemini", geminiKey)}
                  disabled={testingProvider !== null || !geminiKey.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {testingProvider === "gemini" ? "Testing…" : "Test Gemini"}
                </button>
              </div>
            </div>

            {/* OpenAI Key Input */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="openai-key" className="text-sm font-semibold">
                  OpenAI API Key
                </label>
                <span className="text-xs text-muted-foreground">gpt-4o-mini</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Get your key at platform.openai.com/api-keys.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 sm:flex-nowrap">
                <input
                  id="openai-key"
                  type="password"
                  value={openAiKey}
                  onChange={(e) => handleSaveOpenAI(e.target.value)}
                  placeholder="sk-proj-..."
                  className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
                />
                <button
                  type="button"
                  onClick={() => void runTest("openai", openAiKey)}
                  disabled={testingProvider !== null || !openAiKey.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {testingProvider === "openai" ? "Testing…" : "Test OpenAI"}
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className="rounded-lg border p-3 text-sm transition-all"
                style={{
                  borderColor: testResult.success ? "var(--color-good)" : "var(--color-bad)",
                  color: testResult.success ? "var(--color-good)" : "var(--color-bad)",
                  background: testResult.success
                    ? "color-mix(in oklab, var(--color-good) 8%, transparent)"
                    : "color-mix(in oklab, var(--color-bad) 8%, transparent)",
                }}
              >
                {testResult.success ? "✓ " : "✕ "}
                {testResult.message}
              </div>
            )}
          </div>
        </section>

        {/* Environmental Settings Panel */}
        <section aria-labelledby="general-settings" className="panel px-6 py-2">
          <h2 id="general-settings" className="sr-only">
            General Preferences
          </h2>
          <Row
            label="Location"
            description={context ? `${context.location.name} · ${context.timezone}` : "Choose where to interpret conditions"}
          >
            <LocationSelector />
          </Row>
          <Row label="Temperature units" description="Used everywhere temperatures appear">
            <Toggle
              value={settings.tempUnit}
              onChange={(v) => updateSettings({ tempUnit: v })}
              options={[
                { value: "C", label: "Celsius" },
                { value: "F", label: "Fahrenheit" },
              ]}
            />
          </Row>
          <Row label="Measurement units" description="Wind speed and visibility">
            <Toggle
              value={settings.units}
              onChange={(v) => updateSettings({ units: v })}
              options={[
                { value: "metric", label: "Metric" },
                { value: "imperial", label: "Imperial" },
              ]}
            />
          </Row>
          <Row label="Time format" description="Times and best-time windows">
            <Toggle
              value={settings.timeFormat}
              onChange={(v) => updateSettings({ timeFormat: v })}
              options={[
                { value: "24h", label: "24 hour" },
                { value: "12h", label: "12 hour" },
              ]}
            />
          </Row>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          Preferences &amp; API keys are stored in your local browser only — never transmitted to external databases.
        </p>
      </div>
    </div>
  );
}
