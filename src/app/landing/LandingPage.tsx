import { useState } from "react";
import { Timer } from "./Timer";
import { Cycle, type CycleWithPeriods } from "../cycle/Cycle";
import { Tasks } from "./Tasks";
import { PeriodType, type Period } from "@/model/Period";
import { TaskStatus, type Task } from "@/model/Task";

const MOCK_USER_ID = "mock-user";

function makePeriod(time: number, typePeriode: PeriodType, index: number, cycleId: string): Period {
  return {
    id: crypto.randomUUID(),
    time,
    index,
    typePeriode,
    cycle_id: cycleId,
    updatedAt: Date.now(),
    _syncStatus: "synced",
  };
}

function makeCycle(name: string, periodSpecs: Array<[number, PeriodType]>): CycleWithPeriods {
  const id = crypto.randomUUID();
  return {
    id,
    name,
    user_id: MOCK_USER_ID,
    periods: periodSpecs.map(([time, typePeriode], index) => makePeriod(time, typePeriode, index, id)),
    updatedAt: Date.now(),
    _syncStatus: "synced",
  };
}

function makeTask(title: string, description: string, estimatedTime: number, status: TaskStatus, timeSpent = 0): Task {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title,
    description,
    estimatedTime,
    creationDate: now,
    startDate: now,
    timeSpent,
    endDate: now,
    status,
    user_id: MOCK_USER_ID,
    updatedAt: Date.now(),
    _syncStatus: "synced",
  };
}

const INITIAL_CYCLES: CycleWithPeriods[] = [
  makeCycle("Cycle par Défaut", [
    [25 * 60, PeriodType.WORK],
    [5 * 60, PeriodType.REST],
    [25 * 60, PeriodType.WORK],
    [15 * 60, PeriodType.REST],
  ]),
  makeCycle("Cycle 2", [
    [50 * 60, PeriodType.WORK],
    [10 * 60, PeriodType.REST],
  ]),
  makeCycle("Cycle 3", [
    [90 * 60, PeriodType.WORK],
    [20 * 60, PeriodType.REST],
  ]),
];

const DEFAULT_FALLBACK_PERIOD: Period = makePeriod(25 * 60, PeriodType.WORK, 0, "fallback");

export function LandingPage() {
  const [cycles, setCycles] = useState<CycleWithPeriods[]>(INITIAL_CYCLES);
  const [periods, setPeriods] = useState<Period[]>(INITIAL_CYCLES[0]?.periods ?? [DEFAULT_FALLBACK_PERIOD]);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(0);

  // Sécurisation : Si la période à l'index actuel n'existe pas, on prend la première du tableau. Si le tableau est vide, on prend la période de secours.
  const currentPeriod: Period = periods[currentPeriodIndex] ?? periods[0] ?? DEFAULT_FALLBACK_PERIOD;

  const [tasks, setTasks] = useState<Task[]>([
    makeTask("Tâche par défaut uno", "Description 1", 30, TaskStatus.PROGRESS, 1200),
    makeTask("Tâche par défaut secondo", "Description 2", 20, TaskStatus.PENDING, 0),
    makeTask("Tâche par défaut tres", "Description 3", 20, TaskStatus.PENDING, 1199),
  ]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const activePeriods = cycles[0]?.periods ?? periods;
  const totalSessionTime = activePeriods.reduce((acc, p) => acc + (p.time ?? 0), 0);
  const getElapsedBeforeCurrent = (index: number) => {
    return activePeriods.slice(0, index).reduce((acc, p) => acc + (p.time ?? 0), 0);
  };

  const nextPeriod = () => {
    if (activePeriods.length === 0) return;
    setCurrentPeriodIndex((prevIndex) => (prevIndex + 1) % activePeriods.length);
  };

  const previousPeriod = () => {
    if (activePeriods.length === 0) return;
    setCurrentPeriodIndex((prevIndex) => (prevIndex - 1 + activePeriods.length) % activePeriods.length);
  };

  const handleDeleteCycle = (id: string) => {
    setCycles((prevCycles) => prevCycles.filter((cycle) => cycle.id !== id));
  };

  const handleUpdateCycle = (id: string, updatedPeriods: Period[], newName?: string) => {
    setCycles((prevCycles) =>
      prevCycles.map((c) =>
        c.id === id
          ? { ...c, periods: updatedPeriods, name: newName ?? c.name }
          : c
      )
    );
    if (id === cycles[0]?.id) {
      setPeriods(updatedPeriods);
      if (currentPeriodIndex >= updatedPeriods.length) {
        setCurrentPeriodIndex(0);
      }
    }
  };

  const handleDuplicateCycle = (id: string) => {
    const cycleToDuplicate = cycles.find((c) => c.id === id);
    if (!cycleToDuplicate) return;

    const newCycleId = crypto.randomUUID();
    const newCycle: CycleWithPeriods = {
      ...cycleToDuplicate,
      id: newCycleId,
      name: `${cycleToDuplicate.name} (Copie)`,
      periods: cycleToDuplicate.periods.map((p) => ({
        ...p,
        id: crypto.randomUUID(),
        cycle_id: newCycleId,
      })),
    };

    setCycles((prevCycles) => [...prevCycles, newCycle]);
  };

  const handleCreateCycle = () => {
    const newCycle = makeCycle(`Cycle ${cycles.length + 1}`, [
      [25 * 60, PeriodType.WORK],
      [5 * 60, PeriodType.REST],
    ]);
    setCycles((prevCycles) => [...prevCycles, newCycle]);
  };

  const handleSelectCycle = (id: string) => {
    const targetCycle = cycles.find((c) => c.id === id);
    if (!targetCycle) return;

    const remainingCycles = cycles.filter((c) => c.id !== id);
    const updatedCycles = [targetCycle, ...remainingCycles];

    setCycles(updatedCycles);

    // Si le cycle sélectionné possède des périodes, on les applique, sinon on met une période par défaut
    const newPeriods = targetCycle.periods && targetCycle.periods.length > 0
      ? targetCycle.periods
      : [DEFAULT_FALLBACK_PERIOD];

    setPeriods(newPeriods);
    setCurrentPeriodIndex(0);
  };

  const handleTick = () => {
    if (selectedTaskId !== null && currentPeriod && currentPeriod.typePeriode === PeriodType.WORK) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === selectedTaskId) {
            const updatedTimeSpent = task.timeSpent + 1;
            const isCompleted = updatedTimeSpent >= task.estimatedTime * 60;
            return {
              ...task,
              timeSpent: updatedTimeSpent,
              status: isCompleted ? TaskStatus.FINISHED : TaskStatus.PROGRESS,
              updatedAt: Date.now(),
            };
          }
          return task;
        })
      );
    }
  };

  const handleAddTask = (title: string, minutes: number) => {
    setTasks([...tasks, makeTask(title, "", minutes, TaskStatus.PENDING)]);
  };

  const handleEditTask = (id: string, updatedTitle: string, updatedMinutes: number) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, title: updatedTitle, estimatedTime: updatedMinutes, updatedAt: Date.now() }
          : t
      )
    );
  };

  const handleDeleteAll = () => {
    setTasks([]);
    setSelectedTaskId(null);
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          const isCurrentlyCompleted = task.status === TaskStatus.FINISHED;
          const newStatus = isCurrentlyCompleted ? (task.timeSpent > 0 ? TaskStatus.PROGRESS : TaskStatus.PENDING) : TaskStatus.FINISHED;
          return { ...task, status: newStatus, updatedAt: Date.now() };
        }
        return task;
      })
    );
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pt-4 pb-4">
      <Timer
        currentPeriod={currentPeriod}
        onNext={nextPeriod}
        onPrevious={previousPeriod}
        totalSessionTime={totalSessionTime}
        elapsedBeforeCurrent={getElapsedBeforeCurrent(currentPeriodIndex)}
        onTick={handleTick}
      />

      <Cycle
        currentCycle={cycles[0]}
        currentPeriodIndex={currentPeriodIndex}
        cycles={cycles}
        onDeleteCycle={handleDeleteCycle}
        onUpdateCycle={handleUpdateCycle}
        onDuplicateCycle={handleDuplicateCycle}
        onCreateCycle={handleCreateCycle}
        onSelectCycle={handleSelectCycle}
        onSelectPeriodIndex={setCurrentPeriodIndex}
      />

      <Tasks
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onSelectTask={setSelectedTaskId}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onDeleteAll={handleDeleteAll}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}