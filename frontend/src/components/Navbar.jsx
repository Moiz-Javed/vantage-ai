import { UserButton } from "@clerk/clerk-react";
import { Download, Headphones, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import VantageMark from "./VantageMark";

const PERSONA_LABELS = {
  friendly: "Friendly",
  professional: "Professional",
  concise: "Concise",
  creative: "Creative",
};

export default function Navbar({
  theme,
  onToggleTheme,
  persona,
  personas,
  onPersonaChange,
  handsFree,
  onToggleHandsFree,
  onExport,
  canExport,
  onOpenSidebar,
}) {
  return (
    <header
      className="h-14 flex-shrink-0 flex items-center justify-between px-2 sm:px-4 border-b gap-2"
      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
    >
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg md:hidden flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
          aria-label="Open conversation list"
        >
          <Menu size={20} />
        </button>
        <VantageMark size={22} />
        <span
          className="font-semibold tracking-tight hidden sm:inline truncate"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Vantage AI
        </span>
      </div>

      <select
        value={persona}
        onChange={(e) => onPersonaChange(e.target.value)}
        className="text-xs rounded-lg px-2 py-1.5 outline-none border min-w-0 flex-shrink"
        style={{ background: "var(--bg-elevated-2)", color: "var(--text)", borderColor: "var(--border)" }}
        title="Assistant tone"
      >
        {personas.map((p) => (
          <option key={p} value={p}>
            {PERSONA_LABELS[p] || p}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
        <button
          onClick={onToggleHandsFree}
          className="p-1.5 sm:p-2 rounded-lg transition-colors"
          style={{ color: handsFree ? "var(--accent)" : "var(--text-muted)" }}
          title={handsFree ? "Hands-free mode on: replies are read aloud automatically" : "Turn on hands-free mode (auto-read replies)"}
        >
          <Headphones size={17} />
        </button>
        <button
          onClick={onExport}
          disabled={!canExport}
          className="p-1.5 sm:p-2 rounded-lg transition-colors disabled:opacity-30"
          style={{ color: "var(--text-muted)" }}
          title="Export this conversation as Markdown"
        >
          <Download size={17} />
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
