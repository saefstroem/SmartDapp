import { Web3InteropService } from "./web3Interop";

export interface StorageAdapter {
    getItem<Storable extends Object>(key: string): Storable | null;
    setItem<Storable extends Object>(key: string, value: Storable): void;
    removeItem(key: string): void;
}

export class StorageService {
    private storage: StorageAdapter;
    private web3InteropService: Web3InteropService;

    constructor(storage: StorageAdapter, web3InteropService: Web3InteropService) {
        this.storage = storage;
        this.web3InteropService = web3InteropService;
    }

    /**
     * Store metadata namespaced by network ID
     */
    public storeMetadata<Storable extends Object>(key: string, value: Storable): void {
        const networkId = this.web3InteropService.getNetworkId();
        const storageKey = `metadata_${networkId}_${key}`;
        this.storage.setItem(storageKey, value);
    }

    /**
     * Retrieve metadata namespaced by network ID
     */
    public retrieveMetadata<Storable>(key: string): Storable {
        const networkId = this.web3InteropService.getNetworkId();
        const storageKey = `metadata_${networkId}_${key}`;
        const value = this.storage.getItem(storageKey);
        if (value instanceof Object) {
            return (value as Storable);
        }
        throw Error(`No metadata found for key: ${key}`);
    }

    /**
     * Create a cache key for network-specific data
     */
    public createCacheKey(key: string, ...additionalParams: string[]): string {
        const params = additionalParams.length > 0 ? `:${additionalParams.join(':')}` : '';
        return `${key}${params}`;
    }

    /**
     * Search for an object in stored metadata by checking all its fields against a query
     * @param objects Array of objects to search through
     * @param query The search query (case-insensitive)
     * @returns The first matching object found
     */
    public searchInObjects<T extends Record<string, any>>(
        objects: T,
        query: string
    ): T | null {
        const lowerQuery = query.toLowerCase();

        for (const obj of Object.values(objects)) {
            // Check all fields in the object
            for (const [key, value] of Object.entries(obj)) {
                if (value === null || value === undefined) continue;

                // Handle nested objects (like properties)
                if (typeof value === 'object' && !Array.isArray(value)) {
                    for (const nestedValue of Object.values(value)) {
                        if (
                            nestedValue &&
                            String(nestedValue).toLowerCase() === lowerQuery
                        ) {
                            return obj;
                        }
                    }
                }
                // Handle primitive values
                else if (String(value).toLowerCase() === lowerQuery) {
                    return obj;
                }
            }
        }

        return null;
    }

    /**
     * Find content by searching through stored metadata
     * @param key The metadata key to search in (e.g., "storedTokens", "customContracts")
     * @param query The search query to match against all fields in the objects
     * @returns The first matching object found, or throws if not found
     * 
     * @example
     * // Find a token by address, symbol, or name
     * const token = await storageService.findContentByKeyAndQuery<Token>(
     *   "storedTokens",
     *   "0x123..."
     * );
     * 
     * @example
     * // Find a custom contract by any field
     * const contract = await storageService.findContentByKeyAndQuery<SmartContract>(
     *   "customContracts",
     *   "MyRouter"
     * );
     */
    public async findContentByKeyAndQuery<T extends Record<string, any>>(
        key: string,
        query: string,
    ): Promise<T> {
        // Check stored metadata
        let storedItems: T = {} as T;
        try {
            const metadataJson = await this.retrieveMetadata<T>(key);
            storedItems = metadataJson;

        } catch (error) {
            console.error(`Failed to parse metadata for key "${key}":`, error);
        }

        if (storedItems.length === 0) {
            throw new Error(`No data found for metadata key: ${key}`);
        }

        // Search through all items
        const found = this.searchInObjects(storedItems, query);

        if (!found) {
            throw new Error(`No match found for query "${query}" in metadata key "${key}"`);
        }

        return found;
    }
}