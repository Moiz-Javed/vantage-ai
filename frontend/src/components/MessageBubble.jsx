import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Volume2, VolumeX, FileText, Image as ImageIcon, Sparkles, Pencil, RotateCcw, Check, X } from "lucide-react";
import CodePreview from "./CodePreview";
import CombinedPreview from "./CombinedPreview";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

export default function MessageBubble({ role, content, attachment, theme, onEditResend, onRegenerate, isLatestAssistant }) {
  const isUser = role === "user";
  const { isSpeaking, speak, stop } = useTextToSpeech();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  const submitEdit = () => {
    setIsEditing(false);
    if (draft.trim() && draft !== content) onEditResend?.(draft.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs"
        style={{
          background: isUser ? "var(--bg-elevated-2)" : "var(--accent)",
          color: isUser ? "var(--text)" : "#0b1120",
        }}
      >
        {isUser ? "You" : <Sparkles size={15} />}
      </div>

      <div className={`max-w-[88%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5 min-w-0`}>
        {attachment && (
          <div
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
            style={{ background: "var(--bg-elevated-2)", color: "var(--text-muted)" }}
          >
            {attachment.type === "pdf" ? <FileText size={12} /> : <ImageIcon size={12} />}
            {attachment.name}
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-1.5 w-full">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={2}
              className="rounded-xl px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", border: `1px solid var(--accent)` }}
            />
            <div className="flex gap-2 self-end">
              <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}>
                <X size={14} />
              </button>
              <button onClick={submitEdit} className="p-1.5 rounded-lg" style={{ background: "var(--accent)", color: "#0b1120" }}>
                <Check size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl px-3.5 py-2.5 sm:px-4 text-sm leading-relaxed overflow-x-auto"
            style={{
              background: isUser ? "var(--accent-2)" : "var(--bg-elevated)",
              color: isUser ? "#fff" : "var(--text)",
              border: isUser ? "none" : `1px solid var(--border)`,
            }}
          >
            <ReactMarkdown
              components={{
                code({ inline, className, children }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeText = String(children).replace(/\n$/, "");
                  if (inline) {
                    return (
                      <code className="px-1 py-0.5 rounded font-mono text-xs" style={{ background: "var(--bg-elevated-2)" }}>
                        {children}
                      </code>
                    );
                  }
                  return <CodePreview language={match?.[1]} code={codeText} theme={theme} />;
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {!isUser && <CombinedPreview rawContent={content} />}
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isUser && content && !isEditing && (
            <button
              onClick={() => (isSpeaking ? stop() : speak(content.replace(/```[\s\S]*?```/g, "")))}
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
              style={{ color: "var(--text-muted)" }}
              title={isSpeaking ? "Stop reading" : "Read aloud"}
            >
              {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
              {isSpeaking ? "Stop" : "Listen"}
            </button>
          )}
          {isUser && !isEditing && onEditResend && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
              style={{ color: "var(--text-muted)" }}
              title="Edit and resend"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
          {!isUser && isLatestAssistant && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
              style={{ color: "var(--text-muted)" }}
              title="Regenerate response"
            >
              <RotateCcw size={12} /> Regenerate
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
