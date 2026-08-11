"use client";

import { useChat } from "@/lib/chat-context";
import { createClient } from "@/lib/supabase/client";

const LEVELS = [
  { key: "simple", label: "Simple", desc: "Short, everyday language — no jargon" },
  { key: "normal", label: "Normal", desc: "Clear, standard explanations" },
  { key: "expert", label: "Expert", desc: "Full technical depth and precision" },
];

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile, clearAllConversations } = useChat();
  const supabase = createClient();

  async function handleClear() {
    if (confirm("Delete ALL your conversations and saved results? This can't be undone.")) {
      await clearAllConversations();
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="study-overlay">
      <div className="downloads-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">SETTINGS</div>
            <h2 className="study-title">Settings</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <h3 className="study-subhead" style={{ marginTop: 0 }}>Explanation style</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {LEVELS.map((l) => (
              <div
                key={l.key}
                className="map-list-item"
                style={{ cursor: "pointer", borderColor: profile.complexity === l.key ? "var(--accent)" : "var(--border)" }}
                onClick={() => updateProfile({ complexity: l.key as "simple" | "normal" | "expert" })}
              >
                <span className="map-list-name">{l.label} {profile.complexity === l.key && "✓"}</span>
                <span className="map-list-desc">{l.desc}</span>
              </div>
            ))}
          </div>

          <h3 className="study-subhead">Account</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <button className="sb-item" style={{ paddingRight: 10 }} onClick={handleClear}>
              Clear all conversations
            </button>
            <button className="sb-item" style={{ paddingRight: 10, color: "var(--ember)" }} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
