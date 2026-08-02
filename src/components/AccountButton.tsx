"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AccountButton() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    window.location.href = "/";
  }

  if (!user) {
    return (
      <Link href="/login" className="account-handle" aria-label="Sign in">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </Link>
    );
  }

  const initial = user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="account-wrap">
      <button className="account-handle account-filled" onClick={() => setMenuOpen((o) => !o)}>
        {initial}
      </button>
      {menuOpen && (
        <div className="account-menu">
          <div className="account-email">{user.email}</div>
          <button className="account-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
