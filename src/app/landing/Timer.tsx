import { useState, useEffect } from "react";
import { PeriodType, type Period } from "@/model/Period";
import { Button } from "@/components/ui/button";

interface TimerProps {
  currentPeriod: Period;
  onNext: () => void;
  onPrevious: () => void;
  totalSessionTime: number;
  elapsedBeforeCurrent: number;
  onTick: () => void;
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  [PeriodType.WORK]: "Travail",
  [PeriodType.REST]: "Pause",
};

export function Timer({ currentPeriod, onNext, onPrevious, totalSessionTime, elapsedBeforeCurrent, onTick }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(currentPeriod.time);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    setTimeLeft(currentPeriod.time);
    setIsActive(false);
  }, [currentPeriod]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        onTick();
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onNext();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onNext]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(currentPeriod.time);
  };

  const currentPeriodElapsed = currentPeriod.time - timeLeft;
  const totalElapsed = elapsedBeforeCurrent + currentPeriodElapsed;

  const getHeaderStyle = () => {
    return currentPeriod.typePeriode === PeriodType.WORK
      ? "text-rose-400 bg-rose-400/10"
      : "text-cyan-400 bg-cyan-400/10";
  };

  const displayName = PERIOD_LABELS[currentPeriod.typePeriode] ?? "Période";

  return (
    <div className="bg-slate-800/80 backdrop-blur-md text-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto border border-slate-700/50 text-center">
      <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full transition-colors duration-300 ${getHeaderStyle()}`}>
        Focus Période : {displayName}
      </span>
      
      <div className="text-7xl font-mono font-extrabold tracking-tight my-6 bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(244,63,94,0.2)]">
        {formatTime(timeLeft)}
      </div>
      
      <div className="text-xs text-slate-400 mb-6 space-y-2">
        <p className="flex justify-center items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Session globale : <strong className="text-slate-200 font-mono">{formatTime(totalElapsed)}</strong> / <span className="font-mono">{formatTime(totalSessionTime)}</span>
        </p>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/30">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${totalSessionTime > 0 ? (totalElapsed / totalSessionTime) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* 123 */}
      <div className="grid grid-cols-4 gap-2.5">
        <Button 
          variant="outline"
          size="lg"
          onClick={onPrevious} 
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-transparent text-xs font-medium rounded-xl h-auto py-2.5 px-2"
        >
          Précédent
        </Button>
        <Button 
          variant="outline"
          size="lg"
          onClick={handleReset} 
          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30 text-xs font-medium rounded-xl h-auto py-2.5 px-2"
        >
          Reset
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={() => setIsActive(!isActive)}
          className={`${
            isActive ? "bg-amber-500 hover:bg-amber-400 text-slate-950" : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
          } text-xs font-bold rounded-xl shadow-lg h-auto py-2.5 px-2`}
        >
          {isActive ? "Pause" : "Lancer"}
        </Button>
        <Button 
          variant="outline"
          size="lg"
          onClick={onNext} 
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-transparent text-xs font-medium rounded-xl h-auto py-2.5 px-2"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}