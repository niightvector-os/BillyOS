"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useConfirm } from "@/lib/confirm-context";

type Message = { role: "user" | "assistant"; content: string };

export default function GhostMode({ onExit }: { onExit: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);
  const confirm = useConfirm();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function requestExit() {
    if (messages.length > 0) {
      const ok = await confirm("Leave Ghost Mode? This conversation will be permanently discarded.");
      if (ok) onExit();
    } else {
      onExit();
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestExit();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [messages.length]);

  // Warn on tab close / navigation away, but only if there's actually something to lose
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (messages.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [messages.length]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distanceFromBottom < 80;
  }

  useEffect(() => {
    if (stickToBottom.current && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    stickToBottom.current = true;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, complexity: "normal" }),
      });

      let assistantText = "";
      if (!res.ok) {
        assistantText = "Sorry — the AI is temporarily unavailable.";
        setMessages([...next, { role: "assistant", content: assistantText }]);
      } else {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            assistantText += decoder.decode(value, { stream: true });
            setMessages([...next, { role: "assistant", content: assistantText }]);
          }
        }
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry — something went wrong." }]);
    }

    setLoading(false);
  }

  const idle = messages.length === 0;

  const searchForm = (
    <form className={`search-shell ${idle ? "" : "search-shell-docked"}`} onSubmit={handleSubmit}>
      <div className="search-bar ghost-search-bar">
        <svg className="icon-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask anything — nothing is saved..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="icon-btn" aria-label="Send" disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  );

  return (
    <div className="ghost-stage ghost-enter">
      <div className="ghost-header">
        <div className="ghost-header-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C7.58 2 4 5.58 4 10v10l3-2 2.5 2 2.5-2 2.5 2 2.5-2 3 2V10c0-4.42-3.58-8-8-8Z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
          </svg>
          Ghost Mode
        </div>
        <button className="ghost-exit" onClick={requestExit}>Exit</button>
      </div>

      {noticeVisible && (
        <div className="ghost-notice">
          <div className="ghost-notice-title">Ghost Mode</div>
          <p className="ghost-notice-text">
            This is a temporary conversation. Chats started in Ghost Mode are not saved to your chat history
            and won&apos;t appear alongside your regular conversations. Once you leave this session, it is permanently discarded.
          </p>
          <button className="ghost-notice-dismiss" onClick={() => setNoticeVisible(false)}>Dismiss</button>
        </div>
      )}

      {idle ? (
        <div className="ghost-idle">
          <div className="ghost-orb" />
          <h1 className="ghost-title">Ghost Mode</h1>
          <p className="ghost-subtitle">Nothing said here is remembered.</p>
          {searchForm}
        </div>
      ) : (
        <>
          <div className="conversation-full ghost-conversation" ref={scrollRef} onScroll={handleScroll}>
            <div className="conversation-inner">
              {messages.map((m, i) => (
                <div key={i} className={`msg-block ${m.role}`}>
                  <div className={`msg ${m.role}`}>
                    {m.role === "assistant" ? (
                      m.content ? (
                        <div className="md-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      ) : loading && i === messages.length - 1 ? (
                        <span className="thinking-text">Thinking...</span>
                      ) : null
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="bottom-fade" />
          </div>
          {searchForm}
        </>
      )}
    </div>
  );
}
