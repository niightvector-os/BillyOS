import sys

path = "src/lib/chat-context.tsx"
with open(path, "r") as f:
    content = f.read()

replacements = []

old_a = "if (!res.ok) {"
new_a = '''const searched = res.headers.get("X-Billy-Searched") === "true";
      let searchSources: { title: string; url: string }[] = [];
      try {
        const raw = res.headers.get("X-Billy-Sources");
        if (raw) searchSources = JSON.parse(decodeURIComponent(raw));
      } catch {}
      if (searched) setIsSearching(true);

      if (!res.ok) {
        setIsSearching(false);'''
replacements.append(("A", old_a, new_a))

old_b1 = "const decoder = new TextDecoder();\n        if (reader) {"
new_b1 = "const decoder = new TextDecoder();\n        let searchingFirstChunk = true;\n        if (reader) {"
replacements.append(("B1", old_b1, new_b1))

old_b2 = "if (done) break;\n            assistantMsg = { ...assistantMsg, content: assistantMsg.content + decoder.decode(value, { stream: true }) };"
new_b2 = '''if (done) break;
            if (searchingFirstChunk) { setIsSearching(false); searchingFirstChunk = false; }
            assistantMsg = { ...assistantMsg, content: assistantMsg.content + decoder.decode(value, { stream: true }) };'''
replacements.append(("B2", old_b2, new_b2))

old_c = "    } catch (err) {\n      if ((err as Error).name !== \"AbortError\") {"
new_c = '''      setIsSearching(false);
      if (searchSources.length > 0) {
        assistantMsg = { ...assistantMsg, sources: searchSources };
        setMessages([...nextMessages, { ...assistantMsg }]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {'''
replacements.append(("C", old_c, new_c))

old_d = "const [loading, setLoading] = useState(false);"
new_d = "const [loading, setLoading] = useState(false);\n  const [isSearching, setIsSearching] = useState(false);"
replacements.append(("D", old_d, new_d))

for label, old, new in replacements:
    count = content.count(old)
    if count != 1:
        print(f"ABORT at {label}: found {count} occurrences (need exactly 1). No changes written.")
        sys.exit(1)

for label, old, new in replacements:
    content = content.replace(old, new, 1)

with open(path, "w") as f:
    f.write(content)

print("All 4 replacements applied successfully.")
