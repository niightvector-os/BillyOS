import sys

path = "src/components/Core.tsx"
content = open(path).read()

# 1. Import + hook
old1 = 'import { createClient } from "@/lib/supabase/client";'
new1 = 'import { createClient } from "@/lib/supabase/client";\nimport { useToast } from "@/lib/toast-context";'
assert content.count(old1) == 1, f"import: found {content.count(old1)}"
content = content.replace(old1, new1, 1)

old2 = "export default function Core({ onOpenCode }: { onOpenCode: () => void }) {"
new2 = old2 + "\n  const toast = useToast();"
assert content.count(old2) == 1, f"hook: found {content.count(old2)}"
content = content.replace(old2, new2, 1)

# 2. Replace each alert() call
swaps = [
    ('alert("Couldn\'t build a study set right now — please try again.");',
     'toast("Couldn\'t build a study set right now — please try again.");'),
    ('alert(err.message || "Couldn\'t build a map for that — please try again.");',
     'toast(err.message || "Couldn\'t find that location — please try again.");'),
    ('alert(err.message || "Couldn\'t find a video for that — please try again.");',
     'toast(err.message || "Couldn\'t find a video for that — please try again.");'),
    ('alert(err.message || "Could not analyze that right now - please try again.");',
     'toast(err.message || "Could not analyze that right now — please try again.");'),
    ('alert("Please sign in to upload files.");',
     'toast("Please sign in to upload files.");'),
    ('alert(err.message || "Couldn\'t upload that file.");',
     'toast(err.message || "Couldn\'t upload that file.");'),
]

for old, new in swaps:
    c = content.count(old)
    if c != 1:
        print(f"ABORT: found {c} occurrences of: {old[:50]}...")
        sys.exit(1)

for old, new in swaps:
    content = content.replace(old, new, 1)

open(path, "w").write(content)
print("All 6 alert() calls converted to toast().")
