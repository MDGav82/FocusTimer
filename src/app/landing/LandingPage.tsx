import { useState } from "react";
import { Timer } from "./Timer";
import { Cycle } from "./Cycle";
import { Taches } from "./Tasks";

interface Period {
  name: string;
  type: "work" | "short_break" | "long_break";
  duration: number;
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
  const currentPeriod = periods[currentPeriodIndex];

  // Logique Session Globale
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

  // Mock data pour les tâches (temporaire avant IndexedDB)
  const mockTasks = [
    { id: 1, title: "Concevoir la base de données", status: "In Progress", estimated: 3, actual: 1 },
    { id: 2, title: "Coder le composant Timer", status: "Todo", estimated: 2, actual: 0 },
  ];

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
        <Taches tasks={mockTasks} />
      </section>
    </div>
  );
}