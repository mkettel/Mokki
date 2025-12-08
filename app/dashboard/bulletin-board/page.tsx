import { createClient } from "@/lib/supabase/server";
import { getActiveHouse } from "@/lib/actions/house";
import { getBulletinItems } from "@/lib/actions/bulletin";
import { getHouseNote } from "@/lib/actions/house-note";
import { PageWrapper } from "@/components/page-wrapper";
import { BulletinBoardGrid } from "@/components/bulletin/bulletin-board-grid";
import { StickyNoteDialog } from "@/components/bulletin/sticky-note-dialog";
import { HouseNote } from "@/components/bulletin/house-note";

export default async function BulletinBoardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse || !user) {
    return null;
  }

  const [{ items }, { note: houseNote }] = await Promise.all([
    getBulletinItems(activeHouse.id),
    getHouseNote(activeHouse.id),
  ]);

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

        {/* Two-column layout: House Note on left, Sticky Notes on right */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: House Note - fixed width on desktop */}
          <div className="w-full lg:w-96 lg:flex-shrink-0">
            <HouseNote note={houseNote} houseId={activeHouse.id} />
          </div>

          {/* Right: Sticky Notes Grid - flexible width */}
          <div className="flex-1 min-w-0">
            <BulletinBoardGrid items={items} houseId={activeHouse.id} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
