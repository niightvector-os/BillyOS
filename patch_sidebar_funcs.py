import sys

path = "src/lib/chat-context.tsx"
with open(path, "r") as f:
    content = f.read()

replacements = []

old_type = "  clearAllConversations: () => Promise<void>;\n};"
new_type = "  clearAllConversations: () => Promise<void>;\n  togglePinned: (id: string, value: boolean) => Promise<void>;\n  renameConversation: (id: string, title: string) => Promise<void>;\n  moveToProject: (id: string, projectId: string) => Promise<void>;\n};"
replacements.append(("type", old_type, new_type))

old_impl = "  return (\n    <ChatContext.Provider"
new_impl = '''  async function togglePinned(id: string, value: boolean) {
    await supabase.from("conversations").update({ pinned: value }).eq("id", id);
    refreshConversations();
  }

  async function renameConversation(id: string, title: string) {
    await supabase.from("conversations").update({ title }).eq("id", id);
    refreshConversations();
  }

  async function moveToProject(id: string, projectId: string) {
    await supabase.from("conversations").update({ project_id: projectId }).eq("id", id);
    refreshConversations();
  }

  return (
    <ChatContext.Provider'''
replacements.append(("impl", old_impl, new_impl))

old_value = "        clearAllConversations,\n      }}"
new_value = "        clearAllConversations,\n        togglePinned,\n        renameConversation,\n        moveToProject,\n      }}"
replacements.append(("value", old_value, new_value))

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
