import { createClient } from "@/lib/supabase/server";
import { getActiveHouse, getHouseWithMembers } from "@/lib/actions/house";
import { getResorts } from "@/lib/actions/resorts";
import { getMultipleWeatherReports } from "@/lib/actions/weather";
import { PageWrapper } from "@/components/page-wrapper";
import { SnowReportContent } from "@/components/weather/snow-report-content";
import { Card, CardContent } from "@/components/ui/card";
import { Snowflake, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SnowReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse) {
    redirect("/create-house");
  }

  const [resortsResult, membersResult, weatherResult] = await Promise.all([
    getResorts(),
    getHouseWithMembers(activeHouse.id),
    getMultipleWeatherReports(activeHouse.favorite_resort_ids || []),
  ]);

  const { resorts, error: resortsError } = resortsResult;
  const { members } = membersResult;
  const { reports, error: weatherError } = weatherResult;

  const currentMember = members.find((m) => m.profiles?.id === user.id);
  const isAdmin = currentMember?.role === "admin";

  // Show error state if resorts failed to load
  if (resortsError) {
    return (
      <PageWrapper>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load</h3>
            <p className="text-muted-foreground">
              Unable to load resort data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl uppercase font-bold flex items-center gap-2">
              <Snowflake className="h-6 w-6" />
              Snow Report
            </h1>
          </div>
        </div>

        <SnowReportContent
          houseId={activeHouse.id}
          houseName={activeHouse.name}
          favoriteResortIds={activeHouse.favorite_resort_ids || []}
          resorts={resorts}
          reports={reports}
          isAdmin={isAdmin}
        />
      </div>
    </PageWrapper>
  );
}
