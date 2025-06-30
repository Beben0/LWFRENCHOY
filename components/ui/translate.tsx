"use client";

import { translate } from "@/lib/translation";
import React from "react";

interface TranslateProps {
  children: React.ReactNode;
  from?: string; // default: 'fr'
  to?: string; // default: browser / url locale
}

/**
 * <Translate>Bonjour</Translate>
 * Renders "Bonjour" for French locale, otherwise translates text with LibreTranslate.
 *
 * Important: Only use with short static strings (navigation labels, UI messages).
 */
export function Translate({ children, from = "fr", to }: TranslateProps) {
  const [output, setOutput] = React.useState(children);

  // Detect target language from the <html lang=".."> attribute or navigator.language
  const targetLang = React.useMemo<string>(() => {
    if (to) return to;

    // 1. LocalStorage override
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("locale");
      if (stored) return stored;
    }

    // 2. <html lang="...">
    if (typeof document !== "undefined") {
      const htmlLang = document?.documentElement?.lang;
      if (htmlLang) return htmlLang.split("-")[0];
    }
    if (typeof navigator !== "undefined") {
      return navigator.language.split("-")[0];
    }
    return "fr";
  }, [to]);

  React.useEffect(() => {
    const text = typeof children === "string" ? children : "";
    if (!text) return;
    if (from === targetLang) {
      setOutput(text);
      return;
    }

    translate(text, { sourceLang: from, targetLang }).then((res) => {
      setOutput(res);
    });
  }, [children, from, targetLang]);

  return <>{output}</>;
}
