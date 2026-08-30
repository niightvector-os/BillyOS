"use client";

import { useState } from "react";

type Video = { id: string; title: string; channel: string; thumbnail: string };
export type VideoData = { topic: string; videos: Video[] };

export default function VideoView({
  topic,
  videos,
  onClose,
  onSearch,
  loading,
}: {
  topic: string;
  videos: Video[];
  onClose: () => void;
  onSearch: (query: string) => void;
  loading?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const current = videos[active];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSearch(query);
    setQuery("");
    setActive(0);
  }

  return (
    <div className="yt-stage">
      <button className="yt-exit" onClick={onClose} aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
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
