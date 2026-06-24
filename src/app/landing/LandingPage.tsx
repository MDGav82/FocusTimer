import {useEffect, useState} from "react";
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

  const handleTick = async () => {
    const currentPeriod = activePeriods[currentPeriodIndex]!;
    if (selectedTask !== null && currentPeriod.typePeriode === PeriodType.WORK) {
      const updatedTask = await TaskRepository.update(selectedTask.id, {
        timeSpent: selectedTask.timeSpent + currentPeriod.time,
        updatedAt: Date.now()
      })
      setTasks(prevTasks => prevTasks.map(task => task.id === selectedTask.id ? updatedTask : task));
    }
  };

  const handleAddTask = async (title: string, minutes: number) => {
    const newTask = await TaskRepository.createTaskForUser(user?.id!, {
      title: title,
      description: "",
      estimatedTime: minutes,
      creationDate: new Date(),
      status: TaskStatus.PENDING,
      timeSpent: 0,
    })
    setTasks([...tasks, newTask]);
  };

  const handleEditTask = async (id: string, updatedTitle: string, updatedMinutes: number) => {
    const updatedTask = await TaskRepository.update(id, {
      title: updatedTitle,
      estimatedTime: updatedMinutes,
    })
    setTasks(prevState => prevState.map(task => task.id === updatedTask.id ? updatedTask : task))
  };

  const handleDeleteAll = () => {
    setTasks([]);
    setSelectedTask(null);
  };

  const handleToggleComplete = async (id: string) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate || taskToUpdate.status === TaskStatus.FINISHED) return;

    const updatedTask = await TaskRepository.update(id, {
      status: TaskStatus.FINISHED,
      endDate: new Date()
    })
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));

    if (selectedTask?.id! === id) {
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