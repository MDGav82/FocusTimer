import {useCallback, useEffect, useRef, useState} from "react";
import {Timer} from "./Timer";
import {Cycle} from "../cycle/Cycle";
import {Tasks} from "./Tasks";
import {defaultPeriod, type Period, PeriodType} from "@/model/Period";
import {type Task, TaskStatus} from "@/model/Task";
import {type Cycle as CycleModel, defaultCycle} from "@/model/Cycle";
import type {User} from "@/model/User.ts";
import {CycleRepository, PeriodRepository, TaskRepository, UserRepository} from "@/storage/repositories";


export function LandingPage() {
  const [isLoading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)

  const [cycles, setCycles] = useState<CycleModel[]>([]);
  const [currentCycle, setCurrentCycle] = useState<CycleModel | null>(null)
  const [activePeriods, setActivePeriods] = useState<Period[]>([]);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(0);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    async function fetchData() {
      let user: User;
      let lastSessionMeta = await UserRepository.getLastSessionMeta();

      if (lastSessionMeta === undefined) {
        user = await UserRepository.createLocalUser();
      } else {
        user = (await UserRepository.getById(lastSessionMeta.lastUserId))!;
      }
      setUser(user);

      const taskPromise = TaskRepository.getTasksForUser(user.id)
          .then((tasks) => setTasks(tasks));

      const currentCycles = await CycleRepository.getCyclesForUser(user.id);
      setCycles(currentCycles);

      let resolvedCycle: CycleModel;
      if (lastSessionMeta === undefined) {
        resolvedCycle = currentCycles[0]!
      } else {
        resolvedCycle = currentCycles.find(c => c.id === lastSessionMeta.selectedCycleId)!;
      }
      setCurrentCycle(resolvedCycle);

      const periodsPromise = PeriodRepository.getPeriodsForCycle(resolvedCycle.id)
          .then(periods => setActivePeriods(periods));

      await Promise.all([
          taskPromise,
          periodsPromise
      ])
      setLoading(false);
    }
    fetchData()
  }, [])

  // Keep the latest tasks reachable from the periodic-flush interval without
  // re-subscribing it on every tick.
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const persistTask = useCallback(async (id: string, patch: Partial<Task>) => {
    try {
      await TaskRepository.update(id, patch);
    } catch (e) {
      console.error("Failed to persist task", e);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    if (!user) return;
    try {
      setTasks(await TaskRepository.getTasksForUser(user.id));
    } catch (e) {
      console.error("Failed to refresh tasks", e);
    }
  }, [user]);

  // Ticks accumulate timeSpent in local state for a smooth countdown; flush the
  // selected task to storage every 10s and once more when it is deselected,
  // instead of writing to the DB on every single tick.
  const selectedTaskId = selectedTask?.id;
  useEffect(() => {
    if (!selectedTaskId) return;
    const flush = () => {
      const t = tasksRef.current.find((t) => t.id === selectedTaskId);
      if (t && t.timeSpent > 0) persistTask(t.id, { timeSpent: t.timeSpent, status: t.status });
    };
    const interval = setInterval(flush, 10000);
    return () => {
      clearInterval(interval);
      flush();
    };
  }, [selectedTaskId, persistTask]);

  if (isLoading) {
    return (<div> Loadding ... </div>);
  }

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
      setCurrentPeriodIndex(0);
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
    setCurrentPeriodIndex(0);
  };

  const handleTick = () => {
    const currentPeriod = activePeriods[currentPeriodIndex];
    if (!selectedTask || !currentPeriod || currentPeriod.typePeriode !== PeriodType.WORK) return;
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== selectedTask.id) return task;
        const updatedTimeSpent = task.timeSpent + 1;
        const isCompleted = updatedTimeSpent >= task.estimatedTime * 60;
        // Persist immediately on the completion transition; ongoing progress is
        // flushed by the periodic effect above.
        if (isCompleted && task.status !== TaskStatus.FINISHED) {
          persistTask(task.id, { timeSpent: updatedTimeSpent, status: TaskStatus.FINISHED });
        }
        return {
          ...task,
          timeSpent: updatedTimeSpent,
          status: isCompleted ? TaskStatus.FINISHED : TaskStatus.PROGRESS,
          updatedAt: Date.now(),
        };
      })
    );
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pt-4 pb-4">
      <Timer
        currentPeriod={activePeriods[currentPeriodIndex]!}
        onNext={nextPeriod}
        onPrevious={previousPeriod}
        totalSessionTime={totalSessionTime}
        elapsedBeforeCurrent={getElapsedBeforeCurrent(currentPeriodIndex)}
        onTick={handleTick}
      />

      <Cycle
        currentCycle={currentCycle}
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
