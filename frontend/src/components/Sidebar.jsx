import { Plus, MessageSquare } from "lucide-react";

export default function Sidebar({ conversations, activeId, onSelect, onNewChat }) {
  return (
    <aside
      className="w-64 flex-shrink-0 h-full flex flex-col border-r p-3"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium mb-3 transition-opacity hover:opacity-90"
        style={{ background: "var(--accent)", color: "#0b1120" }}
      >
        <Plus size={16} /> New chat
      </button>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {conversations.length === 0 && (
          <p className="text-xs text-center mt-8 px-2" style={{ color: "var(--text-muted)" }}>
            Your conversations will appear here.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c._id}
            onClick={() => onSelect(c._id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left truncate transition-colors"
            style={{
              background: activeId === c._id ? "var(--bg-elevated-2)" : "transparent",
              color: activeId === c._id ? "var(--text)" : "var(--text-muted)",
            }}
          >
            <MessageSquare size={14} className="flex-shrink-0" />
            <span className="truncate">{c.title}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
