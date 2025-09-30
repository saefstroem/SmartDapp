export interface StorageAdapter {
    getItem<Storable extends Object>(key: string): Storable | null;
    setItem<Storable extends Object>(key: string, value: Storable): void;
    removeItem(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
    getItem<Storable>(key: string): Storable | null {
        const item = localStorage.getItem(key);
        if (item) {
            return JSON.parse(item) as Storable;
        }
        return null;
    }

    setItem<Storable>(key: string, value: Storable): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Failed to set item in localStorage:", error);
        }
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }
}