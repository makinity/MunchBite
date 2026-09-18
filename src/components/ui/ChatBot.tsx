"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, RotateCcw, ChevronDown, Bot } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey there! 🍪 I'm Bukitla, your MunchBite assistant! I can help you with our treats, orders, and anything sweet-related. What can I help you with today?",
  timestamp: new Date(),
};

const QUICK_PROMPTS = [
  "What treats do you have? 🍪",
  "How do I place an order?",
  "Do you do custom orders?",
  "What are your best sellers?",
];

// ─── Helper: generate unique ID ───────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      {/* Bot avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-peach flex items-center justify-center shadow-sm">
        <Bot size={15} strokeWidth={2} className="text-white" />
      </div>
      <div className="bg-white border border-soft-pink rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-peach animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-peach animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-peach animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Single Chat Bubble ───────────────────────────────────────────────────────
function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-peach text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      {/* Bot avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-peach flex items-center justify-center shadow-sm">
        <Bot size={15} strokeWidth={2} className="text-white" />
      </div>
      <div className="max-w-[80%] bg-white border border-soft-pink rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm text-sm leading-relaxed text-chocolate whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}

// ─── Main ChatBot Component ───────────────────────────────────────────────────
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Auto-scroll to bottom ──────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // On new messages, scroll down
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen, scrollToBottom]);

  // Show "scroll to bottom" button when user scrolls up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(distFromBottom > 80);
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  // When chat opens, clear unread and focus input
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
      scrollToBottom("instant");
    }
  }, [isOpen, scrollToBottom]);

  // ─── Send Message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: uid(),
        role: "user",
        content: trimmed,
      timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // Build history (exclude welcome for brevity, keep last 10 turns)
        const history = messages
          .filter((m) => m.id !== "welcome")
          .slice(-10)
          .map(({ role, content }) => ({ role, content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: trimmed }],
          }),
        });

        const data = await res.json();

        const assistantMessage: Message = {
          id: uid(),
          role: "assistant",
          content:
            data.reply ??
            "Oops, something went wrong on my end! 😅 Try again?",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // If chat is closed, show unread badge
        if (!isOpen) setHasUnread(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              "Hmm, I couldn't connect right now. 😕 Please check your connection and try again!",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isOpen, messages]
  );

  // ─── Handle Enter key ───────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ─── Auto-resize textarea ───────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Reset height then grow
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ─── Reset Chat ─────────────────────────────────────────────────────────────
  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    inputRef.current?.focus();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Toggle Button ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Open Bukitla chat assistant"}
        aria-expanded={isOpen}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-peach text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          text-2xl
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          focus-visible:outline-2 focus-visible:outline-peach focus-visible:outline-offset-2
          ${isOpen ? "rotate-0 scale-90" : "rotate-0"}
        `}
      >
        {isOpen ? (
          <X size={22} strokeWidth={2.5} />
        ) : (
          <Bot size={24} strokeWidth={2} />
        )}

        {/* Unread badge */}
        {!isOpen && hasUnread && (
          <span
            aria-label="New message"
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-soft-pink border-2 border-white rounded-full animate-pulse"
          />
        )}
      </button>

      {/* ── Chat Window ── */}
      <div
        role="dialog"
        aria-label="Bukitla — MunchBite Chat Assistant"
        aria-modal="false"
        className={`
          fixed bottom-24 right-6 z-40
          w-[calc(100vw-3rem)] max-w-sm
          bg-cream rounded-3xl
          shadow-2xl border border-soft-pink
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out origin-bottom-right
          ${isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }
        `}
        style={{ maxHeight: "min(600px, calc(100dvh - 8rem))" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-peach text-white flex-shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 flex-shrink-0">
            <Bot size={20} strokeWidth={2} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">Bukitla</p>
            <p className="text-xs text-white/80 truncate">MunchBite Assistant · Always here! 🩷</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetChat}
              aria-label="Reset conversation"
              title="New conversation"
              className="p-1.5 rounded-xl hover:bg-white/20 transition-colors duration-150"
            >
              <RotateCcw size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="p-1.5 rounded-xl hover:bg-white/20 transition-colors duration-150"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#FFB07C #FFF8E7" }}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            aria-label="Scroll to latest message"
            className="absolute right-4 bottom-28 z-10 w-7 h-7 rounded-full bg-peach text-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          >
            <ChevronDown size={15} />
          </button>
        )}

        {/* ── Quick Prompts ── */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2 flex-shrink-0">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-soft-pink text-chocolate hover:bg-soft-pink hover:border-soft-pink transition-colors duration-150 font-medium shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* ── Input Bar ── */}
        <div className="px-3 py-3 bg-white border-t border-soft-pink flex items-end gap-2 flex-shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Bukitla anything… 🍪"
            rows={1}
            disabled={isLoading}
            aria-label="Chat message input"
            className="
              flex-1 resize-none bg-cream rounded-2xl
              px-4 py-2.5 text-sm text-chocolate
              placeholder:text-chocolate/40
              border border-soft-pink
              focus:outline-none focus:border-peach focus:ring-1 focus:ring-peach
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              leading-relaxed
            "
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="
              flex-shrink-0 w-10 h-10 rounded-full
              bg-peach text-white
              flex items-center justify-center
              shadow-md hover:shadow-lg
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:scale-105 active:scale-95
              transition-all duration-150
            "
          >
            <Send size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
}
