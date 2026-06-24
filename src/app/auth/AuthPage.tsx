import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRepository } from "@/storage/repositories";
import { apiFetch, parseEntity } from "@/storage/apiFetch.ts";
import { UserSchema } from "@/model/schemas.ts";
import type { User } from "@/model/User.ts";

export function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // États du formulaire
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let user: User;

      if (isLogin) {
        // Appel direct à l'API de connexion sans modifier ApiUserRepository
        const data = await apiFetch(`/api/auth/login`, {
          method: "POST",
          body: JSON.stringify({ email, pass: password }),
          headers: { "Content-Type": "application/json" },
        });
        user = parseEntity(UserSchema, data);
      } else {
        // Appel direct à l'API d'inscription
        const data = await apiFetch(`/api/auth/register`, {
          method: "POST",
          body: JSON.stringify({ username, email, pass: password }),
          headers: { "Content-Type": "application/json" },
        });
        user = parseEntity(UserSchema, data);
      }

      // Mise à jour de la session locale avec la méthode déjà disponible sur UserRepository
      await UserRepository.updateSessionMeta({
        lastUserId: user.id,
      });

      // Redirection vers la Landing Page
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pt-4 pb-4">

      {/* Carte d'authentification */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {isLogin ? "Connexion à votre espace" : "Créer un compte"}
          </h2>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="xXx_JeanRemiDu73_xXx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
          )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors mt-2 ${
              isLoading ? "opacity-50 cursor-wait" : ""
            }`}
          >
            {isLoading ? "Vérification..." : isLogin ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <hr className="border-gray-200" />

        {/* Toggle entre Connexion et Inscription */}
        <div className="text-center text-sm">
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