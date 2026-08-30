"use client";

import { useState, useEffect } from "react";

type Video = { id: string; title: string; channel: string; thumbnail: string };
export type VideoData = { topic: string; videos: Video[] };
type FeedVideo = { video_id: string; title: string; channel: string; thumbnail: string; query?: string };

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
  const [recent, setRecent] = useState<FeedVideo[]>([]);
  const [suggestions, setSuggestions] = useState<FeedVideo[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const current = videos[active];
  const isLanding = videos.length === 0 && !loading;

  useEffect(() => {
    if (!isLanding) return;
    let cancelled = false;
    (async () => {
      setFeedLoading(true);
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/video/feed", { headers });
        const data = await res.json();
        if (!cancelled) {
          setRecent(data.recent || []);
          setSuggestions(data.suggestions || []);
        }
      } catch {
        // feed is a nice-to-have — fail silently
      }
      if (!cancelled) setFeedLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isLanding]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSearch(query);
    setQuery("");
    setActive(0);
  }

  async function logWatch(v: { id: string; title: string; channel: string; thumbnail: string }) {
    try {
      const headers = await authHeaders();
      if (Object.keys(headers).length === 0) return; // not logged in, skip silently
      await fetch("/api/video/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ videoId: v.id, title: v.title, channel: v.channel, thumbnail: v.thumbnail, query: topic || undefined }),
      });
    } catch {
      // logging failure shouldn't interrupt watching
    }
  }

  function playFromFeed(v: FeedVideo) {
    onSearch(v.query || v.title);
  }

  useEffect(() => {
    if (current) logWatch(current);
  }, [current?.id]);

  return (
    <div className="yt-stage">
      <button className="yt-exit" onClick={onClose} aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <button
        className="yt-logo-lockup"
        onClick={() => { setActive(0); onSearch(""); }}
        aria-label="Back to YouTube search"
        type="button"
      >
        <span className="yt-logo-main">YOUTUBE</span>
        <span className="yt-logo-sub">BillyOs</span>
      </button>

      <div className="yt-search-bar-wrap">
        <form className="yt-search-bar" onSubmit={handleSearch}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="yt-play-icon">
            <path d="M8 5v14l11-7-11-7z" fill="currentColor" stroke="none" />
          </svg>
          <input
            type="text"
            placeholder="Search on YouTube..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="yt-search-btn" disabled={loading} aria-label="Search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>
      </div>

      <div className="yt-content">
        {isLanding && (
          <>
            {recent.length === 0 && suggestions.length === 0 && !feedLoading && (
              <div className="yt-landing">
                <h2 className="yt-landing-title">Search Anything to get started</h2>
                <p className="yt-landing-sub">Start watching videos to help us build a feed of videos that you'll love.</p>
              </div>
            )}

            {recent.length > 0 && (
              <div className="yt-related" style={{ marginTop: 8 }}>
                <h3 className="yt-related-label">Recently watched</h3>
                <div className="yt-grid">
                  {recent.map((v, i) => (
                    <button key={i} className="yt-card" onClick={() => playFromFeed(v)}>
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
                    <button key={i} className="yt-card" onClick={() => playFromFeed(v)}>
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

        {current && (
          <>
            <div className="yt-player">
              <iframe
                key={current.id}
                src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0`}
                title={current.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="yt-current-info">
              <h2 className="yt-current-title">{current.title}</h2>
              <p className="yt-current-channel">{current.channel}</p>
            </div>
          </>
        )}

        {loading && <p className="thinking-text" style={{ marginTop: 24 }}>Searching YouTube...</p>}

        {videos.length > 1 && (
          <div className="yt-related">
            <h3 className="yt-related-label">Related videos</h3>
            <div className="yt-grid">
              {videos.map((v, i) => (
                <button
                  key={v.id}
                  className={`yt-card ${i === active ? "active" : ""}`}
                  onClick={() => setActive(i)}
                >
                  <div className="yt-card-thumb">
                    <img src={v.thumbnail} alt={v.title} />
                  </div>
                  <div className="yt-card-info">
                    <span className="yt-card-title">{v.title}</span>
                    <span className="yt-card-channel">{v.channel}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
