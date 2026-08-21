"use client";

import { useChat } from "@/lib/chat-context";
import { createClient } from "@/lib/supabase/client";

const LEVELS = [
  { key: "simple", label: "Simple", desc: "Short, everyday language — no jargon" },
  { key: "normal", label: "Normal", desc: "Clear, standard explanations" },
  { key: "expert", label: "Expert", desc: "Full technical depth and precision" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français (French)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "nl", label: "Nederlands (Dutch)" },
  { code: "ru", label: "Русский (Russian)" },
  { code: "uk", label: "Українська (Ukrainian)" },
  { code: "pl", label: "Polski (Polish)" },
  { code: "ro", label: "Română (Romanian)" },
  { code: "el", label: "Ελληνικά (Greek)" },
  { code: "tr", label: "Türkçe (Turkish)" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "he", label: "עברית (Hebrew)" },
  { code: "fa", label: "فارسی (Persian)" },
  { code: "ur", label: "اردو (Urdu)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ne", label: "नेपाली (Nepali)" },
  { code: "si", label: "සිංහල (Sinhala)" },
  { code: "th", label: "ไทย (Thai)" },
  { code: "vi", label: "Tiếng Việt (Vietnamese)" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu (Malay)" },
  { code: "tl", label: "Filipino (Tagalog)" },
  { code: "km", label: "ខ្មែរ (Khmer)" },
  { code: "lo", label: "ລາວ (Lao)" },
  { code: "my", label: "မြန်မာ (Burmese)" },
  { code: "zh", label: "中文 (Chinese)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "sw", label: "Kiswahili (Swahili)" },
  { code: "rw", label: "Ikinyarwanda (Kinyarwanda)" },
  { code: "am", label: "አማርኛ (Amharic)" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "zu", label: "isiZulu (Zulu)" },
  { code: "xh", label: "isiXhosa (Xhosa)" },
  { code: "af", label: "Afrikaans" },
  { code: "so", label: "Soomaali (Somali)" },
  { code: "sn", label: "chiShona (Shona)" },
  { code: "ln", label: "Lingála" },
  { code: "wo", label: "Wolof" },
  { code: "mg", label: "Malagasy" },
  { code: "sv", label: "Svenska (Swedish)" },
  { code: "no", label: "Norsk (Norwegian)" },
  { code: "da", label: "Dansk (Danish)" },
  { code: "fi", label: "Suomi (Finnish)" },
  { code: "is", label: "Íslenska (Icelandic)" },
  { code: "cs", label: "Čeština (Czech)" },
  { code: "sk", label: "Slovenčina (Slovak)" },
  { code: "hu", label: "Magyar (Hungarian)" },
  { code: "bg", label: "Български (Bulgarian)" },
  { code: "sr", label: "Српски (Serbian)" },
  { code: "hr", label: "Hrvatski (Croatian)" },
  { code: "sl", label: "Slovenščina (Slovenian)" },
  { code: "lt", label: "Lietuvių (Lithuanian)" },
  { code: "lv", label: "Latviešu (Latvian)" },
  { code: "et", label: "Eesti (Estonian)" },
  { code: "ka", label: "ქართული (Georgian)" },
  { code: "hy", label: "Հայերեն (Armenian)" },
  { code: "az", label: "Azərbaycan (Azerbaijani)" },
  { code: "kk", label: "Қазақша (Kazakh)" },
  { code: "uz", label: "Oʻzbek (Uzbek)" },
  { code: "mn", label: "Монгол (Mongolian)" },
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

          <h3 className="study-subhead">Language</h3>
          <div style={{ marginBottom: 28 }}>
            <select
              className="auth-input"
              style={{ width: "100%", cursor: "pointer" }}
              value={profile.preferred_language || "en"}
              onChange={(e) => updateProfile({ preferred_language: e.target.value })}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <p className="map-list-desc" style={{ marginTop: 8 }}>
              BillyOS will chat, research, and explain in this language.
            </p>
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
