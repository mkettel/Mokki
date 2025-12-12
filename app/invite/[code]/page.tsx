import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Mountain, Smartphone, Users, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// App Store URL - update this when your app is live on the App Store
const APP_STORE_URL = "https://apps.apple.com/app/mokki/id0000000000"; // TODO: Update with real App Store ID
const TESTFLIGHT_URL = "https://testflight.apple.com/join/AJgvFdSj"; // TODO: Update with TestFlight link

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

async function getInviteDetails(code: string) {
  const supabase = await createClient();

  // Look up the invite code (using type assertion since house_invites may not be in generated types)
  const { data: invite, error } = await (supabase as any)
    .from("house_invites")
    .select(
      `
      id,
      house_id,
      code,
      expires_at,
      houses (
        id,
        name
      )
    `
    )
    .eq("code", code.toUpperCase())
    .single();

  if (error || !invite) {
    return { valid: false, expired: false, houseName: null };
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    return {
      valid: false,
      expired: true,
      houseName: invite.houses?.name || null,
    };
  }

  return {
    valid: true,
    expired: false,
    houseName: invite.houses?.name || "a ski house",
    houseId: invite.house_id,
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const inviteDetails = await getInviteDetails(code);

  // Check if user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in and invite is valid, try to join the house
  if (user && inviteDetails.valid && inviteDetails.houseId) {
    // Check if already a member
    const { data: existingMember } = await supabase
      .from("house_members")
      .select("id")
      .eq("house_id", inviteDetails.houseId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      // Already a member, redirect to dashboard
      redirect("/dashboard");
    }

    // Join the house
    const { error: joinError } = await supabase.from("house_members").insert({
      house_id: inviteDetails.houseId,
      user_id: user.id,
      role: "member",
      invite_status: "accepted",
      joined_at: new Date().toISOString(),
    });

    if (!joinError) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="geometric-bg" aria-hidden="true" />

      {/* Header */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 relative z-10">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-2 items-center font-semibold">
            <Mountain className="w-5 h-5" />
            <Link href="/">Mökki</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            {!inviteDetails.valid ? (
              // Invalid or expired invite
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  {inviteDetails.expired ? "Invite Expired" : "Invalid Invite"}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {inviteDetails.expired
                    ? `This invite to ${
                        inviteDetails.houseName || "the house"
                      } has expired. Ask the house admin for a new invite link.`
                    : "This invite link is not valid. Please check the link and try again."}
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Go to Homepage
                </Link>
              </div>
            ) : (
              // Valid invite - show app download prompt
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  Join {inviteDetails.houseName}
                </h1>
                <p className="text-muted-foreground mb-6">
                  You&apos;ve been invited to join a ski house on Mökki!
                  Download the app to accept this invite.
                </p>

                {/* Invite Code Display */}
                <div className="bg-muted rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Your invite code
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-wider">
                    {code.toUpperCase()}
                  </p>
                </div>

                {/* Download Buttons */}
                <div className="space-y-3">
                  {/* TestFlight for beta */}
                  <a
                    href={TESTFLIGHT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join TestFlight Beta
                  </a>

                  {/* App Store - uncomment when live */}
                  {/* <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Download on App Store
                  </a> */}
                </div>

                <p className="text-xs text-muted-foreground mt-6">
                  After downloading, open the app and enter your invite code to
                  join the house.
                </p>

                {/* Web login option for existing users */}
                {!user && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Already have an account?
                    </p>
                    <Link
                      href={`/auth/login?next=/invite/${code}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in to join on web
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
