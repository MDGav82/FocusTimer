import type { Cycle as StorageCycle } from "@/model/Cycle";
import type { Period as StoragePeriod } from "@/model/Period";
import { PeriodType } from "@/model/Period";

// UI/domain-facing normalized types. Duration is expressed in seconds.
export type UICycle = {
  id: string;
  name: string;
  periods: UIPeriod[];
  userId: string;
};

export type UIPeriod = {
  id: string;
  durationSec: number;
  type: PeriodType;
  index: number;
  cycleId: string;
};

export function toUI(cycle: StorageCycle, periods: StoragePeriod[]): UICycle {
  return {
    id: cycle.id!,
    name: cycle.name,
    userId: cycle.user_id,
    periods: periods
      .slice()
      .sort((a, b) => a.index - b.index)
      .map(toUIPeriod),
  };
}

export function toUIPeriod(p: StoragePeriod): UIPeriod {
  return {
    id: p.id!,
    durationSec: p.time,
    type: p.typePeriode,
    index: p.index,
    cycleId: p.cycle_id,
  };
}
