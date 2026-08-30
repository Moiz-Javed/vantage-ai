import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChatWindow from "../components/ChatWindow";
import Composer from "../components/Composer";
import { useTheme } from "../hooks/useTheme";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import {
  streamChatMessage,
  fetchConversations,
  fetchConversation,
  fetchPersonas,
  uploadPdf,
  analyzeImage,
  exportConversationAsMarkdown,
} from "../lib/api";

export default function ChatPage() {
  const { getToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { speak } = useTextToSpeech();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeTitle, setActiveTitle] = useState("New conversation");
  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [error, setError] = useState(null);
  const [personas, setPersonas] = useState(["friendly", "professional", "concise", "creative"]);
  const [persona, setPersona] = useState("friendly");
  const [handsFree, setHandsFree] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile drawer state
  const dragCounter = useRef(0);

  const loadConversations = useCallback(async () => {
    try {
      const list = await fetchConversations(getToken);
      setConversations(list);
    } catch {
      // Non-fatal — sidebar just stays empty (e.g. Mongo not configured yet).
    }
  }, [getToken]);

  useEffect(() => {
    loadConversations();
    fetchPersonas().then(setPersonas).catch(() => {});
  }, [loadConversations]);

  const handleSelectConversation = async (id) => {
    setActiveId(id);
    setActiveDocument(null);
    try {
      const convo = await fetchConversation(id, getToken);
      setMessages(convo.messages);
      setActiveTitle(convo.title);
      if (convo.persona) setPersona(convo.persona);
    } catch {
      setError("Couldn't load that conversation.");
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setActiveDocument(null);
    setStreamingText(null);
    setActiveTitle("New conversation");
  };

  const runStream = useCallback(
    async (text, options = {}) => {
      setError(null);
      setIsSending(true);
      setStreamingText("");

      let fullText = "";

      await streamChatMessage({
        message: text,
        conversationId: activeId,
        useDocument: activeDocument,
        persona,
        regenerate: options.regenerate,
        editMessageIndex: options.editMessageIndex,
        getToken,
        onChunk: (chunk) => {
          fullText += chunk;
          setStreamingText(fullText);
        },
        onDone: ({ conversationId }) => {
          setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
          setActiveId(conversationId);
          setStreamingText(null);
          setIsSending(false);
          loadConversations();
          if (handsFree) speak(fullText.replace(/```[\s\S]*?```/g, ""));
        },
        onError: (msg) => {
          setError(msg);
          setStreamingText(null);
          setIsSending(false);
        },
      });
    },
    [activeId, activeDocument, persona, getToken, loadConversations, handsFree, speak]
  );

  const handleSend = (text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    runStream(text);
  };

  const handleEditResend = (index, newText) => {
    setMessages((prev) => [...prev.slice(0, index), { role: "user", content: newText }]);
    runStream(newText, { editMessageIndex: index });
  };

  const handleRegenerate = () => {
    setMessages((prev) => {
      const withoutLastAssistant = prev[prev.length - 1]?.role === "assistant" ? prev.slice(0, -1) : prev;
      return withoutLastAssistant;
    });
    runStream(null, { regenerate: true });
  };

  const handleUploadPdf = async (file) => {
    setError(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Uploaded **${file.name}**`, attachment: { type: "pdf", name: file.name } },
    ]);
    try {
      const result = await uploadPdf(file, getToken);
      setActiveDocument(result.documentName);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Got it — I've read **${result.documentName}** (${result.pages} pages, ${result.chunksStored} sections indexed). Ask me anything about it.`,
        },
      ]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadImage = async (file) => {
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `![uploaded image](${previewUrl})`, attachment: { type: "image", name: file.name } },
    ]);
    setIsSending(true);
    try {
      const result = await analyzeImage(file, null, getToken);
      setMessages((prev) => [...prev, { role: "assistant", content: result.description }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setIsDragging(false);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf") handleUploadPdf(file);
    else if (file.type.startsWith("image/")) handleUploadImage(file);
    else setError("Only PDF and image files can be dropped here.");
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div
        className="flex-1 flex flex-col min-w-0 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center border-4 border-dashed pointer-events-none"
            style={{ background: "rgba(76,201,192,0.1)", borderColor: "var(--accent)" }}
          >
            <p className="text-lg font-semibold text-center px-4" style={{ color: "var(--accent)" }}>
              Drop a PDF or image to upload
            </p>
          </div>
        )}

        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          persona={persona}
          personas={personas}
          onPersonaChange={setPersona}
          handsFree={handsFree}
          onToggleHandsFree={() => setHandsFree((h) => !h)}
          onExport={() => exportConversationAsMarkdown(activeTitle, messages)}
          canExport={messages.length > 0}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <ChatWindow
          messages={messages}
          streamingText={streamingText}
          theme={theme}
          onEditResend={handleEditResend}
          onRegenerate={handleRegenerate}
          onSuggestion={handleSend}
        />
        <div className="px-2 sm:px-4 pb-4">
          <div className="max-w-3xl mx-auto w-full">
            {error && (
              <p className="text-xs mb-2 px-1" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}
            <Composer
              onSend={handleSend}
              onUploadPdf={handleUploadPdf}
              onUploadImage={handleUploadImage}
              isSending={isSending}
              activeDocument={activeDocument}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
