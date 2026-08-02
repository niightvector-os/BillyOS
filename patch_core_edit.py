import sys

path = "src/components/Core.tsx"
content = open(path).read()
reps = []

# 1. Pull truncateForEdit from context
old1 = 'const { messages, loading, isSearching, usageWarning, sendMessage, sendResearchMessage, stopGeneration, saveModeResult, pendingLoad, clearPendingLoad, profile } = useChat();'
new1 = 'const { messages, loading, isSearching, usageWarning, sendMessage, sendResearchMessage, stopGeneration, saveModeResult, pendingLoad, clearPendingLoad, profile, truncateForEdit } = useChat();'
reps.append(("destructure", old1, new1))

# 2. Add the edit handler near the existing copy handler
old2 = '''  function handleCopy(content: string, index: number) {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);'''
new2 = '''  async function handleEdit(index: number, content: string) {
    await truncateForEdit(index);
    setInput(content);
    inputRef.current?.focus();
  }

  async function handleRegenerate(userContent: string, assistantIndex: number) {
    await truncateForEdit(Math.max(assistantIndex - 1, 0));
    await sendMessage(userContent);
  }

  function handleCopy(content: string, index: number) {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);'''
reps.append(("handlers", old2, new2))

for label, old, new in reps:
    c = content.count(old)
    if c != 1:
        print(f"ABORT at {label}: found {c} occurrences")
        sys.exit(1)

for label, old, new in reps:
    content = content.replace(old, new, 1)

open(path, "w").write(content)
print("Both replacements applied.")
