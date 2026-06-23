import { useState, type ReactNode } from "react";
import FantQualify from "@/components/tabs/FantQualify";
import CallScript from "@/components/tabs/CallScript";
import { ScriptIcon, TargetIcon } from "@/components/ui";
import type { FantKey, VesttKey } from "@/lib/coaching";

type BlueTab = "vestt" | "fant";

const SUBTABS: { id: BlueTab; label: string; icon: ReactNode }[] = [
  { id: "vestt", label: "VESTT", icon: <ScriptIcon size={16} /> },
  { id: "fant", label: "FANT", icon: <TargetIcon size={16} /> },
];

/** BDR Blueprint — the VESTT call motion and the FANT scorecard, as sub-tabs. */
export default function BdrBlueprint({
  fant,
  setFantValue,
  vestt,
  setVesttValue,
  resetNonce,
}: {
  fant: Record<FantKey, boolean>;
  setFantValue: (k: FantKey, v: boolean) => void;
  vestt: Record<VesttKey, boolean>;
  setVesttValue: (k: VesttKey, v: boolean) => void;
  resetNonce: number;
}) {
  const [sub, setSub] = useState<BlueTab>("vestt");

  return (
    <div>
      {/* sub-tab nav (VESTT / FANT) */}
      <div className="px-7 pt-6">
        <div className="flex justify-around items-center border-b border-[var(--border)]">
          {SUBTABS.map((t) => (
            <button
              key={t.id}
              className={`subtab ${sub === t.id ? "is-active" : ""}`}
              onClick={() => setSub(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {sub === "vestt" && (
        <CallScript vestt={vestt} setVesttValue={setVesttValue} />
      )}
      {sub === "fant" && (
        <FantQualify key={resetNonce} fant={fant} setFantValue={setFantValue} />
      )}
    </div>
  );
}
