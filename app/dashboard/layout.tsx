import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { getUserHouses, acceptAllPendingInvites } from "@/lib/actions/house";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Auto-accept any pending invites for this user
  await acceptAllPendingInvites();

  const { houses } = await getUserHouses();

  // If no houses, redirect to create one
  if (houses.length === 0) {
    redirect("/create-house");
  }

  // For now, use the first house as the active house
  const activeHouse = houses[0];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="geometric-bg" aria-hidden="true" />
      <DashboardNav house={activeHouse} houses={houses} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl relative z-10">
        {children}
      </main>
    </div>
  );
}
