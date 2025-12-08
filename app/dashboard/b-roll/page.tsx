import { createClient } from "@/lib/supabase/server";
import { getActiveHouse } from "@/lib/actions/house";
import { getBRollMedia } from "@/lib/actions/broll";
import { PageWrapper } from "@/components/page-wrapper";
import { BRollFeed } from "@/components/broll/broll-feed";
import { BRollUploadDialog } from "@/components/broll/broll-upload-dialog";
import { BRollProvider } from "@/components/broll/broll-context";

export default async function BRollPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse || !user) {
    return null;
  }

  const [{ items, grouped, hasMore }, { data: profile }] = await Promise.all([
    getBRollMedia(activeHouse.id),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  if (!profile) {
    return null;
  }

  return (
    <PageWrapper>
      <BRollProvider
        initialItems={items}
        initialGrouped={grouped}
        initialHasMore={hasMore}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl text-red uppercase font-bold">B-Roll</h1>
              <p className="text-muted-foreground">
                Photos and videos from {activeHouse.name}
              </p>
            </div>
            <BRollUploadDialog
              houseId={activeHouse.id}
              currentUserProfile={profile}
            />
          </div>

          <BRollFeed houseId={activeHouse.id} currentUserId={user.id} />
        </div>
      </BRollProvider>
    </PageWrapper>
  );
}
