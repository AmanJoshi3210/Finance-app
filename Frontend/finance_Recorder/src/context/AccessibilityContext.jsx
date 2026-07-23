import { createContext, useContext, useEffect, useState } from "react";

const A11Y_KEY = "finance_app_accessibility";

// Root font-size multipliers. Tailwind sizes everything in rem, so scaling the
// root font-size scales the entire UI (spacing included), like a zoom control.
export const TEXT_SCALES = [
  { value: 0.875, label: "Small" },
  { value: 1, label: "Default" },
  { value: 1.125, label: "Large" },
  { value: 1.25, label: "Extra large" },
];

const defaultSettings = () => ({
  textScale: 1,
  boldText: false,
  highContrast: false,
  underlineLinks: false,
  // Honor the OS-level preference until the user overrides it here.
  reduceMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
});

const getInitialSettings = () => {
  const defaults = defaultSettings();
  try {
    const stored = JSON.parse(localStorage.getItem(A11Y_KEY));
    if (!stored || typeof stored !== "object") return defaults;
    const merged = { ...defaults, ...stored };
    if (!TEXT_SCALES.some((s) => s.value === merged.textScale)) merged.textScale = 1;
    return merged;
  } catch {
    return defaults;
  }
};

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(getInitialSettings);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = settings.textScale === 1 ? "" : `${settings.textScale * 100}%`;
    root.classList.toggle("a11y-bold", settings.boldText);
    root.classList.toggle("a11y-high-contrast", settings.highContrast);
    root.classList.toggle("a11y-underline-links", settings.underlineLinks);
    root.classList.toggle("reduce-motion", settings.reduceMotion);
    localStorage.setItem(A11Y_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  // Step the text size up or down one notch (used by the Navbar quick menu).
  const stepTextScale = (direction) =>
    setSettings((prev) => {
      const index = TEXT_SCALES.findIndex((s) => s.value === prev.textScale);
      const next = TEXT_SCALES[index + direction];
      return next ? { ...prev, textScale: next.value } : prev;
    });

  const resetSettings = () => setSettings(defaultSettings());

  return (
    <AccessibilityContext.Provider
      value={{ settings, updateSetting, stepTextScale, resetSettings }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
