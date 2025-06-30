"use client";

import { useRouter } from "next/navigation";
import React from "react";

interface Lang {
  code: string;
  flag: string; // emoji or icon
}

const AVAILABLE_LANGS: Lang[] = [
  { code: "fr", flag: "🇫🇷" },
  { code: "en", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" },
  { code: "de", flag: "🇩🇪" },
  { code: "it", flag: "🇮🇹" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const [current, setCurrent] = React.useState<string>("fr");

  React.useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("locale") : null;
    const lang =
      stored ||
      document.documentElement.lang ||
      navigator.language.split("-")[0] ||
      "fr";
    setCurrent(lang);
  }, []);

  const changeLang = (code: string) => {
    localStorage.setItem("locale", code);
    document.documentElement.lang = code;
    setCurrent(code);
    // Hard reload to remount client components so <Translate> picks up the new locale
    window.location.reload();
  };

  return (
    <div className="flex space-x-1">
      {AVAILABLE_LANGS.map(({ code, flag }) => (
        <button
          key={code}
          aria-label={code}
          onClick={() => changeLang(code)}
          className={`text-xl transition-opacity ${
            current === code ? "opacity-100" : "opacity-40 hover:opacity-70"
          }`}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
