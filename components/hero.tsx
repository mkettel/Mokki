import { Mountain } from "lucide-react";

export function Hero() {
  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="flex gap-4 justify-center items-center">
        <Mountain className="w-12 h-12 text-primary" />
        <h1 className="text-4xl lg:text-5xl font-bold">Mökki</h1>
      </div>
      <p className="text-xl lg:text-2xl !leading-tight mx-auto max-w-xl text-center text-muted-foreground">
        Your ski house, organized.
      </p>
      <p className="text-base text-center max-w-md text-muted-foreground">
        Track who&apos;s staying, split expenses, and keep everyone in the loop.
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-4" />
    </div>
  );
}
