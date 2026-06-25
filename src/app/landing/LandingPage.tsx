import {Timer} from "./Timer";
import {Cycle} from "../cycle/Cycle";
import {Tasks} from "./Tasks";
import {defaultPeriod, type Period} from "@/model/Period";
import {TaskStatus} from "@/model/Task";
import {defaultCycle} from "@/model/Cycle";
import {CycleRepository, PeriodRepository, TaskRepository} from "@/storage/repositories";
import {useTimer} from "./TimerContext";


export function LandingPage() {
  const {
    user,
    cycles,
    setCycles,
    currentCycle,
    setCurrentCycle,
    isLoading,
    tasks,
    setTasks,
    selectedTask,
    setSelectedTask,
    persistTask,
    refreshTasks,
    periods: activePeriods,
    currentPeriodIndex,
    setPeriods: setActivePeriods,
    setCurrentPeriodIndex,
  } = useTimer();

  const handleDeleteCycle = async (id: string) => {
    await PeriodRepository.getPeriodsForCycle(id)
        .then(periods => Promise.all(periods.map(period => PeriodRepository.delete(period.id))));
    const newCycles = await CycleRepository.delete(id)
        .then(() => CycleRepository.getCyclesForUser(user?.id!));
    setCycles(newCycles);
  };

  const handleUpdateCycle = async (id: string, updatedPeriods: Period[], newName?: string) => {
    const cycleToUpdate = cycles.find((c) => c.id === id);
    if (!cycleToUpdate) return;

    if (newName) {
      const updatedCycle = await CycleRepository.update(cycleToUpdate.id, { name: newName })
      setCycles(prevCycles => prevCycles.map(cycle => cycle.id === updatedCycle.id ? updatedCycle : cycle))
    }
    if (id === currentCycle?.id!) {
      setActivePeriods(updatedPeriods);
    }
  };

  const handleDuplicateCycle = async (id: string) => {
    const cycleToDuplicate = cycles.find((c) => c.id === id);
    if (!cycleToDuplicate) return;

    const newCycle = await CycleRepository.createCycleForUser(user?.id!, {
      ...cycleToDuplicate,
      name: `${cycleToDuplicate.name} (Copie)`
    })

    const periodsToDuplicate = await PeriodRepository.getPeriodsForCycle(cycleToDuplicate.id);
    await Promise.all([
        periodsToDuplicate.map(perdiod => PeriodRepository.createPeriodForCycle(newCycle.id, perdiod))
    ])

    setCycles((prevCycles) => [...prevCycles, newCycle]);
  };

  const handleCreateCycle = async () => {
    const newCycle = await CycleRepository.createCycleForUser(user?.id!, defaultCycle);
    await Promise.all(
        defaultPeriod.map(period => PeriodRepository.createPeriodForCycle(newCycle.id, period))
    );
    setCycles((prevCycles) => [...prevCycles, newCycle]);
  };

  const handleSelectCycle = async (id: string) => {
    const targetCycle = cycles.find((c) => c.id === id);
    if (!targetCycle) return;

    setCurrentCycle(targetCycle);

    const newPeriods = await PeriodRepository.getPeriodsForCycle(targetCycle.id)
    setActivePeriods(newPeriods);
  };

  const handleAddTask = async (title: string, minutes: number) => {
    if (!user) return;
    const now = new Date();
    try {
      const created = await TaskRepository.createTaskForUser(user.id, {
        title,
        description: "",
        estimatedTime: minutes,
        creationDate: now,
        startDate: now,
        timeSpent: 0,
        status: TaskStatus.PENDING,
      });
      setTasks((prev) => (prev.some((t) => t.id === created.id) ? prev : [...prev, created]));
    } catch (e) {
      // Local persistence runs first inside the repository, so the task is
      // likely saved even if a later API/outbox step threw. Reconcile from
      // storage so it appears without needing a page change.
      console.error("Failed to create task", e);
      await refreshTasks();
    }
  };

  const handleEditTask = (id: string, updatedTitle: string, updatedMinutes: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: updatedTitle, estimatedTime: updatedMinutes, updatedAt: Date.now() }
          : t
      )
    );
    persistTask(id, { title: updatedTitle, estimatedTime: updatedMinutes });
  };

  const handleDeleteAll = async () => {
    const toDelete = tasks;
    setTasks([]);
    setSelectedTask(null);
    await Promise.all(
      toDelete.map((t) =>
        TaskRepository.delete(t.id).catch((e) => console.error("Failed to delete task", e))
      )
    );
  };

  const handleToggleComplete = (id: string) => {
    let nextStatus: TaskStatus | null = null;
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          const isCurrentlyCompleted = task.status === TaskStatus.FINISHED;
          const newStatus = isCurrentlyCompleted ? (task.timeSpent > 0 ? TaskStatus.PROGRESS : TaskStatus.PENDING) : TaskStatus.FINISHED;
          nextStatus = newStatus;
          return { ...task, status: newStatus, updatedAt: Date.now() };
        }
        return task;
      })
    );
    if (nextStatus !== null) persistTask(id, { status: nextStatus });
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 text-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (activePeriods.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto py-10 text-center text-sm text-muted-foreground">
        Impossible d'initialiser la session (aucun cycle/période). Réessaie après avoir vidé la base IndexedDB.
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pt-2 pb-12">
      <Cycle
        currentCycle={currentCycle}
        activePeriods={activePeriods}
        currentPeriodIndex={currentPeriodIndex}
        cycles={cycles}
        onDeleteCycle={handleDeleteCycle}
        onUpdateCycle={handleUpdateCycle}
        onDuplicateCycle={handleDuplicateCycle}
        onCreateCycle={handleCreateCycle}
        onSelectCycle={handleSelectCycle}
        onSelectPeriodIndex={setCurrentPeriodIndex}
      />

      <Timer />

      <Tasks
        tasks={tasks}
        selectedTask={selectedTask}
        onSelectTask={setSelectedTask}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onDeleteAll={handleDeleteAll}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}
