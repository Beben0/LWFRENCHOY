"use client";

import MarkdownIt from "markdown-it";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamic import to avoid SSR issues
const MdEditor = dynamic(() => import("react-markdown-editor-lite"), {
  ssr: false,
});

// Import CSS
import "react-markdown-editor-lite/lib/index.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Tapez votre contenu en Markdown...",
  height = 400,
}: MarkdownEditorProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="border border-border rounded-md bg-background"
        style={{ height }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">
            Chargement de l'éditeur...
          </div>
        </div>
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  // Initialize markdown parser
  const mdParser = new MarkdownIt();

  const handleEditorChange = ({ text }: { text: string }) => {
    onChange(text);
  };

  return (
    <div
      className="markdown-editor-wrapper"
      style={
        {
          "--md-editor-bg": isDark ? "#1a1a1a" : "#ffffff",
          "--md-editor-color": isDark ? "#ffffff" : "#000000",
          "--md-editor-border": isDark ? "#374151" : "#d1d5db",
        } as React.CSSProperties
      }
    >
      <MdEditor
        value={value}
        style={{ height: height }}
        renderHTML={(text) => mdParser.render(text)}
        onChange={handleEditorChange}
        placeholder={placeholder}
        config={{
          view: {
            menu: true,
            md: true,
            html: true,
          },
          canView: {
            menu: true,
            md: true,
            html: true,
            both: true,
            fullScreen: true,
            hideMenu: true,
          },
        }}
      />
      <style jsx global>{`
        .markdown-editor-wrapper .rc-md-editor {
          background-color: var(--md-editor-bg) !important;
          border: 1px solid var(--md-editor-border) !important;
          border-radius: 6px !important;
        }

        .markdown-editor-wrapper
          .rc-md-editor
          .editor-container
          .sec-md
          .input {
          background-color: var(--md-editor-bg) !important;
          color: var(--md-editor-color) !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }

        .markdown-editor-wrapper .rc-md-editor .editor-container .sec-html {
          background-color: var(--md-editor-bg) !important;
          color: var(--md-editor-color) !important;
        }

        .markdown-editor-wrapper .rc-md-editor .header-list {
          background-color: ${isDark ? "#2d2d2d" : "#f5f5f5"} !important;
          border-bottom: 1px solid var(--md-editor-border) !important;
        }

        .markdown-editor-wrapper .rc-md-editor .header-list .header-item {
          color: var(--md-editor-color) !important;
        }

        .markdown-editor-wrapper .rc-md-editor .header-list .header-item:hover {
          background-color: ${isDark ? "#404040" : "#e5e5e5"} !important;
        }
      `}</style>
    </div>
  );
}
