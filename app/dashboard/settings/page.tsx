import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your house settings
        </p>
      </div>

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
