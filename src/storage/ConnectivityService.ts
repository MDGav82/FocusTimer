export class ConnectivityService {
  isOnline(): boolean {
    // TODO test for connected user
    return navigator.onLine;
  }
}
