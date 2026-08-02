"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChat } from "@/lib/chat-context";
import { useConfirm } from "@/lib/confirm-context";

export default function SidebarItemMenu({
  conversationId,
  pinned,
  onRenameStart,
}: {
  conversationId: string;
  pinned: boolean;
  onRenameStart: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { projects, togglePinned, moveToProject, deleteConversation } = useChat();
  const confirm = useConfirm();

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 180;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      setCoords({ top: rect.bottom + 4, left });
    }
    setShowProjects(false);
    setOpen((o) => !o);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setShowProjects(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    const ok = await confirm("Delete this item? This can't be undone.");
    if (ok) deleteConversation(conversationId);
  }

  const menu = open ? (
    <div ref={menuRef} className="sb-menu" style={{ position: "fixed", top: coords.top, left: coords.left, right: "auto" }}>
      {!showProjects ? (
        <>
          <button className="sb-menu-item" onClick={(e) => { e.stopPropagation(); setShowProjects(true); }}>
            <span>📁</span> Add to project
          </button>
          <button className="sb-menu-item" onClick={(e) => { e.stopPropagation(); togglePinned(conversationId, !pinned); setOpen(false); }}>
            <span>★</span> {pinned ? "Unpin" : "Pin"}
          </button>
          <button className="sb-menu-item" onClick={(e) => { e.stopPropagation(); setOpen(false); onRenameStart(); }}>
            <span>✎</span> Rename
          </button>
          <button className="sb-menu-item sb-menu-danger" onClick={handleDelete}>
            <span>🗑</span> Delete
          </button>
        </>
      ) : (
        <>
          <button className="sb-menu-item sb-menu-back" onClick={(e) => { e.stopPropagation(); setShowProjects(false); }}>
            ← Back
          </button>
          {projects.length === 0 && <div className="sb-menu-empty">No projects yet</div>}
          {projects.map((p) => (
            <button
              key={p.id}
              className="sb-menu-item"
              onClick={(e) => { e.stopPropagation(); moveToProject(conversationId, p.id); setOpen(false); setShowProjects(false); }}
            >
              <span>📁</span> {p.name}
            </button>
          ))}
        </>
      )}
    </div>
  ) : null;

  return (
    <div className="sb-menu-wrap">
      <button ref={buttonRef} className="sb-dots" onClick={openMenu} aria-label="More options">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {typeof document !== "undefined" && menu && createPortal(menu, document.body)}
    </div>
  );
}
