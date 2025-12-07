import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-red uppercase font-bold">Chat</h1>
        <p className="text-muted-foreground">
          Stay connected with your housemates
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            The group chat feature is coming in Phase 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You&apos;ll be able to:</p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>Send messages to the group</li>
            <li>Get real-time updates</li>
            <li>See system notifications (new stays, expenses)</li>
            <li>Coordinate plans with everyone</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
