import { createClient } from "@/lib/supabase/server";
import { getActiveHouse } from "@/lib/actions/house";
import { getBulletinItems } from "@/lib/actions/bulletin";
import { PageWrapper } from "@/components/page-wrapper";
import { BulletinBoardGrid } from "@/components/bulletin/bulletin-board-grid";
import { StickyNoteDialog } from "@/components/bulletin/sticky-note-dialog";

export default async function BulletinBoardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse || !user) {
    return null;
  }

  const { items } = await getBulletinItems(activeHouse.id);

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-14">
          <div>
            <h1 className="text-2xl text-red uppercase font-bold">
              Bulletin Board
            </h1>
            <p className="text-muted-foreground">
              Important info and notes for {activeHouse.name}
            </p>
          </div>
          <StickyNoteDialog houseId={activeHouse.id} />
        </div>

        <BulletinBoardGrid items={items} houseId={activeHouse.id} />
      </div>
    </PageWrapper>
  );
}
