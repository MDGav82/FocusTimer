import { useState, useEffect } from "react";
import { PeriodType, type Period } from "@/model/Period";
import { SkipBack, SkipForward, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  currentPeriod: Period;
  onNext: () => void;
  onPrevious: () => void;
  totalSessionTime: number;
  elapsedBeforeCurrent: number;
  onTick: () => void;
}

export function Timer({ currentPeriod, onNext, onPrevious, totalSessionTime, elapsedBeforeCurrent, onTick }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(currentPeriod.time);
  const [isActive, setIsActive] = useState<boolean>(false);

  // Demander la permission des notifications système
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const sendPeriodNotification = (completedPeriod: Period) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const isWork = completedPeriod.typePeriode === PeriodType.WORK;
    
    const title = isWork ? "Beau boulot !" : "Pause terminée !";
    const options = {
      body: isWork 
        ? "C'est l'heure de souffler un peu. Prends une pause !" 
        : "Retour au focus, c'est parti pour une nouvelle session !",
      icon: "/favicon.ico"
    };

    new Notification(title, options);
  };

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
      } else if (timeLeft === 0 && isActive) {
        setIsActive(false);
        
        sendPeriodNotification(currentPeriod);
        
        onNext();
      }
      
      return () => clearInterval(interval);
    }, [isActive, timeLeft, onNext, currentPeriod]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(currentPeriod.time);
  };

  // Gestionnaire du clic Play/Pause incluant la demande de permission
  const handleToggleActive = () => {
    requestNotificationPermission();
    setIsActive((v) => !v);
  };

  const currentPeriodElapsed = currentPeriod.time - timeLeft;
  const totalElapsed = elapsedBeforeCurrent + currentPeriodElapsed;
  const progressPct = totalSessionTime > 0 ? (totalElapsed / totalSessionTime) * 100 : 0;

  const isWork = currentPeriod.typePeriode === PeriodType.WORK;
  const accentBg = isWork ? "bg-brand-orange" : "bg-brand-blue";
  const accentShadow = isWork ? "shadow-brand-orange/30" : "shadow-brand-blue/30";

  return (
    <div className="flex flex-col items-center gap-7 py-4">
      {/* Big countdown */}
      <div className="text-7xl sm:text-8xl font-display font-bold tracking-tight text-foreground tabular-nums leading-none">
        {formatTime(timeLeft)}
      </div>

      {/* Playback controls: previous · play/pause · reset · next */}
      <div className="flex items-center justify-center gap-7">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Période précédente"
          title="Précédent"
          className="text-foreground/80 hover:text-foreground transition-transform hover:scale-110 active:scale-95"
        >
          <SkipBack className="size-7" fill="currentColor" />
        </button>

        <button
          type="button"
          onClick={handleToggleActive}
          aria-label={isActive ? "Mettre en pause" : "Démarrer"}
          title={isActive ? "Pause" : "Démarrer"}
          className={cn(
            "grid place-items-center size-14 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
            accentBg,
            accentShadow
          )}
        >
          {isActive ? (
            <Pause className="size-7" fill="currentColor" />
          ) : (
            <Play className="size-7 translate-x-0.5" fill="currentColor" />
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          aria-label="Réinitialiser le chrono"
          title="Réinitialiser"
          className="text-foreground/80 hover:text-foreground transition-transform hover:scale-110 active:scale-95"
        >
          <RotateCcw className="size-6" />
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Période suivante"
          title="Suivant"
          className="text-foreground/80 hover:text-foreground transition-transform hover:scale-110 active:scale-95"
        >
          <SkipForward className="size-7" fill="currentColor" />
        </button>
      </div>

      {/* Overall session progress (subtle) */}
      <div className="w-full max-w-xs space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300 ease-out", accentBg)}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Session :{" "}
          <span className="font-medium text-foreground tabular-nums">{formatTime(totalElapsed)}</span>{" "}
          / <span className="tabular-nums">{formatTime(totalSessionTime)}</span>
        </p>
      </div>
    </div>
  );
}