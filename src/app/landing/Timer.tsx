import { useState, useEffect } from "react";

interface Period {
  name: string;
  type: "work" | "short_break" | "long_break";
  duration: number;
}

interface TimerProps {
  currentPeriod: Period;
  onNext: () => void;
  onPrevious: () => void;
  totalSessionTime: number;       // Temps total de toutes les périodes confondues
  elapsedBeforeCurrent: number;   // Temps cumulé des périodes déjà terminées
}

export function Timer({ currentPeriod, onNext, onPrevious, totalSessionTime, elapsedBeforeCurrent }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(currentPeriod.duration);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    setTimeLeft(currentPeriod.duration);
    setIsActive(false);
  }, [currentPeriod]);

  useEffect(() => {
    let interval: Timer | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onNext();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, onNext]);

  // Formateur générique MM:SS ou HH:MM:SS si besoin
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(currentPeriod.duration);
  };

  // --- CALCUL DU TEMPS GLOBAL ÉCOULÉ ---
  // Temps des périodes précédentes + (Durée totale période actuelle - Temps restant période actuelle)
  const currentPeriodElapsed = currentPeriod.duration - timeLeft;
  const totalElapsed = elapsedBeforeCurrent + currentPeriodElapsed;

  const getHeaderStyle = () => {
    switch (currentPeriod.type) {
      case "work": return "text-rose-400 bg-rose-400/10";
      case "short_break": return "text-cyan-400 bg-cyan-400/10";
      case "long_break": return "text-amber-400 bg-amber-400/10";
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md text-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto border border-slate-700/50 text-center">
      <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full transition-colors duration-300 ${getHeaderStyle()}`}>
        Focus Période : {currentPeriod.name}
      </span>
      
      {/* Timer de la période */}
      <div className="text-7xl font-mono font-extrabold tracking-tight my-6 bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(244,63,94,0.2)]">
        {formatTime(timeLeft)}
      </div>
      
      {/* AFFICHAGE DE LA SESSION GLOBALE SOUHAITÉE */}
      <div className="text-xs text-slate-400 mb-6 space-y-2">
        <p className="flex justify-center items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Session globale : <strong className="text-slate-200 font-mono">{formatTime(totalElapsed)}</strong> / <span className="font-mono">{formatTime(totalSessionTime)}</span>
        </p>
        
        {/* Petite barre de progression visuelle pour le style global */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/30">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${(totalElapsed / totalSessionTime) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Boutons de contrôle */}
      <div className="grid grid-cols-4 gap-2.5">
        <button
          onClick={onPrevious}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 px-2 rounded-xl font-medium text-xs transition active:scale-95"
        >
          Précédent
        </button>
        <button
          onClick={handleReset}
          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 py-2.5 px-2 rounded-xl font-medium text-xs transition active:scale-95"
        >
          Reset
        </button>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`${
            isActive ? "bg-amber-500 hover:bg-amber-400 text-slate-950" : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
          } py-2.5 px-2 rounded-xl font-bold text-xs shadow-lg transition active:scale-95`}
        >
          {isActive ? "Pause" : "Lancer"}
        </button>
        <button
          onClick={onNext}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 px-2 rounded-xl font-medium text-xs transition active:scale-95"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}