import { useCallback, useEffect, useMemo, useState } from "react";
import { CycleRepository, PeriodRepository } from "@/storage/repositories";
import type { Cycle as StorageCycle } from "@/model/Cycle";
import type { Period as StoragePeriod } from "@/model/Period";
import { toUI, type UICycle } from "@/domain/types";

export function useCycles(userId?: string) {
  const [cycles, setCycles] = useState<UICycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list: StorageCycle[] = await CycleRepository.getCyclesForUser(userId);
      const withPeriods: UICycle[] = await Promise.all(
        list.map(async (c) => {
          const periods: StoragePeriod[] = await PeriodRepository.getPeriodsForCycle(c.id!);
          return toUI(c, periods);
        })
      );
      setCycles(withPeriods);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (input: Partial<StorageCycle>) => {
      if (!userId) throw new Error("No userId");
      const created = await CycleRepository.createCycleForUser(userId, {
        name: input.name ?? "Nouveau cycle",
        user_id: userId,
      } as StorageCycle);
      const periods: StoragePeriod[] = await PeriodRepository.getPeriodsForCycle(created.id!);
      const ui = toUI(created, periods);
      setCycles((cs) => [ui, ...cs]);
      return ui;
    },
    [userId]
  );

  const update = useCallback(async (id: string, patch: Partial<StorageCycle>) => {
    await CycleRepository.update(id, patch as any);
    const c = await CycleRepository.getById(id);
    const periods = await PeriodRepository.getPeriodsForCycle(id);
    const ui = toUI(c!, periods);
    setCycles((cs) => cs.map((x) => (x.id === id ? ui : x)));
    return ui;
  }, []);

  const remove = useCallback(async (id: string) => {
    await CycleRepository.delete(id);
    setCycles((cs) => cs.filter((x) => x.id !== id));
  }, []);

  return { cycles, loading, error, reload: load, create, update, remove } as const;
}
