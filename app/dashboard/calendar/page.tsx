import { createClient } from "@/lib/supabase/server";
import { getUserHouses } from "@/lib/actions/house";
import { getHouseStays } from "@/lib/actions/stays";
import { AddStayDialog } from "@/components/calendar/add-stay-dialog";
import { StaysCalendar } from "@/components/calendar/stays-calendar";
import { StaysList } from "@/components/calendar/stays-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { houses } = await getUserHouses();
  const activeHouse = houses[0];

  if (!activeHouse || !user) {
    return null;
  }

  const { stays } = await getHouseStays(activeHouse.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-red uppercase font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            See who&apos;s staying at the house and when
          </p>
        </div>
        <AddStayDialog houseId={activeHouse.id} />
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <StaysCalendar stays={stays} />
        </TabsContent>

        <TabsContent value="list">
          <StaysList
            stays={stays}
            currentUserId={user.id}
            title="All Stays"
            showAll
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
