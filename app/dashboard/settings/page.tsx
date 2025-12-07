import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User } from "lucide-react";
import { ProfileSettingsForm } from "@/components/profile-settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Failed to load profile settings</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            House settings are coming in Phase 5
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You&apos;ll be able to:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>Update house name and address</li>
            <li>Add house info (WiFi, rules, local tips)</li>
            <li>Manage member roles</li>
            <li>Configure notifications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
