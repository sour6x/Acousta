import type { SVGProps, ReactNode } from "react";

export type IconName =
  | "music" | "upload" | "arrow" | "arrow-left" | "play" | "pause"
  | "skip-back" | "skip-forward" | "headphones" | "guitar" | "sliders"
  | "wave" | "plus" | "trash" | "edit" | "check" | "close"
  | "clock" | "repeat" | "info" | "spark" | "menu" | "file"
  | "grid" | "refresh" | "chevron" | "volume" | "book";

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export function Icon({ name, size = 20, ...props }: Props) {
  const paths: Record<IconName, ReactNode> = {
    music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    upload: <><path d="M12 16V3"/><path d="m7 8 5-5 5 5"/><path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>,
    arrow: <><path d="M4 12h16"/><path d="m13 5 7 7-7 7"/></>,
    "arrow-left": <><path d="M20 12H4"/><path d="m11 19-7-7 7-7"/></>,
    play: <path d="m8 5 11 7-11 7V5Z"/>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    "skip-back": <><path d="M5 5v14"/><path d="m19 5-11 7 11 7V5Z"/></>,
    "skip-forward": <><path d="M19 5v14"/><path d="m5 5 11 7-11 7V5Z"/></>,
    headphones: <><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="13" width="4" height="8" rx="2"/><rect x="17" y="13" width="4" height="8" rx="2"/></>,
    guitar: <><path d="M15 5 19 1l4 4-4 4"/><path d="m15 5-4 4"/><path d="M11 9c-1-1-4-1-5 1l-1 2c-.5 1.5-3 1-3 4a5 5 0 0 0 5 5c3 0 2.5-2.5 4-3l2-1c2-1 2-4 1-5"/><circle cx="9" cy="14" r="2"/></>,
    sliders: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="2" fill="currentColor" stroke="none"/></>,
    wave: <><path d="M2 12h2l2-6 4 12 4-16 4 14 2-4h2"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    trash: <><path d="M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v6m4-6v6"/></>,
    edit: <><path d="m4 20 4-.8L20 7a2 2 0 0 0-3-3L5 16z"/><path d="m15 6 3 3"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
    close: <path d="M5 5 19 19M19 5 5 19"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 10V8a2 2 0 0 1 2-2h16"/><path d="m7 22-4-4 4-4"/><path d="M21 14v2a2 2 0 0 1-2 2H3"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/></>,
    spark: <><path d="m12 2 2 7 7 3-7 3-2 7-2-7-7-3 7-3z"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    file: <><path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    refresh: <><path d="M20 8a8 8 0 0 0-14-2L4 8"/><path d="M4 4v4h4"/><path d="M4 16a8 8 0 0 0 14 2l2-2"/><path d="M20 20v-4h-4"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    volume: <><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9a5 5 0 0 1 0 6"/><path d="M20 6a9 9 0 0 1 0 12"/></>,
    book: <><path d="M3 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H3z"/><path d="M21 4h-6a3 3 0 0 0-3 3"/><path d="M21 4v13h-6a3 3 0 0 0-3 3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
