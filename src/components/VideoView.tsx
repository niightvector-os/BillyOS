"use client";

import { useState, useEffect, useRef } from "react";

type Video = { id: string; title: string; channel: string; thumbnail: string };
export type VideoData = { topic: string; videos: Video[] };
type FeedVideo = { video_id: string; title: string; channel: string; thumbnail: string; query?: string };
type Tab = "search" | "home" | "shorts" | "recent";

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
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [recent, setRecent] = useState<FeedVideo[]>([]);
  const [suggestions, setSuggestions] = useState<FeedVideo[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [homeVideos, setHomeVideos] = useState<Video[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [clips, setClips] = useState<Video[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = videos[active];
  const isPlaying = !!current;

  // Load personalized recent/suggested feed once (used on the Recently Watched tab)
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

  // Load Home (location-based trending) on first visit to that tab
  useEffect(() => {
    if (tab !== "home" || homeVideos.length > 0 || homeLoading) return;
    setHomeLoading(true);
    const fetchTrending = (lat?: number, lng?: number) => {
      fetch("/api/video/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
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
  }, [tab]);

  // Load Clips on first visit to that tab
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

  // Debounced search-suggestion lookup as the person types
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

  async function logWatch(v: { id: string; title: string; channel: string; thumbnail: string }) {
    try {
      const headers = await authHeaders();
      if (Object.keys(headers).length === 0) return;
      await fetch("/api/video/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ videoId: v.id, title: v.title, channel: v.channel, thumbnail: v.thumbnail, query: topic || undefined }),
      });
    } catch {}
  }

  useEffect(() => {
    if (current) logWatch(current);
  }, [current?.id]);

  function runSearch(q: string) {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setTab("search");
    onSearch(q);
    setQuery("");
    setActive(0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  function playVideo(v: Video, list: Video[], index: number) {
    setTab("search");
    onSearch(""); // reset any in-flight state, then set directly below
    // Directly set as the active playing video using the same shape VideoView expects
    setTimeout(() => {
      // handled by parent via onSearch normally, but since we already have the video,
      // we just switch into search tab and rely on `videos`/`active` from parent state
    }, 0);
  }

  return (
    <div className="yt-stage yt-stage-full">
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
          <span>Clips</span>
        </button>
        <button className={`yt-side-item ${tab === "recent" ? "active" : ""}`} onClick={() => setTab("recent")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
          <span>Recently Watched</span>
        </button>
      </aside>

      <div className="yt-main">
        <button className="yt-exit" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <button
          className="yt-logo-lockup"
          onClick={() => { setTab("home"); setActive(0); onSearch(""); }}
          aria-label="Back to YouTube home"
          type="button"
        >
          <span className="yt-logo-main">YOUTUBE</span>
          <span className="yt-logo-sub">BillyOs</span>
        </button>

        <div className="yt-search-bar-wrap">
          <form className="yt-search-bar" onSubmit={handleSubmit} autoComplete="off">
            <button type="submit" className="yt-search-btn" disabled={loading} aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Search on YouTube..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              disabled={loading}
            />
          </form>
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

        <div className="yt-content-full">
          {tab === "search" && isPlaying && (
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
                {videos.map((v, i) => (
                  <button key={v.id} className={`yt-side-card ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
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

          {tab === "search" && !isPlaying && !loading && videos.length === 0 && (
            <div className="yt-landing">
              <h2 className="yt-landing-title">Search Anything to get started</h2>
              <p className="yt-landing-sub">Start watching videos to help us build a feed of videos that you'll love.</p>
            </div>
          )}

          {tab === "home" && (
            <div className="yt-related">
              <h3 className="yt-related-label">Trending near you</h3>
              {homeLoading && <p className="thinking-text">Loading...</p>}
              <div className="yt-grid">
                {homeVideos.map((v, i) => (
                  <button key={v.id} className="yt-card" onClick={() => { setTab("search"); onSearch(v.title); }}>
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

          {tab === "shorts" && (
            <div className="yt-clips-feed">
              {clipsLoading && <p className="thinking-text">Loading clips...</p>}
              {clips.map((c) => (
                <div key={c.id} className="yt-clip-card">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${c.id}?rel=0&loop=1`}
                    title={c.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <p className="yt-clip-title">{c.title}</p>
                </div>
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
                      <button key={i} className="yt-card" onClick={() => { setTab("search"); onSearch(v.query || v.title); }}>
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
                      <button key={i} className="yt-card" onClick={() => { setTab("search"); onSearch(v.title); }}>
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
