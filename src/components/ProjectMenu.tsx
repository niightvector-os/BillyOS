"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChat } from "@/lib/chat-context";
import { useConfirm } from "@/lib/confirm-context";
import { usePrompt } from "@/lib/prompt-context";

export default function ProjectMenu({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { renameProject, deleteProject } = useChat();
  const confirm = useConfirm();
  const promptFn = usePrompt();

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 160;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      setCoords({ top: rect.bottom + 4, left });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleRename(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    const name = await promptFn("Rename project:", projectName);
    if (name && name.trim()) renameProject(projectId, name.trim());
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    const ok = await confirm("Delete this project? Chats inside it will move back to your general list.");
    if (ok) deleteProject(projectId);
  }

  const menu = open ? (
    <div ref={menuRef} className="sb-menu" style={{ position: "fixed", top: coords.top, left: coords.left, right: "auto" }}>
      <button className="sb-menu-item" onClick={handleRename}>
        <span>✎</span> Rename
      </button>
      <button className="sb-menu-item sb-menu-danger" onClick={handleDelete}>
        <span>🗑</span> Delete
      </button>
    </div>
  ) : null;

  return (
    <div className="sb-menu-wrap" style={{ position: "static" }}>
      <button ref={buttonRef} className="sb-dots" style={{ opacity: 1, position: "static" }} onClick={openMenu} aria-label="Project options">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {typeof document !== "undefined" && menu && createPortal(menu, document.body)}
    </div>
  );
}
