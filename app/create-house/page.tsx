import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateHouseForm } from "@/components/create-house-form";
import { PendingInviteHandler } from "@/components/pending-invite-handler";
import { Mountain } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CreateHousePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Process any pending house invites */}
      <PendingInviteHandler />

      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-2 items-center font-semibold">
            <Mountain className="w-5 h-5" />
            <Link href="/">Mökki</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <CreateHouseForm />
        </div>
      </main>
    </div>
  );
}
