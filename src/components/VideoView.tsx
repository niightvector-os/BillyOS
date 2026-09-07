"use client";

import { useState, useEffect, useRef } from "react";

type Video = { id: string; title: string; channel: string; thumbnail: string; duration?: string; views?: string };
export type VideoData = { topic: string; videos: Video[] };

export default function VideoView({
  topic,
  videos,
  onClose,
  onSearch,
  loading,
  authHeaders,
}: {
  topic: string;
  videos: Video[];
  onClose: () => void;
  onSearch: (query: string) => void;
  loading?: boolean;
  authHeaders: () => Promise<Record<string, string>>;
}) {
  const [directVideo, setDirectVideo] = useState<Video | null>(null);
  const [query, setQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = directVideo || videos[0];
  const isPlaying = !!current;

  useEffect(() => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }
    suggestDebounce.current = setTimeout(() => {
      fetch("/api/video/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
        .then((r) => r.json())
        .then((data) => setSearchSuggestions(data.suggestions || []))
        .catch(() => {});
    }, 250);
  }, [query]);

  async function logWatch(v: { id: string; title: string; channel: string; thumbnail: string }, q?: string) {
    try {
      const headers = await authHeaders();
      if (Object.keys(headers).length === 0) return;
      await fetch("/api/video/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ videoId: v.id, title: v.title, channel: v.channel, thumbnail: v.thumbnail, query: q || undefined }),
      });
    } catch {}
  }

  // Play a specific video directly — no re-search, no risk of a different
  // video loading than the one clicked.
  function playDirect(v: Video, searchQueryForRelated?: string) {
    setDirectVideo(v);
    logWatch(v, searchQueryForRelated);
    if (searchQueryForRelated) onSearch(searchQueryForRelated); // populates the related-videos rail
  }

  function runSearch(q: string) {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setDirectVideo(null);
    onSearch(q);
    setQuery("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  return (
    <div className="yt-stage-full">
      <div className="yt-main yt-main-full">
        <div className="yt-topbar">
          <button
            className="yt-logo-lockup"
            onClick={() => { setDirectVideo(null); onSearch(""); }}
            aria-label="Search with Video"
            type="button"
          >
            <span className="yt-logo-main">SEARCH</span>
            <span className="yt-logo-sub">with Video</span>
          </button>

          <div className="yt-search-bar-wrap">
            <form className="yt-search-bar" onSubmit={handleSubmit} autoComplete="off">
              <input
                type="text"
                placeholder="Search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                disabled={loading}
              />
              <button type="submit" className="yt-search-btn" disabled={loading} aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </form>
            <button
              type="button"
              className="yt-mic-btn"
              aria-label="Voice search"
              onClick={() => {
                const SpeechRecognitionCtor = (window as unknown as { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any }).webkitSpeechRecognition || (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition;
                if (!SpeechRecognitionCtor) return;
                const recognition = new SpeechRecognitionCtor();
                recognition.lang = "en-US";
                recognition.onresult = (e: any) => {
                  const transcript = e.results[0][0].transcript;
                  runSearch(transcript);
                };
                recognition.start();
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
                <path d="M12 19v3" />
              </svg>
            </button>
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="yt-suggest-dropdown">
                {searchSuggestions.map((s, i) => (
                  <button key={i} className="yt-suggest-item" onMouseDown={() => runSearch(s)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="yt-exit" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="yt-content-full">
          {isPlaying && current && (
            <div className="yt-watch-layout yt-cinematic">
              <div className="yt-watch-main">
                <div className="yt-player yt-player-cinematic">
                  <iframe
                    key={current.id}
                    src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0`}
                    title={current.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="yt-watch-desc">
                  <h2 className="yt-current-title">{current.title}</h2>
                  <p className="yt-current-channel">{current.channel}</p>
                </div>
              </div>
              <div className="yt-watch-side">
                <h3 className="yt-related-label">Related videos</h3>
                {videos.map((v) => (
                  <button key={v.id} className={`yt-side-card ${v.id === current.id ? "active" : ""}`} onClick={() => playDirect(v)}>
                    <div className="yt-side-card-thumb"><img src={v.thumbnail} alt={v.title} /></div>
                    <div className="yt-side-card-info">
                      <span className="yt-card-title">{v.title}</span>
                      <span className="yt-card-channel">{v.channel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <p className="thinking-text" style={{ marginTop: 24 }}>Searching...</p>}

          {!isPlaying && !loading && (
            <div className="yt-landing">
              <h2 className="yt-landing-title">Search anything to start watching</h2>
              <p className="yt-landing-sub">Type a topic or question above and we'll find the video for you.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
