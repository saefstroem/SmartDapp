import { Contract, JsonRpcProvider } from "ethers";
import { SmartDappNetworkConfiguration, Web3InteropService } from "./web3Interop";

export interface SmartDappContract {
    name: string;
    address?: string;
}

export class ContractService {
    private abis: Record<string, Object[]>;
    private contracts: Record<string, Record<string, SmartDappContract>>; // networkId -> contractName -> contract
    private web3InteropService: Web3InteropService;

    constructor(
        networksMap: Record<any, SmartDappNetworkConfiguration>,
        web3InteropService: Web3InteropService,
        abis: Record<string, Object[]>
    ) {
        this.web3InteropService = web3InteropService;
        // Extract all ABIs from all networks
        this.abis = abis;
        // Extract all contracts from all networks
        this.contracts = {};
        Object.entries(networksMap).forEach(([networkId, network]) => {
            this.contracts[networkId] = network.contracts;
        });
    }


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
    ): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const networkId = this.web3InteropService.getNetworkId();
            let targetAddress: string;
            let abi: Object[];

            if (abiName) {
                // Direct address provided
                targetAddress = contractNameOrAddress;
                abi = this.getAbi(abiName);
            } else {
                // Contract name provided
                const contractInfo = this.getContractInfo(networkId, contractNameOrAddress);
                if (!contractInfo.address) return reject(new Error(`Contract address not configured for ${contractNameOrAddress} on network ${networkId}`));
                targetAddress = contractInfo.address;
                abi = this.getAbi(contractInfo.name);
            }

            const signer = await this.web3InteropService.getSigner();
            const contract = new Contract(targetAddress, abi, signer);

            const parsedValue = value ? BigInt(value) : BigInt(0);
            const gasEstimate = await contract[methodName].estimateGas(...args, value ? { value: parsedValue } : {});
            const tx = await contract[methodName](...args, { value: parsedValue, gasLimit: gasEstimate });

            return resolve(tx);
        });
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
        return new Promise<any>(async (resolve, reject) => {
            const networkId = this.web3InteropService.getNetworkId();
            let targetAddress: string;
            let abi: Object[];

            if (abiName) {
                // Direct address provided
                targetAddress = contractNameOrAddress;
                abi = this.getAbi(abiName);
            } else {
                // Contract name provided
                const contractInfo = this.getContractInfo(networkId, contractNameOrAddress);
                if (!contractInfo.address) return reject(new Error(`Contract address not configured for ${contractNameOrAddress} on network ${networkId}`));
                targetAddress = contractInfo.address;
                abi = this.getAbi(contractInfo.name);
            }

            // For read calls, we need to create a provider from the current network
            const networks = this.web3InteropService.getAvailableNetworks();
            const currentNetwork = networks.find(n => Number(n.id) === networkId);
            if (!currentNetwork) {
                throw new Error(`Network ${networkId} not found`);
            }

            const { JsonRpcProvider } = await import("ethers");
            const readProvider = new JsonRpcProvider(currentNetwork.rpcUrls.default.http[0]);
            const contract = new Contract(targetAddress, abi, readProvider);

            const parsedValue = value ? BigInt(value) : BigInt(0);

            if (staticCall) {
                return resolve(await contract[methodName].staticCall(...args, value ? { value: parsedValue } : {}));
            } else {
                return resolve(await contract[methodName](...args, value ? { value: parsedValue } : {}));
            }
        });
    }

    /**
     * Encode function data for a contract method
     * @param contractNameOrAbiName Name of the contract in configuration or ABI name
     * @param methodName Method name
     * @param args Method arguments
     * @param abiName Optional ABI name (required if using direct ABI name)
     */
    public encodeFunctionData(
        contractNameOrAbiName: string,
        methodName: string,
        args: any[] = [],
        abiName?: string
    ): string {
        let abi: Object[];

        if (abiName) {
            // Direct ABI name provided
            abi = this.getAbi(contractNameOrAbiName);
        } else {
            // Contract name provided, get its ABI
            const networkId = this.web3InteropService.getNetworkId();
            const contractInfo = this.getContractInfo(networkId, contractNameOrAbiName);
            abi = this.getAbi(contractInfo.name);
        }

        const networkId = this.web3InteropService.getNetworkId();

        // For encoding, we need to create a provider from the current network
        const networks = this.web3InteropService.getAvailableNetworks();
        const currentNetwork = networks.find(n => Number(n.id) === networkId);
        if (!currentNetwork) {
            throw new Error(`Network ${networkId} not found`);
        }

        const readProvider = new JsonRpcProvider(currentNetwork.rpcUrls.default.http[0]);
        // Use dummy address since we only need the interface
        const contract = new Contract("0x0000000000000000000000000000000000000000", abi, readProvider);

        return contract.interface.encodeFunctionData(methodName, args);
    }


    private getAbi(abiName: string): Object[] {
        const abi = this.abis[abiName];
        if (!abi) {
            throw new Error(`ABI not found: ${abiName}`);
        }
        return abi;
    }

    private getContractInfo(networkId: number, contractName: string): SmartDappContract {
        const networkContracts = this.contracts[networkId.toString()];
        if (!networkContracts) {
            throw new Error(`No contracts found for network ID: ${networkId}`);
        }

        const contractInfo = networkContracts[contractName];
        if (!contractInfo) {
            throw new Error(`Contract not found: ${contractName}`);
        }

        return contractInfo;
    }
}