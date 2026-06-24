import { useEffect, useState } from "react";
import type { User } from "@/model/User";
import { HybridUserRepository } from "@/storage/repositories/user/HybridUserRepository";

const userRepo = new HybridUserRepository();

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = await userRepo.getCurrentUser();
        if (active) setUser(u ?? null);
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { user, loading, error } as const;
}
