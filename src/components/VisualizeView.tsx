"use client";

import InlineMap from "@/components/InlineMap";
import { BarChartBlock, LineChartBlock, PieChartBlock } from "@/components/blocks/ChartBlock";
import TimelineBlock from "@/components/blocks/TimelineBlock";
import ComparisonCardsBlock from "@/components/blocks/ComparisonCardsBlock";
import TableBlock from "@/components/blocks/TableBlock";
import TripPlanBlock from "@/components/blocks/TripPlanBlock";

type VisualizeData = {
  question: string;
  summary: string;
  needs_live_research: boolean;
  researchFailed?: boolean;
  sources?: { title: string; url: string }[];
  blocks: { type: string; data: any }[];
};

export default function VisualizeView({ data, onClose }: { data: VisualizeData; onClose: () => void }) {
  return (
    <div className="study-overlay">
      <div className="visualize-panel">
        <div className="study-header" style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">◇ VISUALIZE</div>
            <h2 className="study-title">{data.question}</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="visualize-body">
          <p className="study-summary">{data.summary}</p>

          {data.needs_live_research && data.researchFailed && (
            <p style={{ color: "var(--ember)", fontSize: 13, marginBottom: 16 }}>
              This needed current information but the live search failed — treat details with caution.
            </p>
          )}

          {data.blocks.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: 14 }}>No visual representation was needed here — text answers it best.</p>
          ) : (
            <div className="visualize-blocks">
              {data.blocks.map((block, i) => {
                switch (block.type) {
                  case "bar_chart": return <BarChartBlock key={i} data={block.data} />;
                  case "line_chart": return <LineChartBlock key={i} data={block.data} />;
                  case "pie_chart": return <PieChartBlock key={i} data={block.data} />;
                  case "timeline": return <TimelineBlock key={i} data={block.data} />;
                  case "comparison_cards": return <ComparisonCardsBlock key={i} data={block.data} />;
                  case "table": return <TableBlock key={i} data={block.data} />;
                  case "trip_plan": return <TripPlanBlock key={i} data={block.data} />;
                  case "map": return <InlineMap key={i} locations={block.data.locations} />;
                  case "images":
                    return (
                      <div key={i} className="image-strip visualize-image-strip">
                        {block.data.images.map((img: any, idx: number) => (
                          <a key={idx} href={img.pageUrl} target="_blank" rel="noopener noreferrer" className="image-strip-item">
                            <img src={img.url} alt={img.title} loading="lazy" />
                            <span>{img.title}</span>
                          </a>
                        ))}
                      </div>
                    );
                  case "video":
                    return (
                      <div key={i} className="visualize-video-embed">
                        <div className="video-embed" style={{ margin: "8px 0" }}>
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${block.data.videos[0].id}?rel=0`}
                            title={block.data.videos[0].title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  default: return null;
                }
              })}
            </div>
          )}

          {data.sources && data.sources.length > 0 && (
            <div className="source-list">
              {data.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-item">
                  <span className="source-num">[{i + 1}]</span> {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
