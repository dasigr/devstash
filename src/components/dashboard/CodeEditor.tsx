"use client";

import { useState } from "react";
import Editor, {
  loader,
  type BeforeMount,
  type OnChange,
  type OnMount,
} from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Crown, Loader2, Sparkles } from "lucide-react";

import { explainCode } from "@/actions/ai";
import { monacoLanguage } from "@/lib/code-types";
import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { useEditorPreferences } from "@/components/dashboard/editor-preferences-context";

/** Config that enables the Pro-only "Explain" feature (drawer read view only). */
export interface ExplainConfig {
  /** Whether the signed-in user is Pro. Free users see a Crown + tooltip. */
  isPro: boolean;
  /** The item's title, sent to the model for context. */
  title: string;
}

type EditorView = "code" | "explain";

/** A single Code/Explain tab in the editor header (mirrors MarkdownEditor). */
function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// Load Monaco from the CDN, pinned to the version we install so the runtime and
// the bundled TypeScript types stay in lockstep.
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs" },
});

const MIN_HEIGHT = 64;
const MAX_HEIGHT = 400;

/**
 * Register the two non-built-in themes once, before the first editor mounts.
 * `vs-dark` is built into Monaco, so only `monokai` and `github-dark` are
 * hand-defined here (compact token rules covering the common syntax kinds).
 */
const handleBeforeMount: BeforeMount = (monaco) => {
  // Snippets are often fragments, not whole programs — suppress Monaco's TS/JS
  // validation so imports and bare expressions don't get flagged as errors.
  const diagnostics = { noSemanticValidation: true, noSyntaxValidation: true };
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnostics);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnostics);

  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "88846f" },
      { token: "string", foreground: "e6db74" },
      { token: "number", foreground: "ae81ff" },
      { token: "keyword", foreground: "f92672" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "function", foreground: "a6e22e" },
      { token: "variable", foreground: "f8f8f2" },
      { token: "constant", foreground: "ae81ff" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editorLineNumber.foreground": "#75715e",
      "editorLineNumber.activeForeground": "#c9c9b8",
      "editorCursor.foreground": "#f8f8f0",
      "editor.selectionBackground": "#49483e",
      "editor.lineHighlightBackground": "#3e3d32",
    },
  });

  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8b949e" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
      { token: "variable", foreground: "ffa657" },
      { token: "constant", foreground: "79c0ff" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#e6edf3",
      "editorLineNumber.foreground": "#6e7681",
      "editorLineNumber.activeForeground": "#e6edf3",
      "editorCursor.foreground": "#e6edf3",
      "editor.selectionBackground": "#264f78",
      "editor.lineHighlightBackground": "#161b22",
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
  explain,
}: {
  value: string;
  language?: string | null;
  /** Header label shown next to Copy — the language, else a type name. */
  label: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  /** Enables the Pro-only "Explain" feature. Omit to hide it (e.g. edit forms). */
  explain?: ExplainConfig;
}) {
  const prefs = useEditorPreferences();
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<EditorView>("code");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

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

  async function handleExplain() {
    if (!explain) return;
    setExplaining(true);
    try {
      const result = await explainCode({
        title: explain.title,
        content: value,
        language: language ?? "",
      });
      if (!result.success) {
        toastManager.add({
          title: "Couldn't explain this code",
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      setExplanation(result.data);
      setView("explain");
    } catch {
      toastManager.add({
        title: "Couldn't explain this code",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setExplaining(false);
    }
  }

  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    domReadOnly: readOnly,
    minimap: { enabled: prefs.minimap },
    fontSize: prefs.fontSize,
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
    wordWrap: prefs.wordWrap ? "on" : "off",
    automaticLayout: true,
    tabSize: prefs.tabSize,
    smoothScrolling: true,
    contextmenu: !readOnly,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    stickyScroll: { enabled: false },
  };

  const showTabs = explanation !== null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header: dots (or Code/Explain tabs once explained) on the left; label,
          Explain and Copy on the right. */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2">
        {showTabs ? (
          <div className="flex items-center gap-1">
            <TabButton active={view === "code"} onClick={() => setView("code")}>
              Code
            </TabButton>
            <TabButton
              active={view === "explain"}
              onClick={() => setView("explain")}
            >
              Explain
            </TabButton>
          </div>
        ) : (
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {view === "code" && (
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {label}
            </span>
          )}
          {explain &&
            (explain.isPro ? (
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={handleExplain}
                disabled={explaining}
                aria-label="Explain code"
              >
                {explaining ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Explain
              </Button>
            ) : (
              // Free users: a non-interactive affordance with a native tooltip
              // (matches the app's Pro-gating pattern). A <span> reliably shows
              // its title on hover, unlike a disabled <button>.
              <span
                title="AI features require Pro subscription"
                aria-label="Explain code requires Pro subscription"
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                <Crown className="size-3.5" />
                Explain
              </span>
            ))}
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

      {/* Body — the Monaco editor, or the rendered Markdown explanation, in the
          same container space. The editor stays mounted (hidden) so its fluid
          height and Monaco state survive toggling back to Code. */}
      <div className={view === "explain" ? "hidden" : undefined}>
        <Editor
          height={height}
          language={monacoLanguage(language)}
          value={value}
          theme={prefs.theme}
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
      {view === "explain" && explanation !== null && (
        <div
          className="markdown-preview overflow-y-auto px-4 py-3"
          style={{ maxHeight: MAX_HEIGHT }}
          aria-label={ariaLabel ? `${ariaLabel} explanation` : "Code explanation"}
        >
          <Markdown remarkPlugins={[remarkGfm]}>{explanation}</Markdown>
        </div>
      )}
    </div>
  );
}
