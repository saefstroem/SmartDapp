import { BrowserProvider, Eip1193Provider, JsonRpcProvider } from "ethers";
import { AppKit, CaipNetwork, createAppKit, EventsControllerState } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { AppKitNetwork } from "@reown/appkit/networks";
import { JsonRpcSigner } from "ethers";
import { SmartDappContract } from "./contract";
import { SmartDappApiUrl } from "..";


export interface SmartDappNetworkConfiguration {
    appKit: AppKitNetwork;
    customNetworkId: string;
    contracts: Record<any, SmartDappContract>;
    metadata: Record<any, any>;
}

export interface AppkitConfiguration {
    appName: string;
    appDescription: string;
    appUrl: string;
    appIcon: string;
    projectId: string;
}

export enum Web3InteropNotification {
    NETWORK_CHANGED = "NETWORK_CHANGED",
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
}

interface NetworkChangeEventData {
    chainId: Number,
    apiUrls: Record<any, SmartDappApiUrl>
}


interface ConnectedEventData {
    address: string,
}

interface DisconnectedEventData {
    reason?: string
}

export type SmartDappEventData = NetworkChangeEventData | ConnectedEventData | DisconnectedEventData;

export class Web3InteropService {
    /**
     * The appkit instance that manages the web3 connection
     */
    private appKit: AppKit;

    /**
     * Subscribers to web3 interop changes
     */
    private subscribers: Set<(web3InteropNotification: Web3InteropNotification, data?: any) => void> = new Set();

    /**
     * Used to signal whether or not testnet networks should be available for selection
     */
    private developerMode = false;

    /**
     * Current network ID
     */
    public networkId: number | null = null;

    /**
     * apiUrls mapped by network ID
     */
    private apiUrls: Record<number, Record<any, SmartDappApiUrl>>

    constructor(apiUrls: Record<number, Record<any, SmartDappApiUrl>>, networksMap: Record<any, SmartDappNetworkConfiguration>, appkitConfig: AppkitConfiguration, developerMode: boolean = false) {
        this.appKit = createAppKit({
            adapters: [new EthersAdapter()],
            networks: Object.values(networksMap).map(n => n.appKit) as [AppKitNetwork, ...AppKitNetwork[]],
            metadata: {
                name: appkitConfig.appName,
                description: appkitConfig.appDescription,
                url: appkitConfig.appUrl,
                icons: [appkitConfig.appIcon],
            },
            projectId: appkitConfig.projectId,
            features: {
                analytics: false,
                swaps: false,
                onramp: false,
                email: false,
                history: false,
                send: false,
            },
        });
        const networks = this.appKit.getCaipNetworks("eip155");
        if (networks.length == 0) throw new Error("No networks configured in AppKit");
        this.appKit.subscribeEvents(this.handleAppKitEvent)
        this.developerMode = developerMode;
        this.apiUrls = apiUrls;
    }

    private handleAppKitEvent(event: EventsControllerState) {
        switch (event.data.event) {
            case "CONNECT_SUCCESS":
                this.getSigner().then(signer => {
                    this.notifySubscribers(Web3InteropNotification.CONNECTED, {
                        address: signer.address
                    });
                });
                break;
            case "DISCONNECT_SUCCESS":
                this.notifySubscribers(Web3InteropNotification.DISCONNECTED, {
                    reason: "Disconnected"
                });
                break;
            case "SWITCH_NETWORK":
                const isolatedChainId = event.data.properties.network.replace("eip155:", "");
                this.networkId = Number(isolatedChainId)
                this.notifySubscribers(Web3InteropNotification.NETWORK_CHANGED, {
                    chainId: this.networkId,
                    apiUrls: this.apiUrls[this.networkId] || {}
                });
                break;
            case "SELECT_WALLET":
                this.getSigner().then(signer => {
                    this.notifySubscribers(Web3InteropNotification.CONNECTED, {
                        address: signer.address
                    });
                });
                break;
            default:
                break;
        }
    }

    /**
     * Notify all subscribers of a change
     * @param notification The notification type
     * @param data Optional data to send with the notification
     */
    private notifySubscribers(notification: Web3InteropNotification, data: SmartDappEventData) {
        this.subscribers.forEach(callback => {
            try {
                callback(notification, data);
            } catch (err) {
                console.error("Error in subscriber callback", err);
            }
        });
    }

    /**
     * Ensure the wallet is connected to a specific chain ID
     */
    private async changeNetwork(network: CaipNetwork): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const eip155 = this.appKit.getProvider("eip155") as Eip1193Provider | undefined;
            if (!eip155) {
                return reject(new Error("No EIP-155 provider available"));
            }
            const desiredHex = "0x" + network.id.toString(16);
            try {
                // Try to switch first
                await eip155.request?.({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: desiredHex }],
                } as any);
                return resolve();
            } catch (err: any) {
                // 4902: Unrecognized chain → add and switch
                if (err?.code === 4902 || /unrecognized|not added|add ethereum chain/i.test(String(err?.message))) {
                    try {
                        await eip155.request?.({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: desiredHex,
                                chainName: network.name,
                                nativeCurrency: network.nativeCurrency,
                                rpcUrls: network.rpcUrls?.default?.http || [],
                                blockExplorerUrls: network.blockExplorers?.default?.url ? [network.blockExplorers.default.url] : [],
                            }],
                        } as any);

                        await eip155.request?.({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: desiredHex }],
                        } as any);
                        return resolve();
                    } catch (err) {
                        return reject(err);
                    }
                } else {
                    return reject(err);
                }
            }
        });
    }

    /**
     * Subscribe to quick provider changes
     */
    public subscribeToChanges(callback: (web3InteropNotification: Web3InteropNotification) => void) {
        this.subscribers.add(callback);
    }

    /**
     * Retrieve the list of configured networks.
     * @returns The list of available networks, filtered by developer mode
     */
    public getAvailableNetworks(): AppKitNetwork[] {
        const networks = this.appKit.getCaipNetworks("eip155");
        if (this.developerMode) {
            return networks;
        } else {
            return networks.filter(n => !n.testnet);
        }
    }

    /**
     * Select a network by its chain ID, will throw if the network is not available
     * @param chainId The chain ID to select
     * @returns A promise that resolves when the network has been changed.
     */
    public async selectNetwork(chainId: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const networks = this.appKit.getCaipNetworks("eip155");
                const network = networks.find(n => Number(n.id) === chainId);
                if (!network) throw new Error(`Network ${chainId} not found in AppKit configuration`);
                if (!this.developerMode && network.testnet) throw new Error(`Network ${chainId} is a testnet and developer mode is disabled`);
                await this.changeNetwork(network)
                return resolve();
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Retrieve a signer-capable object used to transact and sign messages
     * @returns A signer capable of signing transactions and messages
     */
    public async getSigner(): Promise<JsonRpcSigner> {
        const eip155 = this.appKit.getProvider("eip155") as Eip1193Provider | undefined;
        if (!eip155) {
            throw new Error("No EIP-155 provider available");
        }
        const browserProvider = new BrowserProvider(eip155);
        return browserProvider.getSigner();
    }

    /**
   * Open the AppKit modal for wallet connection
   */
    public async silentOpenAppKitModal() {
        this.appKit.open();
    }

    /**
     * Close the AppKit modal
     */
    public async silentCloseAppKitModal(): Promise<void> {
        this.appKit.close();
    }

}