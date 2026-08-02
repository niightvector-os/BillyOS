"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ConfirmState = { message: string; resolve: (v: boolean) => void } | null;
type ConfirmFn = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => setState({ message, resolve }));
  }, []);

  function handle(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="confirm-overlay">
          <div className="confirm-bar">
            <span className="confirm-bar-text">{state.message}</span>
            <div className="confirm-bar-actions">
              <button className="confirm-bar-cancel" onClick={() => handle(false)}>Cancel</button>
              <button className="confirm-bar-confirm" onClick={() => handle(true)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
