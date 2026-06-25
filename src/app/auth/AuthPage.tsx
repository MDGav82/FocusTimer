import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRepository } from "@/storage/repositories";
import { apiFetch, parseEntity } from "@/storage/apiFetch.ts";
import { UserSchema } from "@/model/schemas.ts";
import type { User } from "@/model/User.ts";

export function AuthPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/api/auth/register`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });
      
      const user = parseEntity(UserSchema, data) as User;

      await UserRepository.updateSessionMeta({
        lastUserId: user.id,
      });

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pt-4 pb-4">

      {/* Carte d'inscription */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Créer un compte
          </h2>
          <p className="text-sm text-gray-500">
            Rejoignez-nous pour sauvegarder et synchroniser vos cycles de travail Pomodoro.
          </p>
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
            {isLoading ? "Création du compte..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}