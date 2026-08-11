import { createClient } from "@supabase/supabase-js";

export const DAILY_CREDIT_LIMIT = 100;

export function nextResetTime(fromCreditsResetAt?: string) {
  if (fromCreditsResetAt) return new Date(fromCreditsResetAt);
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
}

export async function checkAndIncrementUsage(authHeader: string | null) {
  if (!authHeader) {
    return { blocked: false, count: 0 };
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { blocked: false, count: 0 };
  }
  const userId = userData.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, credits_reset_at")
    .eq("id", userId)
    .maybeSingle();

  let creditsRemaining = profile?.credits_remaining ?? DAILY_CREDIT_LIMIT;
  let creditsResetAt = profile?.credits_reset_at ?? null;

  const now = new Date();
  const resetAt = creditsResetAt ? new Date(creditsResetAt) : null;
  const needsReset = !resetAt || now >= resetAt;

  if (needsReset) {
    creditsRemaining = DAILY_CREDIT_LIMIT;
    const nextReset = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
    );
    creditsResetAt = nextReset.toISOString();
  }

  if (creditsRemaining <= 0) {
    await supabase
      .from("profiles")
      .update({ credits_remaining: creditsRemaining, credits_reset_at: creditsResetAt })
      .eq("id", userId);
    return { blocked: true, count: DAILY_CREDIT_LIMIT - creditsRemaining, resetAt: creditsResetAt };
  }

  const newRemaining = creditsRemaining - 1;
  await supabase
    .from("profiles")
    .update({ credits_remaining: newRemaining, credits_reset_at: creditsResetAt })
    .eq("id", userId);

  return { blocked: false, count: DAILY_CREDIT_LIMIT - newRemaining, resetAt: creditsResetAt };
}

export function usageBlockedResponse(resetAt?: string) {
  const reset = nextResetTime(resetAt);
  return Response.json(
    {
      error: `You're out of credits for today (${DAILY_CREDIT_LIMIT}/day limit). Your credits reset at ${reset.toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Kigali",
        }
      )} Rwanda time.`,
    },
    { status: 429 }
  );
}
