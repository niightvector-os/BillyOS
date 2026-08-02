import sys

path = "src/lib/chat-context.tsx"
with open(path, "r") as f:
    content = f.read()

old_block = '''    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, complexity: profile.complexity, personalization: profile }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        assistantMsg = { ...assistantMsg, content: err?.error || "Sorry — the AI is temporarily unavailable. Please try again." };
        setMessages([...nextMessages, { ...assistantMsg }]);
      } else {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            assistantMsg = { ...assistantMsg, content: assistantMsg.content + decoder.decode(value, { stream: true }) };
            setMessages([...nextMessages, { ...assistantMsg }]);
          }
        }
      }'''

new_block = '''    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, complexity: profile.complexity, personalization: profile }),
        signal: controller.signal,
      });

      const searched = res.headers.get("X-Billy-Searched") === "true";
      let searchSources: { title: string; url: string }[] = [];
      try {
        const raw = res.headers.get("X-Billy-Sources");
        if (raw) searchSources = JSON.parse(decodeURIComponent(raw));
      } catch {
        // ignore malformed header, just skip sources
      }
      if (searched) setIsSearching(true);

      if (!res.ok) {
        setIsSearching(false);
        const err = await res.json().catch(() => null);
        assistantMsg = { ...assistantMsg, content: err?.error || "Sorry — the AI is temporarily unavailable. Please try again." };
        setMessages([...nextMessages, { ...assistantMsg }]);
      } else {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let firstChunk = true;
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (firstChunk) {
              setIsSearching(false);
              firstChunk = false;
            }
            assistantMsg = { ...assistantMsg, content: assistantMsg.content + decoder.decode(value, { stream: true }) };
            setMessages([...nextMessages, { ...assistantMsg }]);
          }
        }
        setIsSearching(false);
        if (searchSources.length > 0) {
          assistantMsg = { ...assistantMsg, sources: searchSources };
          setMessages([...nextMessages, { ...assistantMsg }]);
        }
      }'''

if old_block not in content:
    print("ERROR: exact block not found — no changes made.")
    sys.exit(1)

content = content.replace(old_block, new_block, 1)

with open(path, "w") as f:
    f.write(content)

print("Patched successfully.")
