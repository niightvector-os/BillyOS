import sys

path = "src/components/Core.tsx"
content = open(path).read()
reps = []

# 1. Remove the attachment chip block
old1 = '''{attachedFile && (
          <div className="attachment-chip">
            <span className="attachment-icon">📎</span>
            <span className="attachment-name">{attachedFile.filename}</span>
            <button type="button" onClick={() => setAttachedFile(null)} aria-label="Remove attachment">✕</button>
          </div>
        )}
        '''
new1 = ''
reps.append(("chip", old1, new1))

# 2. Remove the + button and hidden file input from the search bar
old2 = '''<input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.pdf,.docx,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleFileSelect} />
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
          '''
new2 = ''
reps.append(("plusbtn", old2, new2))

# 3. Revert the Study Mode branch to ignore file attachments
old3 = '''      const topic = attachedFile
        ? `${input}\\n\\nBase this on the following uploaded material titled "${attachedFile.filename}":\\n${attachedFile.extractedText}`
        : input;
      setInput(""); setActiveMode(null); setStudyLoading(true);
      setAttachedFile(null);'''
new3 = '''      const topic = input;
      setInput(""); setActiveMode(null); setStudyLoading(true);'''
reps.append(("study", old3, new3))

# 4. Revert the plain-chat branch to ignore file attachments
old4 = '''    const displayText = input;
    const promptOverride = attachedFile
      ? `${input}\\n\\n[Attached file: ${attachedFile.filename}]\\n${attachedFile.extractedText}`
      : undefined;
    setInput(""); setActiveMode(null); stickToBottom.current = true;
    setAttachedFile(null);
    await sendMessage(displayText, promptOverride);
  }'''
new4 = '''    const displayText = input;
    setInput(""); setActiveMode(null); stickToBottom.current = true;
    await sendMessage(displayText);
  }'''
reps.append(("chat", old4, new4))

for label, old, new in reps:
    c = content.count(old)
    if c != 1:
        print(f"ABORT at {label}: found {c} occurrences (need exactly 1)")
        sys.exit(1)

for label, old, new in reps:
    content = content.replace(old, new, 1)

open(path, "w").write(content)
print("All 4 removals applied — the + button, attachment chip, and file logic are gone.")
