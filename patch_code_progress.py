import sys

path = "src/components/CodeWorkspace.tsx"
with open(path, "r") as f:
    content = f.read()

replacements = []

# 1. Add buildSteps state next to chatLoading
old1 = "const [chatLoading, setChatLoading] = useState(false);"
new1 = "const [chatLoading, setChatLoading] = useState(false);\n  const [buildSteps, setBuildSteps] = useState<string[]>([]);"
replacements.append(("state", old1, new1))

# 2. Replace sendChat entirely with the streaming version
old2 = '''  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/code/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, currentFiles: files, history: chatMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setChatMessages((m) => [...m, { role: "assistant", content: data.message || "Done." }]);

      if (data.files) {
        setFiles((f) => ({ ...f, ...data.files }));
        const changedKeys = Object.keys(data.files);
        if (changedKeys.length > 0) {
          setActiveFile(changedKeys[0]);
          setViewMode("code");
        }
      }
      if (data.commands && data.commands.length > 0) {
        setCommands((c) => [...c, ...data.commands]);
      }
    } catch (err: any) {
      setChatMessages((m) => [...m, { role: "assistant", content: `Sorry, something went wrong: ${err.message || "unknown error"}` }]);
    }
    setChatLoading(false);
  }'''

new2 = '''  async function sendChat(e: React.FormEvent) {
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

          const lines = buffer.split("\\n");
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

      if (!sawError) {
        // brief pause so the final checkmark is actually visible before the list clears
        setTimeout(() => setBuildSteps([]), 900);
      } else {
        setBuildSteps([]);
      }
    } catch (err: any) {
      setBuildSteps([]);
      setChatMessages((m) => [...m, { role: "assistant", content: `Sorry, something went wrong: ${err.message || "unknown error"}` }]);
    }
    setChatLoading(false);
  }'''
replacements.append(("sendChat", old2, new2))

# 3. Replace the static "Working on it..." with real live steps
old3 = '{chatLoading && <div className="code-chat-msg assistant thinking-text">Working on it...</div>}'
new3 = '''{chatLoading && buildSteps.length > 0 && (
              <div className="code-chat-msg assistant code-build-steps">
                {buildSteps.map((step, i) => (
                  <div key={i} className="code-build-step">
                    <span className="code-build-check">✓</span> {step}
                  </div>
                ))}
              </div>
            )}'''
replacements.append(("render", old3, new3))

for label, old, new in replacements:
    count = content.count(old)
    if count != 1:
        print(f"ABORT at {label}: found {count} occurrences (need exactly 1). No changes written.")
        sys.exit(1)

for label, old, new in replacements:
    content = content.replace(old, new, 1)

with open(path, "w") as f:
    f.write(content)

print("All 3 replacements applied successfully.")
