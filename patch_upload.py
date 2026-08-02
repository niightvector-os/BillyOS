import sys
path = "src/components/Core.tsx"
content = open(path).read()
reps = []

old1 = 'import VisualizeView from "@/components/VisualizeView";'
new1 = 'import VisualizeView from "@/components/VisualizeView";\nimport { createClient } from "@/lib/supabase/client";'
reps.append(("import", old1, new1))

old2 = 'const [input, setInput] = useState("");'
new2 = '''const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ filename: string; extractedText: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);'''
reps.append(("state", old2, new2))

old3 = '''    if (activeMode === "study") {
      const topic = input;
      setInput(""); setActiveMode(null); setStudyLoading(true);
      try {
        const res = await fetch("/api/study", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });'''
new3 = '''    if (activeMode === "study") {
      const topic = attachedFile
        ? `${input}\\n\\nBase this on the following uploaded material titled "${attachedFile.filename}":\\n${attachedFile.extractedText}`
        : input;
      setInput(""); setActiveMode(null); setStudyLoading(true);
      setAttachedFile(null);
      try {
        const res = await fetch("/api/study", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });'''
reps.append(("study", old3, new3))

old4 = '''    const displayText = input;
    setInput(""); setActiveMode(null); stickToBottom.current = true;
    await sendMessage(displayText);
  }'''
new4 = '''    const displayText = input;
    const promptOverride = attachedFile
      ? `${input}\\n\\n[Attached file: ${attachedFile.filename}]\\n${attachedFile.extractedText}`
      : undefined;
    setInput(""); setActiveMode(null); stickToBottom.current = true;
    setAttachedFile(null);
    await sendMessage(displayText, promptOverride);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingFile(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { alert("Please sign in to upload files."); setUploadingFile(false); return; }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAttachedFile({ filename: data.filename, extractedText: data.extractedText });
    } catch (err: any) {
      alert(err.message || "Couldn't upload that file.");
    }
    setUploadingFile(false);
  }'''
reps.append(("chat", old4, new4))

old5 = '<form className={`search-shell ${idle ? "search-shell-center" : "search-shell-docked"}`} onSubmit={handleSubmit}>'
new5 = '''<form className={`search-shell ${idle ? "search-shell-center" : "search-shell-docked"}`} onSubmit={handleSubmit}>
        {attachedFile && (
          <div className="attachment-chip">
            <span className="attachment-icon">📎</span>
            <span className="attachment-name">{attachedFile.filename}</span>
            <button type="button" onClick={() => setAttachedFile(null)} aria-label="Remove attachment">✕</button>
          </div>
        )}'''
reps.append(("chip", old5, new5))

old6 = '''        <div className="search-bar">
          <svg className="icon-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>'''
new6 = '''        <div className="search-bar">
          <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.pdf" style={{ display: "none" }} onChange={handleFileSelect} />
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            disabled={uploadingFile}
          >
            {uploadingFile ? (
              <span style={{ fontSize: 11 }}>...</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
          <svg className="icon-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>'''
reps.append(("plusbtn", old6, new6))

for label, old, new in reps:
    c = content.count(old)
    if c != 1:
        print(f"ABORT at {label}: found {c} occurrences")
        sys.exit(1)

for label, old, new in reps:
    content = content.replace(old, new, 1)

open(path, "w").write(content)
print("All 6 replacements applied.")
