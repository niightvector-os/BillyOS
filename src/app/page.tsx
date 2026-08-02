"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Core from "@/components/Core";
import AccountButton from "@/components/AccountButton";
import GhostButton from "@/components/GhostButton";
import GhostMode from "@/components/GhostMode";
import CodeWorkspace from "@/components/CodeWorkspace";
import { ChatProvider } from "@/lib/chat-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { PromptProvider } from "@/lib/prompt-context";
import { ToastProvider } from "@/lib/toast-context";
import AIDisclaimer from "@/components/AIDisclaimer";

export default function Home() {
  const [ghostActive, setGhostActive] = useState(false);
  const [codeActive, setCodeActive] = useState(false);

  return (
    <ChatProvider>
      <ConfirmProvider>
        <PromptProvider>
          <ToastProvider>
        <main className="stage">
          <Sidebar ghostActive={ghostActive || codeActive} />
          {!ghostActive && !codeActive && <AccountButton />}
          {!ghostActive && !codeActive && <GhostButton onClick={() => setGhostActive(true)} />}
          <Core onOpenCode={() => setCodeActive(true)} />
          {ghostActive && <GhostMode onExit={() => setGhostActive(false)} />}
          {codeActive && <CodeWorkspace onExit={() => setCodeActive(false)} />}
          <AIDisclaimer />
        </main>
      </ToastProvider>
        </PromptProvider>
      </ConfirmProvider>
    </ChatProvider>
  );
}
