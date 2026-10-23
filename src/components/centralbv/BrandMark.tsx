import { Flame } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-md bg-accent-fill">
        <Flame size={16} className="text-white" fill="currentColor" strokeWidth={0} aria-hidden />
      </span>
      <span className="text-sm font-semibold text-text-primary">CentralBV</span>
    </div>
  );
}
