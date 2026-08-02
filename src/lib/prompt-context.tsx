"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type PromptState = { message: string; resolve: (v: string | null) => void } | null;
type PromptFn = (message: string, defaultValue?: string) => Promise<string | null>;

const PromptContext = createContext<PromptFn | null>(null);

export function PromptProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PromptState>(null);
  const [value, setValue] = useState("");

  const promptFn = useCallback((message: string, defaultValue = "") => {
    setValue(defaultValue);
    return new Promise<string | null>((resolve) => setState({ message, resolve }));
  }, []);

  function handle(result: string | null) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <PromptContext.Provider value={promptFn}>
      {children}
      {state && (
        <div className="confirm-overlay">
          <div className="confirm-bar confirm-bar-prompt">
            <div className="confirm-prompt-body">
              <span className="confirm-bar-text">{state.message}</span>
              <input
                className="auth-input"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handle(value);
                  if (e.key === "Escape") handle(null);
                }}
              />
            </div>
            <div className="confirm-bar-actions">
              <button className="confirm-bar-cancel" onClick={() => handle(null)}>Cancel</button>
              <button className="confirm-bar-confirm" onClick={() => handle(value)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error("usePrompt must be used within PromptProvider");
  return ctx;
}
