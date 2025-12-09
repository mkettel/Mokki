import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { getActiveHouse, acceptAllPendingInvites } from "@/lib/actions/house";
import { getHouseWeatherReport } from "@/lib/actions/weather";
import { DashboardShell } from "@/components/dashboard-shell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Auto-accept any pending invites for this user
  await acceptAllPendingInvites();

  const { house: activeHouse, houses } = await getActiveHouse();

  // If no houses, redirect to create one
  if (!activeHouse || houses.length === 0) {
    redirect("/create-house");
  }

  // Fetch weather for auto-snow feature
  const { report: weatherReport } = await getHouseWeatherReport(activeHouse.id);
  const weatherCode = weatherReport?.weather?.current?.weather_code ?? null;

  return (
    <DashboardShell weatherCode={weatherCode}>
      <div className="min-h-screen flex flex-col">
        <div className="geometric-bg" aria-hidden="true" />
        <DashboardNav house={activeHouse} houses={houses} />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl relative">
          {children}
        </main>
        <InstallPrompt />
      </div>
    </DashboardShell>
  );
}
