"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Core from "@/components/Core";
import AccountButton from "@/components/AccountButton";
import GhostButton from "@/components/GhostButton";
import GhostMode from "@/components/GhostMode";
import { ChatProvider } from "@/lib/chat-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { PromptProvider } from "@/lib/prompt-context";
import { ToastProvider } from "@/lib/toast-context";
import AIDisclaimer from "@/components/AIDisclaimer";

export default function Home() {
  const [ghostActive, setGhostActive] = useState(false);

  return (
    <ChatProvider>
      <ConfirmProvider>
        <PromptProvider>
          <ToastProvider>
        <main className="stage">
          <Sidebar ghostActive={ghostActive} />
          {!ghostActive && <AccountButton />}
          {!ghostActive && <GhostButton onClick={() => setGhostActive(true)} />}
          <Core />
          {ghostActive && <GhostMode onExit={() => setGhostActive(false)} />}
          <AIDisclaimer />
        </main>
      </ToastProvider>
        </PromptProvider>
      </ConfirmProvider>
    </ChatProvider>
  );
}
