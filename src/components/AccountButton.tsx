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
    window.location.href = "/login";
  }

  if (!user) {
    return (
      <div className="account-auth-actions">
        <Link href="/login?mode=signin" className="account-login-link">
          Log in
        </Link>
        <Link href="/login?mode=signup" className="account-signup-link">
          Sign up
        </Link>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initial = user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="account-wrap">
      <button className="account-handle account-filled" onClick={() => setMenuOpen((o) => !o)}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="account-avatar-img" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
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
