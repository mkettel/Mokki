import { createClient } from "@/lib/supabase/server";
import { getUserHouses, getHouseWithMembers } from "@/lib/actions/house";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, DollarSign, MessageCircle, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  console.log(data);

  const { houses } = await getUserHouses();
  const activeHouse = houses[0];

  if (!activeHouse) {
    return null; // Layout will redirect to create-house
  }

  const { members } = await getHouseWithMembers(activeHouse.id);
  const acceptedMembers = members.filter((m) => m.invite_status === "accepted");

  return (
    <div className="">
      <div>
        <h1 className="text-2xl uppercase font-bold">{activeHouse.name}</h1>
        <p className="text-muted-foreground font-medium text-lg font-telma">
          Welcome back! Here&apos;s what&apos;s happening at the house.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <QuickStatCard
          title="Members"
          value={acceptedMembers.length.toString()}
          description="people in this house"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/members"
        />
        <QuickStatCard
          title="Upcoming Stays"
          value="—"
          description="Coming soon"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/calendar"
        />
        <QuickStatCard
          title="Balance"
          value="$0"
          description="you owe / are owed"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/expenses"
        />
        <QuickStatCard
          title="Messages"
          value="—"
          description="Coming soon"
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/chat"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks for your house</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href="/dashboard/calendar"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Add a Stay</p>
                <p className="text-sm text-muted-foreground">
                  Let everyone know when you&apos;ll be there
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/expenses"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Log an Expense</p>
                <p className="text-sm text-muted-foreground">
                  Track groceries, supplies, and shared costs
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/members"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Invite Members</p>
                <p className="text-sm text-muted-foreground">
                  Add people to your house
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">House Members</CardTitle>
            <CardDescription>{acceptedMembers.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acceptedMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.profiles?.display_name?.[0]?.toUpperCase() ||
                        member.profiles?.email?.[0]?.toUpperCase() ||
                        "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.profiles?.display_name || member.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
              {acceptedMembers.length > 5 && (
                <Link
                  href="/dashboard/members"
                  className="text-sm text-primary hover:underline"
                >
                  View all {acceptedMembers.length} members
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickStatCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
