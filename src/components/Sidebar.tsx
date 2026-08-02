"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/lib/chat-context";
import { useConfirm } from "@/lib/confirm-context";
import DownloadsPanel from "@/components/DownloadsPanel";
import ProjectsPanel from "@/components/ProjectsPanel";
import ProfilePanel from "@/components/ProfilePanel";
import SettingsPanel from "@/components/SettingsPanel";
import AboutPanel from "@/components/AboutPanel";
import SidebarItemMenu from "@/components/SidebarItemMenu";

const MODE_ICONS: Record<string, string> = {
  chat: "◇", research: "✦", study: "▣", map: "⌖", video: "▶", visualize: "◇",
};

export default function Sidebar({ ghostActive = false }: { ghostActive?: boolean }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"downloads" | "projects" | "profile" | "settings" | "about" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { conversations, activeConversationId, startNewChat, loadConversation, requestLoad, renameConversation } = useChat();
  const confirm = useConfirm();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (ghostActive) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        startNewChat();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ghostActive]);

  function handleOpen(c: { id: string; mode: string }) {
    if (editingId === c.id) return;
    if (c.mode === "chat") loadConversation(c.id);
    else requestLoad(c.id);
    setOpen(false);
  }

  function startRename(id: string, currentTitle: string) {
    setEditingId(id);
    setEditValue(currentTitle);
  }

  async function commitRename(id: string) {
    if (editValue.trim()) await renameConversation(id, editValue.trim());
    setEditingId(null);
  }

  const ungrouped = conversations.filter((c) => !c.project_id);
  const pinned = ungrouped.filter((c) => c.pinned);
  const recent = ungrouped.filter((c) => !c.pinned);

  function renderItem(c: { id: string; title: string; mode: string; pinned: boolean }) {
    const icon = MODE_ICONS[c.mode] || "◇";
    return (
      <div key={c.id} className={`sb-item ${c.id === activeConversationId ? "sb-item-active" : ""}`} onClick={() => handleOpen(c)}>
        <span className="ic">{icon}</span>
        {editingId === c.id ? (
          <input
            className="sb-rename-input"
            value={editValue}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename(c.id);
              if (e.key === "Escape") setEditingId(null);
            }}
            onBlur={() => commitRename(c.id)}
          />
        ) : (
          <span className="sb-item-text">{c.title}</span>
        )}
        <SidebarItemMenu conversationId={c.id} pinned={c.pinned} onRenameStart={() => startRename(c.id, c.title)} />
      </div>
    );
  }

  return (
    <>
      {!open && (
        <button className="sb-handle" onClick={() => setOpen(true)} aria-label="Open sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sb-top">
          <div className="sb-brand"><span className="dot" /> BILLYOS</div>
          <button className="sb-close" onClick={() => setOpen(false)} aria-label="Close sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button className="sb-new" onClick={() => { startNewChat(); setOpen(false); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New Chat</span>
          <span className="sb-shortcut">Ctrl+O</span>
        </button>

        <div className="sb-scroll">
          <div className="sb-section">
            <div className="sb-item" onClick={() => { setPanel("projects"); setOpen(false); }}>
              <span className="ic">📁</span> Projects
            </div>
          </div>

          {pinned.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Pinned</div>
              {pinned.map(renderItem)}
            </div>
          )}

          <div className="sb-section">
            <div className="sb-label">Recent</div>
            {recent.length === 0 && <div className="sb-item" style={{ color: "var(--text-dim)", cursor: "default" }}>Nothing yet</div>}
            {recent.map(renderItem)}
          </div>
        </div>

        <div className="sb-bottom sb-section">
          <div className="sb-item" onClick={() => { setPanel("downloads"); setOpen(false); }}><span className="ic">⬇</span> Downloads</div>
          <div className="sb-item" onClick={() => { setPanel("profile"); setOpen(false); }}><span className="ic">◐</span> Profile</div>
          <div className="sb-item" onClick={() => { setPanel("settings"); setOpen(false); }}><span className="ic">⚙</span> Settings</div>
          <div className="sb-item" onClick={() => { setPanel("about"); setOpen(false); }}><span className="ic">ⓘ</span> About</div>
        </div>
      </aside>

      {panel === "downloads" && <DownloadsPanel onClose={() => setPanel(null)} />}
      {panel === "projects" && <ProjectsPanel onClose={() => setPanel(null)} onOpenConversation={(id) => loadConversation(id)} />}
      {panel === "profile" && <ProfilePanel onClose={() => setPanel(null)} />}
      {panel === "settings" && <SettingsPanel onClose={() => setPanel(null)} />}
      {panel === "about" && <AboutPanel onClose={() => setPanel(null)} />}
    </>
  );
}
