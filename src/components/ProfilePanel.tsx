"use client";

import { useState } from "react";
import { useChat } from "@/lib/chat-context";

export default function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useChat();
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [occupation, setOccupation] = useState(profile.occupation || "");
  const [aboutText, setAboutText] = useState(profile.about_text || "");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await updateProfile({
      display_name: displayName,
      nickname,
      occupation,
      about_text: aboutText,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="study-overlay">
      <div className="downloads-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">PROFILE</div>
            <h2 className="study-title">Personalisation</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <h3 className="study-subhead" style={{ marginTop: 0 }}>What should BillyOS call you?</h3>
          <input
            className="auth-input"
            style={{ maxWidth: 320 }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />

          <h3 className="study-subhead">About You</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Nickname</label>
              <input
                className="auth-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="A nickname you like"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Occupation</label>
              <input
                className="auth-input"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Student, developer, teacher..."
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>More about you</label>
              <textarea
                className="auth-textarea"
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Tell BillyOS a little about yourself — interests, goals, how you like things explained..."
              />
            </div>
          </div>

          <button className="quiz-submit" style={{ marginTop: 20 }} onClick={handleSave}>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
