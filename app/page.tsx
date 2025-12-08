import { createClient } from "@/lib/supabase/server";
import { HomepageContent } from "@/components/homepage-content";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="geometric-bg" aria-hidden="true" />
      <HomepageContent isLoggedIn={!!user} />
    </div>
  );
}
