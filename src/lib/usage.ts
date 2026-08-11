import { createClient } from "@supabase/supabase-js";

export const DAILY_LIMIT = 50;

export function nextResetTime() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
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
  const today = new Date().toISOString().slice(0, 10);

  const { data: row } = await supabase
    .from("usage_daily")
    .select("message_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  const currentCount = row?.message_count || 0;

  if (currentCount >= DAILY_LIMIT) {
    return {
      blocked: true,
      count: currentCount,
    };
  }

  const newCount = currentCount + 1;

  await supabase
    .from("usage_daily")
    .upsert({
      user_id: userId,
      usage_date: today,
      message_count: newCount,
    });

  return {
    blocked: false,
    count: newCount,
  };
}

export function usageBlockedResponse() {
  const resetAt = nextResetTime();

  return Response.json(
    {
      error: `You're out of messages for today (${DAILY_LIMIT}/day limit). Your limit resets at ${resetAt.toLocaleTimeString(
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
