"use client";

import { useState } from "react";
import { useChat } from "@/lib/chat-context";
import { useConfirm } from "@/lib/confirm-context";
import { usePrompt } from "@/lib/prompt-context";
import SidebarItemMenu from "@/components/SidebarItemMenu";
import ProjectMenu from "@/components/ProjectMenu";

export default function ProjectsPanel({
  onClose,
  onOpenConversation,
}: {
  onClose: () => void;
  onOpenConversation: (id: string) => void;
}) {
  const { projects, conversations, createProject, deleteProject, startNewChat, renameConversation } = useChat();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const confirm = useConfirm();
  const promptFn = usePrompt();

  async function handleCreate() {
    const name = await promptFn("Project name?");
    if (name && name.trim()) createProject(name.trim());
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const ok = await confirm("Delete this project? Chats inside it will move back to your general list.");
    if (ok) deleteProject(id);
  }

  function startRename(id: string, currentTitle: string) {
    setEditingId(id);
    setEditValue(currentTitle);
  }

  async function commitRename(id: string) {
    if (editValue.trim()) await renameConversation(id, editValue.trim());
    setEditingId(null);
  }

  return (
    <div className="study-overlay">
      <div className="downloads-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">PROJECTS</div>
            <h2 className="study-title">Your Projects</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <button className="sb-new" style={{ marginBottom: 20 }} onClick={handleCreate}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>New Project</span>
          </button>

          {projects.length === 0 && (
            <p style={{ color: "var(--text-dim)", fontSize: 14 }}>No projects yet — create one to group related chats together.</p>
          )}

          {projects.map((p) => {
            const items = conversations.filter((c) => c.project_id === p.id);
            return (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div
                  className="map-list-item"
                  style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                >
                  <span className="map-list-name">📁 {p.name} <span style={{ color: "var(--text-dim)" }}>({items.length})</span></span>
                  <ProjectMenu projectId={p.id} projectName={p.name} />
                </div>
                {expanded === p.id && (
                  <div style={{ paddingLeft: 16, marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="sb-item" onClick={() => { startNewChat(p.id); onClose(); }}>
                      <span className="ic">＋</span> New chat in {p.name}
                    </div>
                    {items.map((c) => (
                      <div key={c.id} className="sb-item" onClick={() => { if (editingId !== c.id) { onOpenConversation(c.id); onClose(); } }}>
                        <span className="ic">◇</span>
                        {editingId === c.id ? (
                          <input
                            className="sb-rename-input"
                            value={editValue}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") commitRename(c.id); if (e.key === "Escape") setEditingId(null); }}
                            onBlur={() => commitRename(c.id)}
                          />
                        ) : (
                          <span className="sb-item-text">{c.title}</span>
                        )}
                        <SidebarItemMenu conversationId={c.id} pinned={c.pinned} onRenameStart={() => startRename(c.id, c.title)} />
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p style={{ color: "var(--text-dim)", fontSize: 12.5, paddingLeft: 10 }}>No chats in this project yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
