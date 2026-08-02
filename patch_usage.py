import sys
path = "src/lib/chat-context.tsx"
content = open(path).read()
reps = []

old1 = "  const [isSearching, setIsSearching] = useState(false);"
new1 = "  const [isSearching, setIsSearching] = useState(false);\n  const [usageWarning, setUsageWarning] = useState<string | null>(null);"
reps.append(("state", old1, new1))

old2 = "  isSearching: boolean;"
new2 = "  isSearching: boolean;\n  usageWarning: string | null;"
reps.append(("type", old2, new2))

old3 = "        isSearching,"
new3 = "        isSearching,\n        usageWarning,"
reps.append(("value", old3, new3))

old4 = '''      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, complexity: profile.complexity, personalization: profile }),
        signal: controller.signal,
      });'''
new4 = '''      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: apiMessages, complexity: profile.complexity, personalization: profile }),
        signal: controller.signal,
      });

      const usageCount = Number(res.headers.get("X-Billy-Usage-Count") || 0);
      const usageLimit = Number(res.headers.get("X-Billy-Usage-Limit") || 0);
      if (usageLimit > 0) {
        const pct = usageCount / usageLimit;
        if (pct >= 0.9) setUsageWarning(`You're close to today's message limit (${usageCount}/${usageLimit}).`);
        else if (pct >= 0.5) setUsageWarning(`You've used over half of today's messages (${usageCount}/${usageLimit}).`);
        else setUsageWarning(null);
      }'''
reps.append(("fetch", old4, new4))

for label, old, new in reps:
    c = content.count(old)
    if c != 1:
        print(f"ABORT at {label}: found {c} occurrences")
        sys.exit(1)

for label, old, new in reps:
    content = content.replace(old, new, 1)

open(path, "w").write(content)
print("All 4 replacements applied.")
