import { Droplets } from "lucide-react";

export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-brand-700">
      <span
        className="grid place-items-center rounded-xl bg-brand-600 text-white"
        style={{ width: size + 12, height: size + 12 }}
      >
        <Droplets size={size} strokeWidth={2.4} />
      </span>
      {withText && <span className="text-xl tracking-tight">PureStream</span>}
    </span>
  );
}
