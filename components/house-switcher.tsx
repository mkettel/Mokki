"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Home, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveHouseId } from "@/lib/actions/house";

interface House {
  id: string;
  name: string;
  role?: string;
}

interface HouseSwitcherProps {
  activeHouse: House;
  houses: House[];
}

export function HouseSwitcher({ activeHouse, houses }: HouseSwitcherProps) {
  const router = useRouter();

  const handleHouseSelect = async (houseId: string) => {
    if (houseId === activeHouse.id) return;
    await setActiveHouseId(houseId);
    router.refresh();
  };

  const handleCreateHouse = () => {
    router.push("/create-house");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 hover:bg-accent/50 px-2 py-1 rounded-md transition-colors">
        <span className="font-medium uppercase text-sm truncate max-w-[150px]">
          {activeHouse.name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          Your Houses
        </DropdownMenuLabel>
        {houses.map((house) => (
          <DropdownMenuItem
            key={house.id}
            onClick={() => handleHouseSelect(house.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="truncate">{house.name}</span>
            </div>
            {house.id === activeHouse.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCreateHouse}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Create New House</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
