import { FANT, FANT_QUESTIONS, FANT_THRESHOLD, type FantKey } from "@/lib/coaching";
import { FANT_CHECKS_KEY, usePersistedState } from "@/lib/storage";

export default function FantQualify({
  fant,
  setFantValue,
}: {
  fant: Record<FantKey, boolean>;
  setFantValue: (k: FantKey, v: boolean) => void;
}) {
  // Seed the checklist from the shared FANT state: if a dimension is already
  // lit, pre-check the threshold number of questions. Persisted checks (if any)
  // override this seed after mount, so the exact selections survive a refresh.
  const [checks, setChecks] = usePersistedState<Record<FantKey, boolean[]>>(
    FANT_CHECKS_KEY,
    () => {
      const init = {} as Record<FantKey, boolean[]>;
      (Object.keys(FANT_QUESTIONS) as FantKey[]).forEach((k) => {
        init[k] = FANT_QUESTIONS[k].map((_, i) =>
          fant[k] ? i < FANT_THRESHOLD : false
        );
      });
      return init;
    }
  );

  const toggle = (k: FantKey, i: number) => {
    setChecks((prev) => {
      const row = [...prev[k]];
      row[i] = !row[i];
      const next = { ...prev, [k]: row };
      const count = row.filter(Boolean).length;
      setFantValue(k, count >= FANT_THRESHOLD);
      return next;
    });
  };

  const qualifiedCount = (Object.keys(checks) as FantKey[]).filter(
    (k) => checks[k].filter(Boolean).length >= FANT_THRESHOLD
  ).length;

  const verdict =
    qualifiedCount === 4
      ? "Fully qualified — book the demo and go for the trial close."
      : qualifiedCount >= 2
      ? "Partially qualified — keep discovering on the open dimensions."
      : "Early — keep asking questions before you push for a demo.";

  return (
    <div className="px-4 py-5 md:px-7 md:py-6">
      {/* score header */}
      <div className="cc-panel p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold">FANT qualification</h2>
            <p className="text-[var(--fg-muted)] text-[15px] mt-1">{verdict}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[var(--orange)] tabular-nums">
              {qualifiedCount}
              <span className="text-[var(--fg-dim)] text-xl">/4</span>
            </div>
            <div className="cc-label mb-0 mt-1">dimensions qualified</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(qualifiedCount / 4) * 100}%`,
              background: "var(--orange)",
            }}
          />
        </div>
      </div>

      {/* dimension cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {FANT.map((dim) => {
          const count = checks[dim.key].filter(Boolean).length;
          const qualified = count >= FANT_THRESHOLD;
          return (
            <div
              key={dim.key}
              className="cc-panel p-5"
              style={{
                borderLeft: `3px solid ${qualified ? "var(--orange)" : "var(--border-strong)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold">{dim.label}</h3>
                <span
                  className={`cc-pill ${qualified ? "cc-pill--medium" : "cc-pill--open"}`}
                >
                  {qualified ? "Qualified" : `${count}/${FANT_THRESHOLD}`}
                </span>
              </div>
              <p className="text-[var(--fg-dim)] text-[13px] mb-4">{dim.hint}</p>
              <div className="space-y-2">
                {FANT_QUESTIONS[dim.key].map((q, i) => (
                  <button
                    key={i}
                    className={`cc-check ${checks[dim.key][i] ? "is-on" : ""}`}
                    onClick={() => toggle(dim.key, i)}
                  >
                    <span className="box">✓</span>
                    <span className="text-[14px] text-[var(--fg-muted)] leading-snug">
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
