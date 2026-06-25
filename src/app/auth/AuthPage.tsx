import { useState, useEffect } from "react";
import { UserRepository, TaskRepository, CycleRepository } from "@/storage/repositories";
import { apiFetch, parseEntity } from "@/storage/apiFetch.ts";
import { UserSchema } from "@/model/schemas.ts";
import type { User } from "@/model/User.ts";
import { LogOut, User as UserIcon } from "lucide-react";
import {syncEngine} from "@/storage/sync";
import {ConnectivityService} from "@/storage/ConnectivityService.ts";

export default function AuthPage() {
  // false = Inscription, true = Connexion
  const [isLogin, setIsLogin] = useState<boolean>(false);
  
  // État stockant l'utilisateur si une session active est détectée
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier l'état de la connexion au montage du composant
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await apiFetch(`/api/auth/me`, { method: "GET" });
        const user = parseEntity(UserSchema, data) as User;
        setCurrentUser(user);
      } catch (err) {
        // L'utilisateur n'est pas connecté, on ignore l'erreur pour afficher le formulaire
        setCurrentUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let data: unknown;
      const sessionMeta = await UserRepository.getLastSessionMeta();
      const localUserId = sessionMeta?.lastUserId!;

      if (isLogin) {
        // --- LOGIQUE DE CONNEXION ---
        data = await apiFetch(`/api/auth/login`, {
          method: "POST",
          body: JSON.stringify({ id: localUserId, email, password }),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // --- LOGIQUE D'INSCRIPTION ---
        const userFull = await UserRepository.getById(localUserId);

        data = await apiFetch(`/api/auth/register`, {
          method: "POST",
          body: JSON.stringify({ 
            email: email,
            password: password,
            id: userFull?.id,
            parameters: userFull?.parameters
          }),
          headers: { "Content-Type": "application/json" },
        });
      }

      ConnectivityService.invalidateCache();

      const user = parseEntity(UserSchema, data) as User;
      await UserRepository.updateSessionMeta({
        lastUserId: user.id,
      });
      await TaskRepository.reassignLocalOwner(localUserId, user.id);
      await CycleRepository.reassignLocalOwner(localUserId, user.id);

      await syncEngine.processQueue();

   
      window.location.assign("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/auth/logout`, { method: "POST" });
      
      ConnectivityService.invalidateCache();

   
      await syncEngine.clearQueue();
      await UserRepository.createLocalUser();

    
      window.location.assign("/");
    } catch (err: any) {
      setError(err.message || "Impossible de se déconnecter.");
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="w-full max-w-md mx-auto pt-16 text-center text-sm text-muted-foreground">
        Chargement de la session...
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8 pt-8 pb-4">
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-[0_10px_40px_rgb(0_0_0/0.08)] ring-1 ring-border space-y-6 relative">
        
        {currentUser ? (
          // --- VUE UTILISATEUR CONNECTÉ ("MON PROFIL") ---
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-full">
                <UserIcon className="size-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Mon Profil
              </h2>
              <p className="text-sm text-muted-foreground">
                Vous êtes actuellement connecté avec l'adresse :
              </p>
              <span className="px-3 py-1 bg-secondary text-foreground text-sm font-mono rounded-lg border border-border">
                {currentUser.email}
              </span>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogOut className="size-4" />
              {isLoading ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        ) : (
          // --- VUE FORMULAIRES (INSCRIPTION / CONNEXION) ---
          <>
            <div className="text-center space-y-2 pt-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {isLogin ? "Connexion" : "Créer un compte"}
              </h2>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Adresse Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abc@de.fr"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm text-foreground placeholder-muted-foreground bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm text-foreground placeholder-muted-foreground bg-background"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-lg transition-colors mt-2 ${
                  isLoading ? "opacity-50 cursor-wait" : ""
                }`}
              >
                {isLoading
                  ? (isLogin ? "Connexion..." : "Création du compte...")
                  : (isLogin ? "Se connecter" : "S'inscrire")
                }
              </button>
            </form>

            <hr className="border-border" />

            {/* Zone de bascule */}
            <div className="text-center text-sm pb-2">
              <span className="text-muted-foreground">
                {isLogin ? "Nouveau sur l'application ?" : "Déjà un compte ?"}
              </span>{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-brand-blue hover:text-brand-blue/80 font-medium underline underline-offset-4 ml-1"
              >
                {isLogin ? "Créer un compte" : "Se connecter"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}