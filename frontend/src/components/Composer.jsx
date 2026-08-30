import { useRef, useState } from "react";
import { Send, Mic, Paperclip, ImagePlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSpeechToText } from "../hooks/useSpeechToText";

export default function Composer({ onSend, onUploadPdf, onUploadImage, isSending, activeDocument }) {
  const [text, setText] = useState("");
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const { isSupported: micSupported, isListening, interimTranscript, startListening, stopListening } =
    useSpeechToText({
      onResult: (finalText) => setText((prev) => (prev ? prev + " " : "") + finalText),
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {activeDocument && (
        <div
          className="self-start flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full max-w-full truncate"
          style={{ background: "var(--bg-elevated-2)", color: "var(--accent)" }}
        >
          📄 Answering from: {activeDocument}
        </div>
      )}

      <div
        className="flex items-end gap-1 sm:gap-2 rounded-2xl p-1.5 sm:p-2 border"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Upload a PDF"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files[0] && onUploadPdf(e.target.files[0])}
        />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Upload an image"
        >
          <ImagePlus size={18} />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files[0] && onUploadImage(e.target.files[0])}
        />

        <textarea
          value={isListening ? text + (interimTranscript ? " " + interimTranscript : "") : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
          }}
          placeholder="Message Vantage AI..."
          rows={1}
          className="flex-1 min-w-0 resize-none bg-transparent outline-none py-2 text-sm max-h-32"
          style={{ color: "var(--text)" }}
        />

        {micSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg relative"
            style={{ color: isListening ? "var(--accent-warm)" : "var(--text-muted)" }}
            title={isListening ? "Stop listening" : "Speak your message"}
          >
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-lg"
                style={{ background: "var(--accent-warm)", opacity: 0.25 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
            <Mic size={18} className="relative" />
          </button>
        )}

        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="flex-shrink-0 p-2 sm:p-2.5 rounded-xl transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#0b1120" }}
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </form>
  );
}
