"use client";

import Sidebar from "@/components/Sidebar";
import Core from "@/components/Core";
import AccountButton from "@/components/AccountButton";
import { ChatProvider } from "@/lib/chat-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { PromptProvider } from "@/lib/prompt-context";
import { ToastProvider } from "@/lib/toast-context";
import AIDisclaimer from "@/components/AIDisclaimer";

export default function Home() {
  return (
    <ChatProvider>
      <ConfirmProvider>
        <PromptProvider>
          <ToastProvider>
            <main className="stage">
              <Sidebar ghostActive={false} />
              <AccountButton />
              <Core />
              <AIDisclaimer />
            </main>
          </ToastProvider>
        </PromptProvider>
      </ConfirmProvider>
    </ChatProvider>
  );
}
