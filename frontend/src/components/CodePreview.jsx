import { useState } from "react";
import { Play, X, Code2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const PREVIEWABLE = ["html", "htm"];

/**
 * Renders a fenced code block with real syntax highlighting, a copy
 * button, and — for HTML — a Play button that runs it live in a sandboxed
 * iframe (sandbox="allow-scripts", no allow-same-origin).
 */
export default function CodePreview({ language, code, theme = "dark" }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canPreview = PREVIEWABLE.includes((language || "").toLowerCase());

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-3 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div
        className="flex items-center justify-between px-3 py-2 text-xs font-mono"
        style={{ background: "var(--bg-elevated-2)", color: "var(--text-muted)" }}
      >
        <span className="flex items-center gap-1.5">
          <Code2 size={13} /> {language || "code"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
            title="Copy code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {canPreview && (
            <button
              onClick={() => setPreviewOpen((o) => !o)}
              className="flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-colors"
              style={{ background: previewOpen ? "var(--danger)" : "var(--accent)", color: "#0b1120" }}
            >
              {previewOpen ? <X size={12} /> : <Play size={12} />}
              {previewOpen ? "Close" : "Run"}
            </button>
          )}
        </div>
      </div>

      <SyntaxHighlighter
        language={language || "text"}
        style={theme === "dark" ? oneDark : oneLight}
        customStyle={{ margin: 0, padding: "12px", fontSize: "0.85rem", background: "var(--bg-elevated)" }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>

      <AnimatePresence>
        {previewOpen && canPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ borderTop: `1px solid var(--border)` }}
          >
            <iframe title="Live code preview" srcDoc={code} sandbox="allow-scripts" className="w-full h-full bg-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
