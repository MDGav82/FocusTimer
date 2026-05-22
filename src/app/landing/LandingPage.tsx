import { useState } from "react";
import { Timer } from "./Timer";
import { Cycle } from "../cycle/Cycle";
import { Tasks } from "./Tasks";
import type { Period } from "@/model/Period";
import type { PType } from "@/model/Period";
import { Cycle as CycleModel } from "@/model/Cycle";
import { Task, Status } from "@/model/Task";
import { type CycleType } from "@/model/Cycle";

export function LandingPage() {
  const [periods, setPeriods] = useState<Period[]>([
    { id: 1, index: 0, typePeriode: "work" as unknown as PType, time: 25 * 60 },
    { id: 2, index: 1, typePeriode: "break" as unknown as PType, time: 5 * 60 },
    { id: 3, index: 2, typePeriode: "work" as unknown as PType, time: 25 * 60 },
    { id: 4, index: 3, typePeriode: "break" as unknown as PType, time: 15 * 60 },
  ]);

  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(0);
  
  const currentPeriod: Period = (periods[currentPeriodIndex] ?? periods[0])!;

  const [cycles, setCycles] = useState<CycleType[]>([
    {
      id: 1,
      name: "Cycle par Défaut",
      periods: periods,
    }, 
    {
      id: 2,
      name: "Cycle 2",
      periods: [],
    }, 
    {
      id: 3,
      name: "Cycle 3",
      periods: [],
    }
  ]);

  const currentCycleMock: CycleModel = {
    id: cycles[0]?.id ?? 1,
    name: cycles[0]?.name ?? "Cycle par Défaut",
    periods: cycles[0]?.periods ?? periods,
    storeName: 'cycle',
    keyPath: 'id'
  } as unknown as CycleModel;

  const [tasks, setTasks] = useState<Task[]>([
    new Task(1, "Tâche par défaut uno", "Description 1", 1800, new Date(), new Date(), 1200, new Date(), Status.PROGRESS),
    new Task(2, "Tâche par défaut secondo", "Description 2", 1200, new Date(), new Date(), 0, new Date(), Status.PENDING),
    new Task(3, "Tâche par défaut tres", "Description 3", 1200, new Date(), new Date(), 1199, new Date(), Status.PENDING),
  ]);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const activePeriods = cycles[0]?.periods ?? periods;
  const totalSessionTime = activePeriods.reduce((acc, p) => acc + (p.time ?? 0), 0);
  const getElapsedBeforeCurrent = (index: number) => {
    return activePeriods.slice(0, index).reduce((acc, p) => acc + (p.time ?? 0), 0);
  };

  const nextPeriod = () => {
    setCurrentPeriodIndex((prevIndex) => (prevIndex + 1) % activePeriods.length);
  };

  const previousPeriod = () => {
    setCurrentPeriodIndex((prevIndex) => (prevIndex - 1 + activePeriods.length) % activePeriods.length);
  };

  const handleDeleteCycle = (id: number) => {
    setCycles((prevCycles) => prevCycles.filter((cycle) => cycle.id !== id));
  };

  const handleUpdateCycle = (id: number, updatedPeriods: Period[]) => {
    setCycles((prevCycles) =>
      prevCycles.map((c) => (c.id === id ? { ...c, periods: updatedPeriods } : c))
    );
    if (id === cycles[0]?.id) {
      setPeriods(updatedPeriods);
      if (currentPeriodIndex >= updatedPeriods.length) {
        setCurrentPeriodIndex(0);
      }
    }
  };

  // Nouvelle fonction : Dupliquer un cycle existant
  const handleDuplicateCycle = (id: number) => {
    const cycleToDuplicate = cycles.find((c) => c.id === id);
    if (!cycleToDuplicate) return;

    const newCycle: CycleType = {
      id: Date.now(), // ID unique
      name: `${cycleToDuplicate.name} (Copie)`,
      // On clone profondément les périodes en changeant l'id pour éviter les conflits de clés
      periods: cycleToDuplicate.periods.map((p, idx) => ({
        ...p,
        id: Date.now() + idx + Math.random(),
      })),
    };

    setCycles((prevCycles) => [...prevCycles, newCycle]);
  };

  // Nouvelle fonction : Créer un tout nouveau cycle avec configuration par défaut (Travail 25m, Pause 5m)
  const handleCreateCycle = () => {
    const newCycle: CycleType = {
      id: Date.now(),
      name: `Cycle ${cycles.length + 1}`,
      periods: [
        { id: Date.now() + 1, index: 0, typePeriode: "work" as unknown as PType, time: 25 * 60 },
        { id: Date.now() + 2, index: 1, typePeriode: "break" as unknown as PType, time: 5 * 60 },
      ],
    };
    setCycles((prevCycles) => [...prevCycles, newCycle]);
  };

  const handleTick = () => {
    if (selectedTaskId !== null && currentPeriod && String(currentPeriod.typePeriode) === "work") {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === selectedTaskId) {
            const updatedTimeSpent = task.timeSpent + 1;
            const isCompleted = updatedTimeSpent >= task.estimatedTime * 60;
            return new Task(
              task.id,
              task.title,
              task.description,
              task.estimatedTime,
              task.creationDate,
              task.startDate,
              updatedTimeSpent,
              task.endDate,
              isCompleted ? Status.FINISHED : Status.PROGRESS
            );
          }
          return task;
        })
      );
    }
  };

  const handleAddTask = (title: string, hours: number) => {
    const newTask = new Task(Date.now(), title, "", hours, new Date(), new Date(), 0, new Date(), Status.PENDING);
    setTasks([...tasks, newTask]);
  };

  const handleEditTask = (id: number, updatedTitle: string, updatedHours: number) => {
    setTasks(
      tasks.map((t) =>
        t.id === id 
          ? new Task(t.id, updatedTitle, t.description, updatedHours, t.creationDate, t.startDate, t.timeSpent, t.endDate, t.status)
          : t
      )
    );
  };

  const handleDeleteAll = () => {
    setTasks([]);
    setSelectedTaskId(null);
  };

  const handleToggleComplete = (id: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          const isCurrentlyCompleted = task.status === Status.FINISHED;
          const newStatus = isCurrentlyCompleted ? (task.timeSpent > 0 ? Status.PROGRESS : Status.PENDING) : Status.FINISHED;
          return new Task(task.id, task.title, task.description, task.estimatedTime, task.creationDate, task.startDate, task.timeSpent, task.endDate, newStatus);
        }
        return task;
      })
    );
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <Timer 
        currentPeriod={currentPeriod} 
        onNext={nextPeriod} 
        onPrevious={previousPeriod}
        totalSessionTime={totalSessionTime}
        elapsedBeforeCurrent={getElapsedBeforeCurrent(currentPeriodIndex)}
        onTick={handleTick}
      />
      
      <Cycle 
        currentCycle={currentCycleMock}
        currentPeriodIndex={currentPeriodIndex}
        cycles={cycles}
        onDeleteCycle={handleDeleteCycle}
        onUpdateCycle={handleUpdateCycle}
        onDuplicateCycle={handleDuplicateCycle}
        onCreateCycle={handleCreateCycle}
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