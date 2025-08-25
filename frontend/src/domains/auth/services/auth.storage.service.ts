import { StorageService } from '../../../infrastructure/storage/storage.service';
import { User, AuthTokens } from './auth.service';

export class AuthStorageService {
  constructor(private readonly storageService: StorageService) {}

  setTokens(tokens: AuthTokens): void {
    this.storageService.setTokens(tokens);
  }

  getTokens(): AuthTokens | null {
    return this.storageService.getTokens();
  }

  getAccessToken(): string | null {
    return this.storageService.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.storageService.getRefreshToken();
  }

  setUser(user: User): void {
    this.storageService.setUser(user);
  }

  getUser(): User | null {
    return this.storageService.getUser();
  }

  clear(): void {
    this.storageService.clear();
  }

  hasValidTokens(): boolean {
    return this.storageService.hasValidTokens();
  }
}
