"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/lib/chat-context";
import StudyMode, { StudySet } from "@/components/StudyMode";
import MapView, { MapData } from "@/components/MapView";
import InlineMap from "@/components/InlineMap";
import VideoView, { VideoData } from "@/components/VideoView";
import VisualizeView, { VisualizeData } from "@/components/VisualizeView";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-context";
import { getErrorMessage } from "@/lib/errors";

const MODES = [
  { key: "research", sym: "✦", label: "Deep Research", prefix: "" },
  { key: "visualize", sym: "◇", label: "Visualize", prefix: "" },
  { key: "map", sym: "⌖", label: "Find on Map", prefix: "" },
  { key: "video", sym: "▶", label: "Explain with Video", prefix: "" },
  { key: "study", sym: "▣", label: "Study Mode", prefix: "" },
];

const THINKING_WORDS = ["Thinking", "Mulling it over", "Piecing it together", "Working on it", "Gathering thoughts", "Almost there"];
function pickGreeting(name?: string | null) {
  const named = [
    `What are we doing today, ${name}?`,
    `What's on your mind today, ${name}?`,
    `Alright, ${name} — what are we working on?`,
    `Good to see you, ${name}. What can I help you with?`,
    `So, ${name}… what are we getting into today?`,
    `Ready when you are, ${name}. What's the plan?`,
    `What can BillyOS help you with today, ${name}?`,
  ];
  const generic = [
    "What are we doing today?",
    "What's on your mind?",
    "Ready when you are — what's the plan?",
    "What can BillyOS help you with today?",
    "So... what are we getting into today?",
  ];
  const pool = name ? named : generic;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function Core({ onOpenCode }: { onOpenCode: () => void }) {
  const toast = useToast();
  const { messages, loading, isSearching, usageWarning, sendMessage, sendResearchMessage, stopGeneration, saveModeResult, pendingLoad, clearPendingLoad, profile, truncateForEdit } = useChat();
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ filename: string; extractedText: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [studyData, setStudyData] = useState<StudySet | null>(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [visualizeData, setVisualizeData] = useState<VisualizeData | null>(null);
  const [visualizeLoading, setVisualizeLoading] = useState(false);
  const [thinkingWord, setThinkingWord] = useState(THINKING_WORDS[0]);
  const [greeting, setGreeting] = useState("What are we doing today?");
  const wasIdleRef = useRef(false);
  const isIdleNow = messages.length === 0;
  if (isIdleNow && !wasIdleRef.current) {
    wasIdleRef.current = true;
    const nextGreeting = pickGreeting(profile.display_name || profile.nickname);
    if (nextGreeting !== greeting) setGreeting(nextGreeting);
  } else if (!isIdleNow && wasIdleRef.current) {
    wasIdleRef.current = false;
  }
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);

  type SpeechResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
  type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechResultEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  };
  type WindowWithSpeech = Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceSupported =
    typeof window !== "undefined" &&
    !!((window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition);

  const busy = studyLoading || mapLoading || videoLoading || visualizeLoading;

  useEffect(() => {
    const SpeechRecognitionCtor = (window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event: SpeechResultEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
      inputRef.current?.focus();
    }
  }

  const lastPendingLoadRef = useRef<typeof pendingLoad>(null);
  if (pendingLoad && pendingLoad !== lastPendingLoadRef.current) {
    lastPendingLoadRef.current = pendingLoad;
    const payload = pendingLoad.data as Record<string, unknown>;
    if (pendingLoad.mode === "study") setStudyData(payload as unknown as StudySet);
    else if (pendingLoad.mode === "map") setMapData({ topic: pendingLoad.title, locations: payload.locations as MapData["locations"] });
    else if (pendingLoad.mode === "video") setVideoData({ topic: pendingLoad.title, videos: payload.videos as VideoData["videos"] });
    else if (pendingLoad.mode === "visualize") setVisualizeData({ question: pendingLoad.title, ...payload } as unknown as VisualizeData);
  }

  useEffect(() => {
    if (pendingLoad) clearPendingLoad();
  }, [pendingLoad, clearPendingLoad]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distanceFromBottom < 80;
  }

  useEffect(() => {
    if (stickToBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setThinkingWord(THINKING_WORDS[0]);
    const id = setInterval(() => {
      i = (i + 1) % THINKING_WORDS.length;
      setThinkingWord(THINKING_WORDS[i]);
    }, 1500);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      const active = document.activeElement;
      const alreadyTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
      if (alreadyTyping || studyData || mapData || videoData || visualizeData || isListening) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1) {
        e.preventDefault();
        setInput((prev) => prev + e.key);
        inputRef.current?.focus();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setInput((prev) => prev.slice(0, -1));
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [studyData, mapData, videoData, visualizeData, isListening]);


  async function authHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || busy) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    if (activeMode === "study") {
      const topic = input;
      setInput(""); setActiveMode(null); setStudyLoading(true);
      try {
        const res = await fetch("/api/study", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ topic }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setStudyData(data);
        saveModeResult("study", data.topic || topic, data);
      } catch { toast("Couldn't build a study set right now — please try again."); }
      setStudyLoading(false);
      return;
    }

    if (activeMode === "map") {
      const topic = input;
      setInput(""); setActiveMode(null); setMapLoading(true);
      try {
        const res = await fetch("/api/map", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ topic }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMapData(data);
        saveModeResult("map", data.topic || topic, { locations: data.locations });
      } catch (err) { toast(getErrorMessage(err) || "Couldn't find that location — please try again."); }
      setMapLoading(false);
      return;
    }

    if (activeMode === "video") {
      const topic = input;
      setInput(""); setActiveMode(null); setVideoLoading(true);
      try {
        const res = await fetch("/api/video", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ topic }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setVideoData(data);
        saveModeResult("video", data.topic || topic, { videos: data.videos });
      } catch (err) { toast(getErrorMessage(err) || "Couldn't find a video for that — please try again."); }
      setVideoLoading(false);
      return;
    }

    if (activeMode === "visualize") {
      const question = input;
      setInput(""); setActiveMode(null); setVisualizeLoading(true);
      try {
        const res = await fetch("/api/visualize", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setVisualizeData({ question, ...data });
        saveModeResult("visualize", question, data);
      } catch (err) { toast(getErrorMessage(err) || "Could not analyze that right now — please try again."); }
      setVisualizeLoading(false);
      return;
    }

    if (activeMode === "research") {
      const query = input;
      setInput(""); setActiveMode(null);
      stickToBottom.current = true;
      await sendResearchMessage(query);
      return;
    }

    const displayText = input;
    setInput(""); setActiveMode(null); stickToBottom.current = true;
    await sendMessage(displayText);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingFile(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { toast("Please sign in to upload files."); setUploadingFile(false); return; }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAttachedFile({ filename: data.filename, extractedText: data.extractedText });
    } catch (err) {
      toast(getErrorMessage(err) || "Couldn't upload that file.");
    }
    setUploadingFile(false);
  }

  async function handleEdit(index: number, content: string) {
    await truncateForEdit(index);
    setInput(content);
    inputRef.current?.focus();
  }

  async function handleRegenerate(userContent: string, assistantIndex: number) {
    await truncateForEdit(Math.max(assistantIndex - 1, 0));
    await sendMessage(userContent);
  }

  function handleCopy(content: string, index: number) {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  const idle = messages.length === 0;

  if (studyData) return <StudyMode data={studyData} onClose={() => setStudyData(null)} />;
  if (mapData) return <MapView topic={mapData.topic} locations={mapData.locations} isRoute={mapData.isRoute} routes={mapData.routes} onClose={() => setMapData(null)} />;
  if (videoData) return <VideoView topic={videoData.topic} videos={videoData.videos} onClose={() => setVideoData(null)} />;
  if (visualizeData) return <VisualizeView data={visualizeData} onClose={() => setVisualizeData(null)} />;

  return (
    <>
      {idle && (
        <div className="core-wrap">
          <div className="core-center" />
          <div className="core-wordmark">BillyOS</div>
          <h1 className="title">{greeting}</h1>
        </div>
      )}

      {!idle && (
        <div className="conversation-full" ref={scrollRef} onScroll={handleScroll}>
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
                      <span className="thinking-text">{isSearching ? "Searching the web..." : thinkingWord + "..."}</span>
                    ) : null
                  ) : (
                    m.content
                  )}
                </div>

                {m.role === "assistant" && m.images && m.images.length > 0 && (
                  <div className="image-strip">
                    {m.images.map((img, idx) => (
                      <a key={idx} href={img.pageUrl} target="_blank" rel="noopener noreferrer" className="image-strip-item">
                        <img src={img.url} alt={img.title} loading="lazy" />
                        <span>{img.title}</span>
                      </a>
                    ))}
                  </div>
                )}

                {m.role === "assistant" && m.mapLocations && m.mapLocations.length > 0 && (
                  <InlineMap locations={m.mapLocations} />
                )}

                {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                  <div className="source-list">
                    {m.sources.map((s, idx) => (
                      <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="source-item">
                        <span className="source-num">[{idx + 1}]</span> {s.title}
                      </a>
                    ))}
                  </div>
                )}

                {m.role === "assistant" && m.content && (
                  <button className="msg-copy" onClick={() => handleCopy(m.content, i)}>
                    {copiedIndex === i ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            ))}
          </div>
          {!idle && <div className="bottom-fade" />}
        </div>
      )}

      <form className={`search-shell ${idle ? "search-shell-center" : "search-shell-docked"}`} onSubmit={handleSubmit}>
        {usageWarning && (
          <div className="usage-warning">{usageWarning}</div>
        )}
        <div className="search-bar">
          <svg className="icon-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isListening ? "Listening..." :
              studyLoading ? "Building your study set..." :
              mapLoading ? "Finding locations..." :
              videoLoading ? "Finding a video..." :
              visualizeLoading ? "Analyzing..." :
              activeMode ? `${MODES.find((m) => m.key === activeMode)?.label} — ask anything...` :
              "Ask BillyOS anything..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          {voiceSupported && (
            <button
              type="button"
              className={`icon-btn mic-btn ${isListening ? "mic-active" : ""}`}
              onClick={toggleListening}
              aria-label={isListening ? "Stop listening" : "Speak your question"}
              disabled={busy}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
              </svg>
            </button>
          )}
          {loading ? (
            <button type="button" className="icon-btn stop-btn" onClick={stopGeneration} aria-label="Stop">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
          ) : (
            <button type="submit" className="icon-btn" aria-label="Send" disabled={busy}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
                <div className="modes">
  {MODES.map((m) => (
    <div
      key={m.key}
      className={`mode-pill ${activeMode === m.key ? "mode-active" : ""}`}
      onClick={() => setActiveMode(activeMode === m.key ? null : m.key)}
    >
      <span className="sym">{m.sym}</span> {m.label}
    </div>
  ))}

  <button
    type="button"
    className={`mode-pill ${activeMode === "code" ? "mode-active" : ""}`}
    onClick={onOpenCode}
  >
    <span className="sym">&lt;/&gt;</span> Code
  </button>
</div>

      </form>
    </>
  );
}
