"use client";

import { useState, useEffect, useRef } from "react";

type Video = { id: string; title: string; channel: string; thumbnail: string };
export type VideoData = { topic: string; videos: Video[] };
type FeedVideo = { video_id: string; title: string; channel: string; thumbnail: string; query?: string };
type Tab = "search" | "home" | "shorts" | "recent";

const TOPICS = ["Music", "Gaming", "Sports", "News", "Comedy", "Movies", "Football", "Podcasts", "Live", "Cooking", "Tech"];

function ClipCard({ clip, isActive }: { clip: Video; isActive: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function revealControls() {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 1800);
  }

  const embedSrc = `https://www.youtube-nocookie.com/embed/${clip.id}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${clip.id}&controls=0&playsinline=1${playing ? "" : "&pause=1"}`;

  return (
    <div className="yt-clip-slide" ref={ref}>
      <div className="yt-clip-letterbox" onClick={revealControls}>
        <div className="yt-clip-card">
          {inView ? (
            <iframe
              key={`${clip.id}-${muted}`}
              src={embedSrc}
              title={clip.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img src={clip.thumbnail} alt={clip.title} className="yt-clip-thumb-placeholder" />
          )}

          <div className={`yt-clip-top-overlay ${showControls ? "visible" : ""}`}>
            <button className="yt-clip-icon-btn" onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); revealControls(); }} aria-label={playing ? "Pause" : "Play"}>
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7-11-7z" /></svg>
              )}
            </button>
            <button className="yt-clip-icon-btn" onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); revealControls(); }} aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m23 9-6 6M17 9l6 6" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>
              )}
            </button>
          </div>

          <div className="yt-clip-bottom-overlay">
            <span className="yt-clip-handle">@{clip.channel.replace(/\s+/g, "").toLowerCase()}</span>
            <span className="yt-clip-caption">{clip.title}</span>
          </div>

          <div className="yt-clip-actions">
            <button className="yt-clip-action" aria-label="Like">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
            </button>
            <button className="yt-clip-action" aria-label="Share">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v14" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [tab, setTab] = useState<Tab>("home");
  const [recent, setRecent] = useState<FeedVideo[]>([]);
  const [suggestions, setSuggestions] = useState<FeedVideo[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [homeVideos, setHomeVideos] = useState<Video[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [clips, setClips] = useState<Video[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = directVideo || videos[0];
  const isPlaying = !!current && tab === "search";

  function loadHome() {
    setHomeLoading(true);
    setHomeVideos([]);
    const fetchTrending = async (lat?: number, lng?: number) => {
      const headers = await authHeaders();
      fetch("/api/video/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ lat, lng, topic: activeTopic }),
      })
        .then((r) => r.json())
        .then((data) => setHomeVideos(data.videos || []))
        .catch(() => {})
        .finally(() => setHomeLoading(false));
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchTrending(pos.coords.latitude, pos.coords.longitude),
        () => fetchTrending(),
        { timeout: 4000 }
      );
    } else {
      fetchTrending();
    }
  }

  // Fresh fetch every time YouTube mode opens or the topic filter changes —
  // no stale cache, matching real YouTube's "reopen = soft reset" behavior.
  useEffect(() => {
    loadHome();
  }, [activeTopic]);

  useEffect(() => {
    (async () => {
      setFeedLoading(true);
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/video/feed", { headers });
        const data = await res.json();
        setRecent(data.recent || []);
        setSuggestions(data.suggestions || []);
      } catch {}
      setFeedLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (tab !== "shorts" || clips.length > 0 || clipsLoading) return;
    setClipsLoading(true);
    fetch("/api/video/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "" }),
    })
      .then((r) => r.json())
      .then((data) => setClips(data.clips || []))
      .catch(() => {})
      .finally(() => setClipsLoading(false));
  }, [tab]);

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
    setTab("search");
    logWatch(v, searchQueryForRelated);
    if (searchQueryForRelated) onSearch(searchQueryForRelated); // populates the related-videos rail
  }

  function runSearch(q: string) {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setDirectVideo(null);
    setTab("search");
    onSearch(q);
    setQuery("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  return (
    <div className="yt-stage-full">
      <aside className="yt-sidebar">
        <button className={`yt-side-item ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
          </svg>
          <span>Home</span>
        </button>
        <button className={`yt-side-item ${tab === "shorts" ? "active" : ""}`} onClick={() => setTab("shorts")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.5 2 5 13.5h6L9.5 22 19 10.5h-6L14.5 2z" />
          </svg>
          <span>Shorts</span>
        </button>
        <button className={`yt-side-item ${tab === "recent" ? "active" : ""}`} onClick={() => setTab("recent")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
          <span>Recently Watched</span>
        </button>
      </aside>

      <div className="yt-main">
        <div className="yt-topbar">
        <button className="yt-exit" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <button
          className="yt-logo-lockup"
          onClick={() => { setTab("home"); setDirectVideo(null); onSearch(""); loadHome(); }}
          aria-label="Back to YouTube home"
          type="button"
        >
          <span className="yt-logo-main">YOUTUBE</span>
          <span className="yt-logo-sub">BillyOs</span>
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
        </div>

        <div className="yt-content-full">
          {tab === "home" && (
            <>
              <div className="yt-topics-bar">
                <button className={`yt-topic-chip ${activeTopic === null ? "active" : ""}`} onClick={() => setActiveTopic(null)}>All</button>
                {TOPICS.map((t) => (
                  <button key={t} className={`yt-topic-chip ${activeTopic === t ? "active" : ""}`} onClick={() => setActiveTopic(t)}>{t}</button>
                ))}
              </div>
              <div className="yt-related">
                {homeLoading && <p className="thinking-text">Loading...</p>}
                <div className="yt-grid">
                  {homeVideos.map((v) => (
                    <button key={v.id} className="yt-card" onClick={() => playDirect(v, v.title)}>
                      <div className="yt-card-thumb"><img src={v.thumbnail} alt={v.title} /></div>
                      <div className="yt-card-info">
                        <span className="yt-card-title">{v.title}</span>
                        <span className="yt-card-channel">{v.channel}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "search" && isPlaying && current && (
            <div className="yt-watch-layout">
              <div className="yt-watch-main">
                <div className="yt-player">
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
                <h3 className="yt-related-label">More videos</h3>
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

          {tab === "search" && loading && <p className="thinking-text" style={{ marginTop: 24 }}>Searching YouTube...</p>}

          {tab === "search" && !isPlaying && !loading && (
            <div className="yt-landing">
              <h2 className="yt-landing-title">Search Anything to get started</h2>
              <p className="yt-landing-sub">Start watching videos to help us build a feed of videos that you'll love.</p>
            </div>
          )}

          {tab === "shorts" && (
            <div className="yt-clips-scroll">
              {clipsLoading && <p className="thinking-text">Loading clips...</p>}
              {clips.map((c) => (
                <ClipCard key={c.id} clip={c} isActive={false} />
              ))}
            </div>
          )}

          {tab === "recent" && (
            <>
              {feedLoading && <p className="thinking-text">Loading...</p>}
              {recent.length === 0 && suggestions.length === 0 && !feedLoading && (
                <div className="yt-landing">
                  <h2 className="yt-landing-title">Nothing watched yet</h2>
                  <p className="yt-landing-sub">Videos you watch will show up here.</p>
                </div>
              )}
              {recent.length > 0 && (
                <div className="yt-related">
                  <h3 className="yt-related-label">Recently watched</h3>
                  <div className="yt-grid">
                    {recent.map((v, i) => (
                      <button key={i} className="yt-card" onClick={() => playDirect({ id: v.video_id, title: v.title, channel: v.channel, thumbnail: v.thumbnail }, v.query || v.title)}>
                        <div className="yt-card-thumb"><img src={v.thumbnail} alt={v.title} /></div>
                        <div className="yt-card-info">
                          <span className="yt-card-title">{v.title}</span>
                          <span className="yt-card-channel">{v.channel}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="yt-related">
                  <h3 className="yt-related-label">Suggested for you</h3>
                  <div className="yt-grid">
                    {suggestions.map((v, i) => (
                      <button key={i} className="yt-card" onClick={() => playDirect({ id: v.video_id, title: v.title, channel: v.channel, thumbnail: v.thumbnail }, v.title)}>
                        <div className="yt-card-thumb"><img src={v.thumbnail} alt={v.title} /></div>
                        <div className="yt-card-info">
                          <span className="yt-card-title">{v.title}</span>
                          <span className="yt-card-channel">{v.channel}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
