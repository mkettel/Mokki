import { createClient } from "@/lib/supabase/server";
import { getActiveHouse } from "@/lib/actions/house";
import { getHouseStays } from "@/lib/actions/stays";
import { getHouseEvents, getHouseMembersForEvents } from "@/lib/actions/events";
import { AddStayDialog } from "@/components/calendar/add-stay-dialog";
import { AddEventDialog } from "@/components/calendar/add-event-dialog";
import { StaysCalendar } from "@/components/calendar/stays-calendar";
import { StaysList } from "@/components/calendar/stays-list";
import { EventsList } from "@/components/calendar/events-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/page-wrapper";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse || !user) {
    return null;
  }

  const [{ stays }, { events }, { members }] = await Promise.all([
    getHouseStays(activeHouse.id),
    getHouseEvents(activeHouse.id),
    getHouseMembersForEvents(activeHouse.id),
  ]);

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-red uppercase font-bold">Calendar</h1>
            <p className="text-muted-foreground">
              See who&apos;s staying at the house and what&apos;s happening
            </p>
          </div>
          <div className="flex gap-2">
            <AddEventDialog houseId={activeHouse.id} members={members} />
            <AddStayDialog houseId={activeHouse.id} />
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="stays">Stays</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <StaysCalendar stays={stays} events={events} />
          </TabsContent>

          <TabsContent value="stays">
            <StaysList
              stays={stays}
              currentUserId={user.id}
              title="All Stays"
              showAll
            />
          </TabsContent>

          <TabsContent value="events">
            <EventsList
              events={events}
              currentUserId={user.id}
              members={members}
              houseId={activeHouse.id}
              title="All Events"
              showAll
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
