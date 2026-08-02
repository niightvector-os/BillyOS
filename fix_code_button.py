import sys

path = "src/components/Core.tsx"
with open(path, "r") as f:
    content = f.read()

old1 = '''    onClick={() => {
      const codeSection = document.getElementById("billyos-code-mode");
      if (codeSection) {
        codeSection.scrollIntoView({ behavior: "smooth" });
      }
    }}
  >
    <span className="sym">&lt;/&gt;</span> Code
  </button>
</div>'''
new1 = '''    onClick={onOpenCode}
  >
    <span className="sym">&lt;/&gt;</span> Code
  </button>
</div>'''

old2 = '''      <button
  type="button"
  className={`mode-pill ${activeMode === "code" ? "mode-active" : ""}`}
  onClick={() => {
    const codeSection = document.getElementById("billyos-code-mode");
    if (codeSection) {
      codeSection.scrollIntoView({ behavior: "smooth" });
    }
  }}
>
  <span className="sym">&lt;/&gt;</span> Code
</button>
      </form>'''
new2 = '''      </form>'''

for label, old, new in [("fix1", old1, new1), ("fix2", old2, new2)]:
    count = content.count(old)
    if count != 1:
        print(f"ABORT at {label}: found {count} occurrences (need exactly 1). No changes written.")
        sys.exit(1)

content = content.replace(old1, new1, 1)
content = content.replace(old2, new2, 1)

with open(path, "w") as f:
    f.write(content)

print("Both fixes applied successfully.")
