import {UserRepository} from "@/storage/repositories";

export class ConnectivityService {
    private _cachedConnection: boolean | null = null;
    private _lastCheckTimestamp: number = 0;
    private readonly CACHE_DURATION_MS: number = 60 * 1000 * 15;  // 15 minute

    async canUseApi(): Promise<boolean> {
        return navigator.onLine && await this.hasSession() && await this.isAuthenticated();
    }

    async hasSession(): Promise<boolean> {
        return await UserRepository.hasConnection();
    }

    async isAuthenticated(): Promise<boolean> {
        if (this._cachedConnection !== null
            && Date.now() - this._lastCheckTimestamp < this.CACHE_DURATION_MS) {
            return this._cachedConnection;
        }

        try {
            const response = await fetch('/api/auth/me');
            this._cachedConnection = response.ok;
            this._lastCheckTimestamp = Date.now();
            return response.ok;
        } catch (e) {
            console.error("Failed to fetch from API", e);
            this._cachedConnection = false;
            this._lastCheckTimestamp = Date.now();
            return false;
        }
    }

    invalidateCache() {
        this._cachedConnection = null;
        this._lastCheckTimestamp = 0;
    }
}
