import {UserRepository} from "@/storage/repositories";

export class ConnectivityService {
    // Cache is shared across every repository's ConnectivityService instance so a
    // single auth transition (login/register/logout) invalidates them all at once.
    private static _cachedConnection: boolean | null = null;
    private static _lastCheckTimestamp: number = 0;
    private readonly CACHE_DURATION_MS: number = 60 * 1000 * 15;  // 15 minute

    async canUseApi(): Promise<boolean> {
        return navigator.onLine && await this.hasSession() && await this.isAuthenticated();
    }

    async hasSession(): Promise<boolean> {
        return await UserRepository.getLastSessionMeta() !== undefined;
    }

    async isAuthenticated(): Promise<boolean> {
        if (ConnectivityService._cachedConnection !== null
            && Date.now() - ConnectivityService._lastCheckTimestamp < this.CACHE_DURATION_MS) {
            return ConnectivityService._cachedConnection;
        }

        try {
            const response = await fetch('/api/auth/me');
            ConnectivityService._cachedConnection = response.ok;
            ConnectivityService._lastCheckTimestamp = Date.now();
            return response.ok;
        } catch (e) {
            console.error("Failed to fetch from API", e);
            ConnectivityService._cachedConnection = false;
            ConnectivityService._lastCheckTimestamp = Date.now();
            return false;
        }
    }

    invalidateCache() {
        ConnectivityService.invalidateCache();
    }

    // Call after any auth transition (login/register/logout) so the next
    // canUseApi() re-checks /api/auth/me instead of trusting the stale value.
    static invalidateCache() {
        ConnectivityService._cachedConnection = null;
        ConnectivityService._lastCheckTimestamp = 0;
    }
}
