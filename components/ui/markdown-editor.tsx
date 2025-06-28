"use client";

import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

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

  return (
    <div className="markdown-editor-wrapper">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        data-color-mode={isDark ? "dark" : "light"}
        height={height}
        textareaProps={{
          placeholder,
          style: {
            fontSize: 14,
            lineHeight: 1.5,
          },
        }}
        preview="edit"
        hideToolbar={false}
        visibleDragbar={false}
      />
      <style jsx global>{`
        .markdown-editor-wrapper .w-md-editor {
          background-color: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
        }

        .markdown-editor-wrapper .w-md-editor-text-pre,
        .markdown-editor-wrapper .w-md-editor-text-input,
        .markdown-editor-wrapper .w-md-editor-text {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }

        .markdown-editor-wrapper .w-md-editor-toolbar {
          background-color: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
        }

        .markdown-editor-wrapper .w-md-editor-toolbar-divider {
          background-color: hsl(var(--border));
        }

        .markdown-editor-wrapper .w-md-editor-toolbar li button {
          color: hsl(var(--foreground));
        }

        .markdown-editor-wrapper .w-md-editor-toolbar li button:hover {
          background-color: hsl(var(--accent));
        }

        .markdown-editor-wrapper .token.title {
          color: hsl(var(--primary));
        }

        .markdown-editor-wrapper .token.bold {
          color: hsl(var(--foreground));
          font-weight: bold;
        }

        .markdown-editor-wrapper .token.code {
          background-color: hsl(var(--muted));
          color: hsl(var(--foreground));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  );
}
