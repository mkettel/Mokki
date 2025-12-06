import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">
          Track shared costs and settle up
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            The expense tracking feature is coming in Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You&apos;ll be able to:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
            <li>Log expenses (groceries, utilities, supplies)</li>
            <li>Split costs evenly or custom amounts</li>
            <li>See your balance (who owes what)</li>
            <li>Mark debts as settled</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
