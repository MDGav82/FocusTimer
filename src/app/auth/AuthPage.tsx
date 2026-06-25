import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRepository } from "@/storage/repositories";
import { apiFetch, parseEntity } from "@/storage/apiFetch.ts";
import { UserSchema } from "@/model/schemas.ts";
import type { User } from "@/model/User.ts";

export function AuthPage() {
  const navigate = useNavigate();
  
  // false = Inscription, true = Connexion
  const [isLogin, setIsLogin] = useState<boolean>(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction de test pour inspecter la session courante via /api/auth/me
  const handleTestMe = async () => {
    try {
      const data = await apiFetch(`/api/auth/me`, { method: "GET" });
      alert("Infos de l'utilisateur connecté :\n\n" + JSON.stringify(data, null, 2));
    } catch (err: any) {
      alert("Erreur ou Non connecté (401) :\n\n" + (err.message || JSON.stringify(err)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let data: unknown;

      if (isLogin) {
        // --- LOGIQUE DE CONNEXION ---
        data = await apiFetch(`/api/auth/login`, {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // --- LOGIQUE D'INSCRIPTION ---
        const sessionMeta = await UserRepository.getLastSessionMeta();
        const localUserId = sessionMeta?.lastUserId!;
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
      
      const user = parseEntity(UserSchema, data) as User;
      await UserRepository.updateSessionMeta({
        lastUserId: user.id,
      });

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 pt-8 pb-4">
      {/* Carte d'authentification */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-[0_10px_40px_rgb(0_0_0/0.08)] ring-1 ring-border space-y-6 relative">

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
      </div>
    </div>
  );
}