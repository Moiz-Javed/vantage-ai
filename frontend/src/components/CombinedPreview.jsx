import { useMemo, useState } from "react";
import { Play, X, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FENCE_RE = /```(\w+)?\n([\s\S]*?)```/g;

/** Pulls out all fenced code blocks from raw markdown, grouped by language. */
function extractBlocksByLanguage(rawContent) {
  const blocks = { html: [], css: [], js: [], javascript: [] };
  let match;
  const re = new RegExp(FENCE_RE);
  while ((match = re.exec(rawContent)) !== null) {
    const lang = (match[1] || "").toLowerCase();
    if (blocks[lang]) blocks[lang].push(match[2]);
  }
  return blocks;
}

/**
 * If a message contains a separate ```html block plus a ```css and/or
 * ```js block (common when Gemini writes "proper" multi-file code instead
 * of one inline HTML blob), this stitches them into a single runnable page
 * — something a plain single-block preview can't do.
 */
export default function CombinedPreview({ rawContent }) {
  const [open, setOpen] = useState(false);

  const combined = useMemo(() => {
    const blocks = extractBlocksByLanguage(rawContent);
    const js = [...blocks.js, ...blocks.javascript].join("\n");
    if (blocks.html.length === 0 || (blocks.css.length === 0 && !js)) return null;

    const html = blocks.html[0];
    const css = blocks.css.join("\n");

    // If the HTML already has its own <html> tag, inject css/js before
    // </head> / </body> rather than wrapping it again.
    if (/<html[\s>]/i.test(html)) {
      let out = html;
      if (css) out = out.replace(/<\/head>/i, `<style>${css}</style></head>`);
      if (js) out = out.replace(/<\/body>/i, `<script>${js}</script></body>`);
      return out;
    }
    return `<!doctype html><html><head><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
  }, [rawContent]);

  if (!combined) return null;

  return (
    <div className="my-3 rounded-xl border overflow-hidden" style={{ borderColor: "var(--accent)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium"
        style={{ background: "var(--bg-elevated-2)", color: "var(--accent)" }}
      >
        <span className="flex items-center gap-1.5">
          <Layers size={13} /> Combined preview (HTML + CSS/JS)
        </span>
        {open ? <X size={13} /> : <Play size={13} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 360, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <iframe title="Combined live preview" srcDoc={combined} sandbox="allow-scripts" className="w-full h-full bg-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
