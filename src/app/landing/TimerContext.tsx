import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { PeriodType, type Period } from "@/model/Period";
import { type Task, TaskStatus } from "@/model/Task";
import type { Cycle as CycleModel } from "@/model/Cycle";
import type { User } from "@/model/User";
import { CycleRepository, PeriodRepository, TaskRepository, UserRepository } from "@/storage/repositories";

interface SessionState {

  user: User | null;
  cycles: CycleModel[];
  setCycles: Dispatch<SetStateAction<CycleModel[]>>;
  currentCycle: CycleModel | null;
  setCurrentCycle: Dispatch<SetStateAction<CycleModel | null>>;
  isLoading: boolean;

  // Task
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  selectedTask: Task | null;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  persistTask: (id: string, patch: Partial<Task>) => Promise<void>;
  refreshTasks: () => Promise<void>;

  // Timer
  periods: Period[];
  currentPeriodIndex: number;
  currentPeriod: Period | undefined;
  timeLeft: number;
  isActive: boolean;
  setPeriods: (periods: Period[]) => void;
  setCurrentPeriodIndex: Dispatch<SetStateAction<number>>;
  toggleActive: () => void;
  reset: () => void;
  next: () => void;
  previous: () => void;

  onPeriodEndRef: React.MutableRefObject<((completed: Period) => void) | null>;
}

const TimerContext = createContext<SessionState | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cycles, setCycles] = useState<CycleModel[]>([]);
  const [currentCycle, setCurrentCycle] = useState<CycleModel | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [periods, setPeriodsRaw] = useState<Period[]>([]);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  const onPeriodEndRef = useRef<((completed: Period) => void) | null>(null);

  const currentPeriod = periods[currentPeriodIndex];

  
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lastSessionMeta = await UserRepository.getLastSessionMeta();
      const existingUser = lastSessionMeta
        ? await UserRepository.getById(lastSessionMeta.lastUserId)
        : undefined;
      
      const u = existingUser ?? (await UserRepository.createLocalUser());
      if (cancelled) return;
      setUser(u);

      const [userTasks, userCycles] = await Promise.all([
        TaskRepository.getTasksForUser(u.id),
        CycleRepository.getCyclesForUser(u.id),
      ]);
      if (cancelled) return;
      setTasks(userTasks);
      setCycles(userCycles);

     
      const resolvedCycle =
        userCycles.find((c) => c.id === lastSessionMeta?.selectedCycleId) ?? userCycles[0];
      setCurrentCycle(resolvedCycle ?? null);

      if (resolvedCycle) {
        const ps = await PeriodRepository.getPeriodsForCycle(resolvedCycle.id);
        if (cancelled) return;
        setPeriodsRaw(ps);
      }
    })()
      .catch((e) => console.error("Failed to initialize session", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const setPeriods = useCallback((next: Period[]) => {
    setPeriodsRaw(next);
    setCurrentPeriodIndex(0);
  }, []);

  const next = useCallback(() => {
    setPeriodsRaw((ps) => {
      if (ps.length) setCurrentPeriodIndex((i) => (i + 1) % ps.length);
      return ps;
    });
  }, []);

  const previous = useCallback(() => {
    setPeriodsRaw((ps) => {
      if (ps.length) setCurrentPeriodIndex((i) => (i - 1 + ps.length) % ps.length);
      return ps;
    });
  }, []);

  const toggleActive = useCallback(() => setIsActive((v) => !v), []);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeLeft((prev) => (currentPeriod ? currentPeriod.time : prev));
  }, [currentPeriod]);

  const accumulateSelectedTask = useCallback(() => {
    if (!selectedTask || !currentPeriod || currentPeriod.typePeriode !== PeriodType.WORK) return;
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== selectedTask.id) return task;
        const updatedTimeSpent = task.timeSpent + 1;
        const isCompleted = updatedTimeSpent >= task.estimatedTime * 60;
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
  }, [selectedTask, currentPeriod, persistTask]);

  useEffect(() => {
    if (currentPeriod) setTimeLeft(currentPeriod.time);
    setIsActive(false);
  }, [currentPeriod?.id]);


  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      accumulateSelectedTask();
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, timeLeft, accumulateSelectedTask]);


  useEffect(() => {
    if (timeLeft !== 0 || !isActive) return;
    setIsActive(false);
    if (currentPeriod) onPeriodEndRef.current?.(currentPeriod);
    next();
  }, [timeLeft, isActive]);

  
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

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

  return (
    <TimerContext.Provider
      value={{
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
        periods,
        currentPeriodIndex,
        currentPeriod,
        timeLeft,
        isActive,
        setPeriods,
        setCurrentPeriodIndex,
        toggleActive,
        reset,
        next,
        previous,
        onPeriodEndRef,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): SessionState {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer doit être utilisé dans un <TimerProvider>");
  return ctx;
}
