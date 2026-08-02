import sys

path = "src/lib/chat-context.tsx"
content = open(path).read()
reps = []

# 1. Add `stopped` flag to Message type
old1 = '''type Message = {
  role: "user" | "assistant";
  content: string;
  images?: ImageResult[];
  mapLocations?: LocationResult[];
  sources?: SourceResult[];
};'''
new1 = '''type Message = {
  role: "user" | "assistant";
  content: string;
  images?: ImageResult[];
  mapLocations?: LocationResult[];
  sources?: SourceResult[];
  stopped?: boolean;
};'''
reps.append(("type", old1, new1))

# 2. Mark the message as stopped (not an error) when aborted
old2 = '''    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        assistantMsg = { ...assistantMsg, content: "Sorry — something went wrong reaching the AI. Please try again." };
        setMessages([...nextMessages, { ...assistantMsg }]);
      }
    }'''
new2 = '''    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        assistantMsg = { ...assistantMsg, content: "Sorry — something went wrong reaching the AI. Please try again." };
        setMessages([...nextMessages, { ...assistantMsg }]);
      } else {
        assistantMsg = { ...assistantMsg, stopped: true };
        setMessages([...nextMessages, { ...assistantMsg }]);
      }
    }'''
reps.append(("abort", old2, new2))

# 3. Add truncateForEdit — used for both editing a past message and regenerating a stopped response
old3 = "  async function sendMessage(displayText: string, promptOverride?: string) {"
new3 = '''  async function truncateForEdit(index: number) {
    const truncated = messages.slice(0, index);
    setMessages(truncated);
    if (conversationId) {
      await supabase.from("messages").delete().eq("conversation_id", conversationId);
      if (truncated.length > 0) {
        await supabase.from("messages").insert(
          truncated.map((m) => ({ conversation_id: conversationId, role: m.role, content: m.content }))
        );
      }
    }
  }

  async function sendMessage(displayText: string, promptOverride?: string) {'''
reps.append(("truncate", old3, new3))

# 4. Expose it in the type
old4 = "  clearAllConversations: () => Promise<void>;"
new4 = "  clearAllConversations: () => Promise<void>;\n  truncateForEdit: (index: number) => Promise<void>;"
reps.append(("exposetype", old4, new4))

# 5. Expose it in the provider value
old5 = "        clearAllConversations,"
new5 = "        clearAllConversations,\n        truncateForEdit,"
reps.append(("exposevalue", old5, new5))

for label, old, new in reps:
    c = content.count(old)
    if c != 1:
        print(f"ABORT at {label}: found {c} occurrences")
        sys.exit(1)

for label, old, new in reps:
    content = content.replace(old, new, 1)

open(path, "w").write(content)
print("All 5 replacements applied.")
