import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";
import Link from "next/link";
import { Suspense } from "react";
import { Mountain, Calendar, DollarSign, MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-2 items-center font-semibold">
              <Mountain className="w-5 h-5" />
              <Link href={"/"}>Mökki</Link>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-12 max-w-5xl p-5 pt-12">
          <Hero />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Track Stays"
              description="See who's at the house and when. Plan your trips around the group."
            />
            <FeatureCard
              icon={<DollarSign className="w-8 h-8" />}
              title="Split Expenses"
              description="Track groceries, utilities, and shared costs. Know who owes what."
            />
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8" />}
              title="Stay Connected"
              description="Group chat to coordinate plans and share updates with everyone."
            />
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p className="text-muted-foreground">Mökki - Your ski house, organized.</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-6 rounded-lg border bg-card">
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
