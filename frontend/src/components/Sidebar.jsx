import { Plus, MessageSquare, X } from "lucide-react";

export default function Sidebar({ conversations, activeId, onSelect, onNewChat, isOpen, onClose }) {
  return (
    <>
      {/* Backdrop — only rendered/visible on mobile when the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-64 flex-shrink-0 h-full flex flex-col border-r p-3
          fixed inset-y-0 left-0 z-40 transition-transform duration-200
          md:static md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3 md:hidden">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Conversations
          </span>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <button
          onClick={() => {
            onNewChat();
            onClose?.();
          }}
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
              onClick={() => {
                onSelect(c._id);
                onClose?.();
              }}
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
    </>
  );
}
