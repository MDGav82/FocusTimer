import { useState } from "react";
import { Timer } from "./Timer";
import { Cycle } from "../cycle/Cycle";
import { Tasks } from "./Tasks";

interface Period {
  name: string;
  type: "work" | "short_break" | "long_break";
  duration: number;
}

interface Task {
  id: number;
  title: string;
  status: string;
  estimated: number; // en minutes (contexte des itérations précédentes)
  actual: number;    // en secondes
}

export function LandingPage() {
  const currentCycleName = "Cycle par Défaut";

  const [periods] = useState<Period[]>([
    { name: "Travail 1", type: "work", duration: 25 * 60 },
    { name: "Courte Pause", type: "short_break", duration: 5 * 60 },
    { name: "Travail 2", type: "work", duration: 25 * 60 },
    { name: "Longue Pause", type: "long_break", duration: 15 * 60 },
  ]);

  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(0);
  
  // CORRECTION : Utilisation de l'opérateur de repli de coalescence des nuls (??) 
  // pour garantir qu'un objet de type Period valide est TOUJOURS renvoyé à l'IDE et à <Timer />
  const currentPeriod = periods[currentPeriodIndex] ?? periods[0] ?? { name: "Travail", type: "work", duration: 25 * 60 };

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Tache par défaut uno", status: "In Progress", estimated: 1800, actual: 1200 },
    { id: 2, title: "Tache par défaut secondo", status: "Todo", estimated: 1200, actual: 0 },
    { id: 3, title: "Tache par défaut tres", status: "Todo", estimated: 1200, actual: 1199 },
  ]);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const totalSessionTime = periods.reduce((acc, p) => acc + p.duration, 0);
  const getElapsedBeforeCurrent = (index: number) => {
    return periods.slice(0, index).reduce((acc, p) => acc + p.duration, 0);
  };

  const nextPeriod = () => {
    setCurrentPeriodIndex((prevIndex) => (prevIndex + 1) % periods.length);
  };

  const previousPeriod = () => {
    setCurrentPeriodIndex((prevIndex) => (prevIndex - 1 + periods.length) % periods.length);
  };

  const handleTick = () => {
    if (selectedTaskId !== null && currentPeriod.type === "work") {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === selectedTaskId) {
            const updatedActual = task.actual + 1;
            const isCompleted = updatedActual >= task.estimated * 60;
            return {
              ...task,
              actual: updatedActual,
              status: isCompleted ? "Completed" : "In Progress",
            };
          }
          return task;
        })
      );
    }
  };

  const handleAddTask = (title: string, hours: number) => {
    const newTask: Task = {
      id: Date.now(),
      title,
      status: "Todo",
      estimated: hours,
      actual: 0,
    };
    setTasks([...tasks, newTask]);
  };

  const handleEditTask = (id: number, updatedTitle: string, updatedHours: number) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, title: updatedTitle, estimated: updatedHours } : t
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
          const isCurrentlyCompleted = task.status === "Completed";
          return {
            ...task,
            status: isCurrentlyCompleted ? (task.actual > 0 ? "In Progress" : "Todo") : "Completed"
          };
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
      {/* 1. SECTION TIMER */}
      <section>
        <Timer 
          currentPeriod={currentPeriod} 
          onNext={nextPeriod} 
          onPrevious={previousPeriod}
          totalSessionTime={totalSessionTime}
          elapsedBeforeCurrent={getElapsedBeforeCurrent(currentPeriodIndex)}
          onTick={handleTick}
        />
      </section>

      {/* 2. SECTION CONFIGURATION DU CYCLE */}
      <section>
        <Cycle 
          currentCycleName={currentCycleName}
          periods={periods}
          currentPeriodIndex={currentPeriodIndex}
        />
      </section>

      {/* 3. SECTION LISTE DES TÂCHES */}
      <section>
        <Tasks 
          tasks={tasks} 
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteAll={handleDeleteAll}
          onToggleComplete={handleToggleComplete}
        />
      </section>
    </div>
  );
}