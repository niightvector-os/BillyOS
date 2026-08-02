import sys

path = "src/components/Core.tsx"
content = open(path).read()
reps = []

# A: "stopped" notice + Regenerate, right after the message content div closes
old_a = '''                </div>
                {m.role === "assistant" && m.images && m.images.length > 0 && ('''
new_a = '''                </div>

                {m.role === "assistant" && m.stopped && (
                  <div className="stopped-notice">
                    <span>You stopped this response.</span>
                    <button
                      className="regenerate-btn"
                      onClick={() => {
                        const prevUser = [...messages].slice(0, i).reverse().find((mm) => mm.role === "user");
                        if (prevUser) handleRegenerate(prevUser.content, i);
                      }}
                    >
                      ↻ Regenerate
                    </button>
                  </div>
                )}

                {m.role === "assistant" && m.images && m.images.length > 0 && ('''
reps.append(("stopped", old_a, new_a))

# B: Copy + Edit on user messages, right after the existing assistant-only copy button
old_b = '''                {m.role === "assistant" && m.content && (
                  <button className="msg-copy" onClick={() => handleCopy(m.content, i)}>
                    {copiedIndex === i ? "Copied" : "Copy"}
                  </button>
                )}'''
new_b = '''                {m.role === "assistant" && m.content && (
                  <button className="msg-copy" onClick={() => handleCopy(m.content, i)}>
                    {copiedIndex === i ? "Copied" : "Copy"}
                  </button>
                )}
                {m.role === "user" && (
                  <div className="user-msg-actions">
                    <button className="msg-copy" onClick={() => handleCopy(m.content, i)}>
                      {copiedIndex === i ? "Copied" : "Copy"}
                    </button>
                    <button className="msg-copy" onClick={() => handleEdit(i, m.content)}>
                      Edit
                    </button>
                  </div>
                )}'''
reps.append(("useractions", old_b, new_b))

for label, old, new in reps:
    c = content.count(old)
    if c != 1:
        print(f"ABORT at {label}: found {c} occurrences")
        sys.exit(1)

for label, old, new in reps:
    content = content.replace(old, new, 1)

open(path, "w").write(content)
print("Both replacements applied.")
