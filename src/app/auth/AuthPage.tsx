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
    <div className="w-full max-w-2xl mx-auto space-y-8 pt-4 pb-4">
      {/* Carte d'authentification blanche */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 relative">

        <div className="text-center space-y-2 pt-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {isLogin ? "Connexion" : "Créer un compte"}
          </h2>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abc@de.fr"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors mt-2 ${
              isLoading ? "opacity-50 cursor-wait" : ""
            }`}
          >
            {isLoading 
              ? (isLogin ? "Connexion..." : "Création du compte...") 
              : (isLogin ? "Se connecter" : "S'inscrire")
            }
          </button>
        </form>

        <hr className="border-gray-200" />

        {/* Zone de bascule */}
        <div className="text-center text-sm pb-2">
          <span className="text-gray-600">
            {isLogin ? "Nouveau sur l'application ?" : "Déjà un compte ?"}
          </span>{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-red-500 hover:text-red-600 font-medium underline underline-offset-4 ml-1"
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}