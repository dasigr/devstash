"use client";

import { useState } from "react";
import Editor, {
  loader,
  type BeforeMount,
  type OnChange,
  type OnMount,
} from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Check, Copy } from "lucide-react";

import { monacoLanguage } from "@/lib/code-types";
import { Button } from "@/components/ui/button";

// Load Monaco from the CDN, pinned to the version we install so the runtime and
// the bundled TypeScript types stay in lockstep.
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs" },
});

const MIN_HEIGHT = 64;
const MAX_HEIGHT = 400;
const THEME = "devstash-dark";

/** Editor background — matches the app's dark `--background` so it reads seamlessly. */
const EDITOR_BG = "#1c1c1c";

/** Register the app's dark theme once, before the first editor mounts. */
const handleBeforeMount: BeforeMount = (monaco) => {
  // Snippets are often fragments, not whole programs — suppress Monaco's TS/JS
  // validation so imports and bare expressions don't get flagged as errors.
  const diagnostics = { noSemanticValidation: true, noSyntaxValidation: true };
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnostics);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnostics);

  monaco.editor.defineTheme(THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": EDITOR_BG,
      "editor.foreground": "#e5e5e5",
      "editorLineNumber.foreground": "#525252",
      "editorLineNumber.activeForeground": "#a3a3a3",
      "editorCursor.foreground": "#e5e5e5",
      "editor.selectionBackground": "#3a3a3a",
      "editor.lineHighlightBackground": "#ffffff08",
      "editorWidget.background": "#292929",
      "editorWidget.border": "#ffffff1a",
      // Themed scrollbar — translucent white sliders over the dark surface.
      "scrollbarSlider.background": "#ffffff20",
      "scrollbarSlider.hoverBackground": "#ffffff35",
      "scrollbarSlider.activeBackground": "#ffffff55",
    },
  });
};

/**
 * A Monaco-backed code editor for snippet/command content. macOS window dots
 * sit on the left of the header, with the language label and a Copy button on
 * the right. Height is fluid — it grows with the content up to `MAX_HEIGHT`,
 * after which Monaco's themed scrollbar takes over. Works in both readonly
 * (display) and editable modes; pass `onChange` for the latter.
 */
export function CodeEditor({
  value,
  language,
  label,
  readOnly = false,
  onChange,
  ariaLabel,
}: {
  value: string;
  language?: string | null;
  /** Header label shown next to Copy — the language, else a type name. */
  label: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
}) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);

  const handleMount: OnMount = (editorInstance) => {
    const updateHeight = () => {
      const contentHeight = editorInstance.getContentHeight();
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
    };
    editorInstance.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  const handleChange: OnChange = (next) => {
    onChange?.(next ?? "");
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can fail (permissions / insecure context); ignore silently.
    }
  }

  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    domReadOnly: readOnly,
    minimap: { enabled: false },
    fontSize: 12,
    fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    scrollBeyondLastColumn: 2,
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      // Let the page scroll through when the editor isn't scrollable.
      alwaysConsumeMouseWheel: false,
    },
    overviewRulerLanes: 0,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    folding: false,
    renderLineHighlight: readOnly ? "none" : "line",
    wordWrap: "off",
    automaticLayout: true,
    tabSize: 2,
    smoothScrolling: true,
    contextmenu: !readOnly,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    stickyScroll: { enabled: false },
  };

  return (
    <div
      className="overflow-hidden rounded-lg border border-border"
      style={{ backgroundColor: EDITOR_BG }}
    >
      {/* Header: macOS dots + language label + copy */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <Button
            variant="ghost"
            size="xs"
            type="button"
            onClick={handleCopy}
            aria-label="Copy content"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <Editor
        height={height}
        language={monacoLanguage(language)}
        value={value}
        theme={THEME}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={options}
        loading={
          <div className="p-4 font-mono text-xs text-muted-foreground">
            Loading editor…
          </div>
        }
        wrapperProps={{ "aria-label": ariaLabel ?? label }}
      />
    </div>
  );
}
