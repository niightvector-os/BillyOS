"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import { usePrompt } from "@/lib/prompt-context";
import { getErrorMessage } from "@/lib/errors";
import { useConfirm } from "@/lib/confirm-context";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const STARTER_FILES: Record<string, string> = {
  "index.html": `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, BillyOS Code</h1>
  <script src="script.js"></script>
</body>
</html>
`,
  "style.css": `body {
  font-family: sans-serif;
  background: #0a0a0a;
  color: #eee;
  padding: 40px;
}
`,
  "script.js": `console.log("BillyOS Code is ready.");
`,
};

type ChatMsg = { role: "user" | "assistant"; content: string };
type SavedProject = { id: string; name: string; updated_at: string };

export default function CodeWorkspace({ onExit }: { onExit: () => void }) {
  const [files, setFiles] = useState<Record<string, string>>(STARTER_FILES);
  const [activeFile, setActiveFile] = useState("index.html");
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [buildSteps, setBuildSteps] = useState<string[]>([]);
  const [commands, setCommands] = useState<string[]>([]);

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const supabase = createClient();
  const promptFn = usePrompt();
  const confirm = useConfirm();

  useEffect(() => {
    refreshSavedProjects();
  }, []);

  async function refreshSavedProjects() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase
      .from("code_projects")
      .select("id, name, updated_at")
      .order("updated_at", { ascending: false });
    setSavedProjects(data ?? []);
  }

  async function handleSave() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert("Sign in to save Code projects.");
      return;
    }

    setSaveStatus("saving");

    if (currentProjectId) {
      await supabase
        .from("code_projects")
        .update({ files, updated_at: new Date().toISOString() })
        .eq("id", currentProjectId);
    } else {
      const name = await promptFn("Name this project:", "My BillyOS Project");
      if (!name || !name.trim()) {
        setSaveStatus("idle");
        return;
      }
      const { data } = await supabase
        .from("code_projects")
        .insert({ user_id: userData.user.id, name: name.trim(), files })
        .select()
        .single();
      if (data) {
        setCurrentProjectId(data.id);
        setCurrentProjectName(data.name);
      }
    }

    await refreshSavedProjects();
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  async function handleLoad(project: SavedProject) {
    const { data } = await supabase.from("code_projects").select("files").eq("id", project.id).single();
    if (data) {
      setFiles(data.files);
      setActiveFile(Object.keys(data.files)[0] || "index.html");
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setViewMode("code");
      setChatMessages([]);
      setCommands([]);
    }
    setShowProjectList(false);
  }

  async function handleDeleteProject(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const ok = await confirm("Delete this saved project? This can't be undone.");
    if (!ok) return;
    await supabase.from("code_projects").delete().eq("id", id);
    if (id === currentProjectId) {
      setCurrentProjectId(null);
      setCurrentProjectName(null);
    }
    refreshSavedProjects();
  }

  function handleNewProject() {
    setFiles(STARTER_FILES);
    setActiveFile("index.html");
    setCurrentProjectId(null);
    setCurrentProjectName(null);
    setChatMessages([]);
    setCommands([]);
    setViewMode("code");
    setShowProjectList(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(files[activeFile] || "");
  }

  function handleReset() {
    if (STARTER_FILES[activeFile] !== undefined) {
      setFiles((f) => ({ ...f, [activeFile]: STARTER_FILES[activeFile] }));
    } else {
      setFiles((f) => ({ ...f, [activeFile]: "" }));
    }
  }

  async function handleDownload() {
    const zip = new JSZip();
    Object.entries(files).forEach(([name, content]) => zip.file(name, content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentProjectName || "billyos-project").replace(/\s+/g, "-").toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function langFor(name: string) {
    if (name.endsWith(".css")) return "css";
    if (name.endsWith(".js")) return "javascript";
    return "html";
  }

  function buildPreviewDoc() {
    const bodyMatch = files["index.html"].match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "") : files["index.html"];
    return `<!DOCTYPE html><html><head><style>${files["style.css"] || ""}</style></head><body>${bodyContent}<script>${
      files["script.js"] || ""
    }<\/script></body></html>`;
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", content: userMsg }]);
    setChatLoading(true);
    setBuildSteps([]);

    try {
      const res = await fetch("/api/code/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, currentFiles: files, history: chatMessages }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawError = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.type === "step") {
              setBuildSteps((s) => [...s, event.label]);
            } else if (event.type === "error") {
              sawError = true;
              setChatMessages((m) => [...m, { role: "assistant", content: event.message }]);
            } else if (event.type === "final") {
              setChatMessages((m) => [...m, { role: "assistant", content: event.message || "Done." }]);
              if (event.files && Object.keys(event.files).length > 0) {
                setFiles((f) => ({ ...f, ...event.files }));
                setActiveFile(Object.keys(event.files)[0]);
                setViewMode("code");
              }
              if (event.commands && event.commands.length > 0) {
                setCommands((c) => [...c, ...event.commands]);
              }
            }
          }
        }
      }

      if (!sawError) setTimeout(() => setBuildSteps([]), 900);
      else setBuildSteps([]);
    } catch (err) {
      setBuildSteps([]);
      setChatMessages((m) => [...m, { role: "assistant", content: `Sorry, something went wrong: ${getErrorMessage(err)}` }]);
    }
    setChatLoading(false);
  }

  const isEmpty = chatMessages.length === 0;

  return (
    <div className="code-stage">
      <div className="code-header">
        <div className="code-header-label">
          <span className="code-icon">{"</>"}</span> BillyOS Code
          {currentProjectName && <span className="code-project-name">— {currentProjectName}</span>}
        </div>
        <div className="code-header-actions">
          <button className="code-header-btn" onClick={handleNewProject}>New</button>
          <button className="code-header-btn" onClick={() => setShowProjectList((s) => !s)}>My Projects</button>
          <button className="code-header-btn code-header-save" onClick={handleSave}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
          </button>
          <button className="ghost-exit" onClick={onExit}>Exit</button>
        </div>

        {showProjectList && (
          <div className="code-project-list">
            {savedProjects.length === 0 && <div className="sb-menu-empty">No saved projects yet</div>}
            {savedProjects.map((p) => (
              <div key={p.id} className="code-project-item" onClick={() => handleLoad(p)}>
                <span>{p.name}</span>
                <button onClick={(e) => handleDeleteProject(e, p.id)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="code-body">
        <div className="code-main">
          <div className="code-tabs">
            {Object.keys(files).map((name) => (
              <button
                key={name}
                className={`code-tab ${activeFile === name && viewMode === "code" ? "active" : ""}`}
                onClick={() => { setActiveFile(name); setViewMode("code"); }}
              >
                {name}
              </button>
            ))}
            <button className={`code-tab code-tab-preview ${viewMode === "preview" ? "active" : ""}`} onClick={() => setViewMode("preview")}>
              ▶ Preview
            </button>
            <div className="code-file-actions">
              <button onClick={handleCopy} title="Copy current file">Copy</button>
              <button onClick={handleReset} title="Reset current file">Reset</button>
              <button onClick={handleDownload} title="Download project as .zip">Download</button>
            </div>
          </div>

          <div className="code-editor-area">
            {isEmpty && viewMode === "code" && <div className="code-wordmark">CODE</div>}
            {viewMode === "code" ? (
              <Editor
                height="100%"
                language={langFor(activeFile)}
                value={files[activeFile]}
                theme="vs-dark"
                onChange={(val) => setFiles((f) => ({ ...f, [activeFile]: val || "" }))}
                options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }}
              />
            ) : (
              <iframe
                key={JSON.stringify(files)}
                className="code-preview-frame"
                sandbox="allow-scripts"
                srcDoc={buildPreviewDoc()}
              />
            )}
          </div>

          <div className="code-terminal">
            <div className="code-terminal-label">TERMINAL</div>
            {commands.length === 0 ? (
              <div className="code-terminal-empty">No commands yet — BillyOS Code will show suggested commands here for your review. Nothing runs automatically.</div>
            ) : (
              commands.map((cmd, i) => (
                <div key={i} className="code-terminal-cmd">
                  <code>{cmd}</code>
                  <div className="code-terminal-actions">
                    <button onClick={() => navigator.clipboard.writeText(cmd)}>Copy</button>
                    <button onClick={() => setCommands((c) => c.filter((_, idx) => idx !== i))}>Dismiss</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="code-chat">
          <div className="code-chat-messages">
            {chatMessages.length === 0 && (
              <p className="code-chat-hint">{'Describe what you want to build — e.g. "Build me a calculator" or "Make a portfolio website."'}</p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`code-chat-msg ${m.role}`}>{m.content}</div>
            ))}
            {chatLoading && buildSteps.length > 0 && (
              <div className="code-chat-msg assistant code-build-steps">
                {buildSteps.map((step, i) => (
                  <div key={i} className="code-build-step">
                    <span className="code-build-check">✓</span> {step}
                  </div>
                ))}
              </div>
            )}
          </div>
          <form className="code-chat-input" onSubmit={sendChat}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe what you want to build..."
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading}>→</button>
          </form>
        </div>
      </div>
    </div>
  );
}
