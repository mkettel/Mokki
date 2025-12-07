import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

async function acceptHouseInvite(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, userEmail: string, houseId: string) {
  // Find the pending invite for this user
  const { data: invite } = await supabase
    .from("house_members")
    .select("id")
    .eq("house_id", houseId)
    .eq("invited_email", userEmail.toLowerCase().trim())
    .eq("invite_status", "pending")
    .maybeSingle();

  if (invite) {
    // Accept the invite
    await supabase
      .from("house_members")
      .update({
        user_id: userId,
        invite_status: "accepted",
        joined_at: new Date().toISOString(),
      })
      .eq("id", invite.id);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  const houseId = searchParams.get("house");
  const code = searchParams.get("code");

  const supabase = await createClient();

  // Handle PKCE flow (code exchange)
  if (code) {
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (houseId && data.user.email) {
        await acceptHouseInvite(supabase, data.user.id, data.user.email, houseId);
      }
      redirect(next);
    } else if (error) {
      redirect(`/auth/error?error=${error.message}`);
    }
  }

  // Handle OTP verification flow
  if (token_hash && type) {
    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      if (houseId && data.user.email) {
        await acceptHouseInvite(supabase, data.user.id, data.user.email, houseId);
      }
      redirect(next);
    } else if (error) {
      redirect(`/auth/error?error=${error.message}`);
    }
  }

  // Check if user is already authenticated (Supabase already verified them)
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    if (houseId && user.email) {
      await acceptHouseInvite(supabase, user.id, user.email, houseId);
    }
    redirect(next);
  }

  // No valid auth method found
  redirect(`/auth/error?error=Unable to verify. Please try signing in.`);
}
