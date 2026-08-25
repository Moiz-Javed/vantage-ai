import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import VantageMark from "./VantageMark";

const SUGGESTIONS = [
  "Explain quantum computing like I'm new to it",
  "Write a responsive HTML/CSS pricing card",
  "Summarize the PDF I'm about to upload",
  "Give me 5 icebreaker questions for a team meeting",
];

export default function ChatWindow({ messages, streamingText, theme, onEditResend, onRegenerate, onSuggestion }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && !streamingText) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VantageMark size={56} animated />
        </motion.div>
        <div className="text-center">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Where should we start?
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Type, speak, or drop in a PDF or image.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion?.(s)}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            role={m.role}
            content={m.content}
            attachment={m.attachment}
            theme={theme}
            onEditResend={m.role === "user" ? (text) => onEditResend?.(i, text) : undefined}
            onRegenerate={m.role === "assistant" ? onRegenerate : undefined}
            isLatestAssistant={m.role === "assistant" && i === messages.length - 1}
          />
        ))}
        {streamingText !== null && streamingText !== undefined && (
          <MessageBubble role="assistant" content={streamingText || "▍"} theme={theme} />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
