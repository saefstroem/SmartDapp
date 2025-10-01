import { SmartDappNetworkConfiguration, SmartDappEvent, Web3InteropService } from "./services/web3Interop";
import { ContractService } from "./services/contract";
import { StorageService } from "./services/storage";
import { LocalStorageAdapter } from "./services/localStorage";
import { AppKitNetwork } from "@reown/appkit/networks";


// Re-export types for external use
export type { SmartDappNetworkConfiguration, SmartDappEvent };

export interface SmartDappApiUrl {
    // The production URL for this API
    url: string;
    // The local port for this API
    port?: number;
}

export interface SmartDappConfig<ApiUrlDescriptor extends Record<any, SmartDappApiUrl> = Record<any, SmartDappApiUrl>> {
    projectId: string;
    appName: string;
    appDescription: string;
    appUrl: string;
    appIcon: string;
    abis: Record<any, Object[]>;
    networks: Record<any, SmartDappNetworkConfiguration>;
    apiUrls: Record<number,ApiUrlDescriptor>;
    storageAdapter?: any;
}

export class SmartDapp {
    private config: SmartDappConfig;

    // Services
    private web3InteropService: Web3InteropService;
    private contractService: ContractService;
    private storageService: StorageService;

    constructor(config: SmartDappConfig, developerMode: boolean = false) {
        this.config = config;


        this.web3InteropService = new Web3InteropService(this.config.apiUrls,this.config.networks, {
            appName: config.appName,
            appDescription: config.appDescription,
            appUrl: config.appUrl,
            appIcon: config.appIcon,
            projectId: config.projectId
        }, developerMode);

        this.contractService = new ContractService(this.config.networks, this.web3InteropService, this.config.abis);

        const storage = config.storageAdapter || new LocalStorageAdapter();
        this.storageService = new StorageService(storage, this.web3InteropService);
    }

    /**
     * Get all configured networks
     */
    public getNetworks(): AppKitNetwork[] {
        return this.web3InteropService.getAvailableNetworks();
    }


    /**
     * Subscribe to changes in the SmartDapp. This is the only way to retrieve updates/information.
     */
    public subscribeToChanges(callback: (event: SmartDappEvent) => void): void {
        this.web3InteropService.subscribeToChanges(callback);
    }

    /**
     * Select a network by chain ID
     */
    public async selectNetwork(chainId: number): Promise<void> {
        return this.web3InteropService.selectNetwork(chainId);
    }

    /**
     * Open the AppKit modal for wallet connection
     */
    public async openAppKitModal(): Promise<void> {
        return this.web3InteropService.silentOpenAppKitModal();
    }

    /**
     * Close the AppKit modal
     */
    public async closeAppKitModal(): Promise<void> {
        return this.web3InteropService.silentCloseAppKitModal();
    }

    /**
     * Store metadata namespaced by network ID
     */
    public storeMetadata<Storable extends Object>(key: string, value: Storable): void {
        return this.storageService.storeMetadata(key, value);
    }

    /**
     * Retrieve metadata namespaced by network ID
     */
    public retrieveMetadata<Storable extends Object>(key: string): Storable | null {
        return this.storageService.retrieveMetadata(key);
    }

    /**
     * Create a cache key for network-specific data
     */
    public createCacheKey(key: string, ...additionalParams: string[]): string {
        return this.storageService.createCacheKey(key, ...additionalParams);
    }

    /**
     * Find content by searching through stored metadata
     * @param key The metadata key to search in (e.g., "storedTokens", "customContracts")
     * @param query The search query to match against all fields in the objects
     * @returns The first matching object found, or throws if not found
     * 
     * @example
     * // Find a token by address, symbol, or name
     * const token = await SmartDapp.findContentByKeyAndQuery<Token>(
     *   "storedTokens",
     *   "0x123..."
     * );
     * 
     * @example
     * // Find a custom contract by any field
     * const contract = await SmartDapp.findContentByKeyAndQuery<SmartContract>(
     *   "customContracts",
     *   "MyRouter"
     * );
     */
    public async findContentByKeyAndQuery<T extends Record<string, any>>(
        key: string,
        query: string,
    ): Promise<T> {
        return this.storageService.findContentByKeyAndQuery<T>(key, query);
    }

    // ============================================================================
    // Contract Interaction Methods (delegated to ContractService)
    // ============================================================================

    /**
     * Send a transaction to a contract
     * @param contractNameOrAddress Name of the contract in configuration or direct address
     * @param methodName Method name to call
     * @param args Method arguments
     * @param value Optional value to send with transaction
     * @param abiName Optional ABI name (required if using direct address)
     */
    public async sendTransaction(
        contractNameOrAddress: string,
        methodName: string,
        args: any[] = [],
        value?: string | bigint,
        abiName?: string
    ): Promise<string> {
        return this.contractService.sendTransaction(contractNameOrAddress, methodName, args, value, abiName);
    }

    /**
     * Perform a read-only call to a contract
     * @param contractNameOrAddress Name of the contract in configuration or direct address
     * @param methodName Method name to call
     * @param args Method arguments
     * @param staticCall Whether to use staticCall
     * @param value Optional value to send
     * @param abiName Optional ABI name (required if using direct address)
     */
    public async readCall(
        contractNameOrAddress: string,
        methodName: string,
        args: any[] = [],
        staticCall: boolean = false,
        value?: string | bigint,
        abiName?: string
    ): Promise<any> {
        return this.contractService.readCall(contractNameOrAddress, methodName, args, staticCall, value, abiName);
    }

    /**
     * Encode function data for a contract method
     * @param contractNameOrAbiName Name of the contract in configuration or ABI name
     * @param methodName Method name
     * @param args Method arguments
     * @param abiName Optional ABI name (required if using direct ABI name)
     */
    public async encodeFunctionData(
        contractNameOrAbiName: string,
        methodName: string,
        args: any[] = [],
        abiName?: string
    ): Promise<string> {
        return this.contractService.encodeFunctionData(contractNameOrAbiName, methodName, args, abiName);
    }

}

// ============================================================================
// Example Usage
// ============================================================================

/*
// Define your API URLs type
interface MyApiUrls {
  markets: string;
  backend: string;
  analytics: string;
}

// Example configuration for a DEX with typed API URLs
const config: SmartDappConfig<MyApiUrls> = {
  projectId: "your-project-id",
  appName: "My DEX",
  appDescription: "Decentralized Exchange",
  appUrl: "https://mydex.com",
  appIcon: "/logo.png",
  networks: [
    {
      appKit: { ... },
      backendNetworkId: "mainnet",
      contracts: {
        "Router": {
          name: "Router",
          address: "0x123...",
          abiName: "UniswapV2Router"
        }
      },
      abis: {
        "UniswapV2Router": [...],
        "ERC20": [...]
      },
      metadata: {
        "weth9": "0x789...",
        "defaultRefCode": "REF123"
      }
    }
  ],
  apiUrlKeys: ["markets", "backend", "analytics"],
  getApiUrls: (chainId, isTestnet): MyApiUrls => ({
    markets: `https://markets${isTestnet ? "-testnet" : ""}.mydex.com`,
    backend: `https://backend${isTestnet ? "-testnet" : ""}.mydex.com`,
    analytics: `https://analytics${isTestnet ? "-testnet" : ""}.mydex.com`,
  })
};

// Initialize SmartDapp with typed API URLs
const SmartDapp = new SmartDapp<MyApiUrls>(config);
await SmartDapp.initialize();

// Now getApiUrls() returns MyApiUrls type with full type safety
const apiUrls = await SmartDapp.getApiUrls();
// apiUrls.markets is typed as string
// apiUrls.backend is typed as string  
// apiUrls.analytics is typed as string
// TypeScript will catch any typos or missing properties

// Synchronous version also returns the typed API URLs
const apiUrlsSync = SmartDapp.getApiUrlsSync();
// Same type safety as above

// Find a token by any field (address, symbol, name, or properties)
const token = await SmartDapp.findContentByKeyAndQuery<Token>(
  "storedTokens",
  "USDC" // Will match symbol
);

const tokenByAddress = await SmartDapp.findContentByKeyAndQuery<Token>(
  "storedTokens", 
  "0xABC..." // Will match address
);

// Store custom data
await SmartDapp.storeMetadata("customContracts", JSON.stringify([
  { name: "MyContract", address: "0x456...", abiName: "Custom" }
]));

// Find custom contract
const contract = await SmartDapp.findContentByKeyAndQuery<SmartContract>(
  "customContracts",
  "MyContract"
);

// You can also use individual services directly if needed
import { NetworkService, WalletService, ContractService, StorageService } from './services';

// Access services through SmartDapp (they're private, but you can extend SmartDapp)
// Or create your own instances if you need more control
*/