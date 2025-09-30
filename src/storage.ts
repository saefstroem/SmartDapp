

export interface StorageAdapter {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
    getItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error("Failed to set item in localStorage:", error);
        }
    }

    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Failed to remove item from localStorage:", error);
        }
    }
}
