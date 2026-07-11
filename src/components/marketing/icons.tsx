import type { ReactNode } from "react";

/**
 * Inline SVG marks for the ChaosField — the tools where developer knowledge
 * scatters today. lucide-react dropped brand icons, so these are hand-inlined.
 * Each renders at 24×24 and inherits `currentColor`.
 */
export interface ChaosIcon {
  name: string;
  svg: ReactNode;
}

export const CHAOS_ICONS: ChaosIcon[] = [
  {
    name: "Notion",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 4.2l12.3-.9c1.5-.1 1.9 0 2.8.7l2.6 1.8c.6.4.8.5.8 1v13c0 .9-.3 1.5-1.5 1.6l-14.3.9c-.9.1-1.3-.1-1.8-.7L2 20.1c-.5-.7-.7-1.2-.7-1.8V5.7c0-.7.3-1.4 1.2-1.5zM17 6.9c.2 0 .1.3-.1.4l-9.7.6c-.3 0-.4.3-.1.5l1.5 1.1c.2.2.5.3.9.2l8.4-.5c.3 0 .4.2.2.4l-.6.3v8.7c0 .4-.2.6-.7.7l-1.3.1v-8l-1.6.1v8.2l-1.3.1c-.4 0-.6-.1-.9-.5l-3.4-5.3v5.1l1.1.3s0 .5-.6.5l-3.1.2c-.1-.2 0-.5.3-.6l.8-.2V9.7l-1-.1c-.1-.4.1-.9.7-1z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1.5A10.5 10.5 0 0 0 8.7 22c.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.3-3.5-1.3-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.1-4.7-5.1 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 4-2.4 4.8-4.7 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z" />
      </svg>
    ),
  },
  {
    name: "Slack",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 15a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 0 1 4 0v5a2 2 0 1 1-4 0v-5zM9 6a2 2 0 1 1 2-2v2H9zm0 1a2 2 0 0 1 0 4H4a2 2 0 1 1 0-4h5zm9 2a2 2 0 1 1 2 2h-2V9zm-1 0a2 2 0 0 1-4 0V4a2 2 0 1 1 4 0v5zm-2 9a2 2 0 1 1-2 2v-2h2zm0-1a2 2 0 0 1 0-4h5a2 2 0 1 1 0 4h-5z" />
      </svg>
    ),
  },
  {
    name: "VS Code",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 2l4 2v16l-4 2-9-8-4 3-2-1v-8l2-1 4 3 9-8zm0 4.9L11.2 12 17 17.1V6.9z" />
      </svg>
    ),
  },
  {
    name: "Browser tabs",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 6V4h6v2" />
      </svg>
    ),
  },
  {
    name: "Terminal",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9l3 3-3 3" />
        <path d="M13 15h4" />
      </svg>
    ),
  },
  {
    name: "Text file",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    name: "Bookmark",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
];
