# SmartDapp

A comprehensive, maintainable Web3 development framework that solves common pitfalls in dApp development.

SmartDapp is a TypeScript library designed to provide a clean, structured approach to Web3 development. Born from real-world experience building decentralized applications, it addresses the common issues that plague dApp development teams - particularly the chaos that ensues when developers lack proper Web3 and API communication patterns.

## Motivation

During the development of decentralized applications, we identified critical patterns that lead to unmaintainable codebases. The core issues were:

- **Misunderstanding of Web3 patterns**: Improper handling of wallet connections, network switching, and contract interactions
- **Poor API communication**: Lack of structured patterns for handling different networks and environments
- **Inconsistent state management**: No clear separation between on-chain and off-chain data
- **Getter abuse**: Developers relying on non-reactive getters instead of proper state management
- **Maintenance challenges**: Code that works but becomes difficult to understand, debug, or extend over time

SmartDapp was created to solve these problems by providing:

- **Event-driven architecture**: Forces developers to use reactive patterns instead of getters
- **Structured Web3 interactions** with proper error handling
- **Network-aware configuration** that scales across environments
- **Type-safe contract interactions** with clear patterns
- **Maintainable architecture** that teams can actually work with
- **Best practices built-in** to prevent common Web3 mistakes

## Key Features

### Event-Driven Architecture
- **No Getters**: Removes all getter methods to prevent non-reactive state access
- **Event-Only Updates**: All state changes are communicated through events
- **Reactive Patterns**: Forces developers to implement proper state management
- **Predictable State**: Clear event flow makes debugging and maintenance easier

### Unified Web3 Interface
- **Wallet Management**: Seamless connection with AppKit integration
- **Network Switching**: Automatic network detection and switching
- **Multi-chain Support**: Configure multiple networks with different contracts
- **Event Subscriptions**: React to wallet and network changes

### Contract Management
- **ABI Organization**: Centralized ABI management with type safety
- **Contract Registry**: Named contracts with network-specific addresses
- **Transaction Handling**: Gas estimation and proper transaction flow
- **Read Operations**: Optimized read calls with provider management

### Smart Storage
- **Network-aware Storage**: Data automatically namespaced by network
- **Metadata Management**: Store and retrieve application-specific data
- **Search Capabilities**: Find stored data by any field
- **Cache Management**: Built-in caching with network-specific keys

### API Integration
- **Environment-aware URLs**: Different API endpoints per network
- **Type-safe Configuration**: Compile-time validation of API structures
- **Flexible Backend Integration**: Support for any backend architecture

## Installation

```bash
TODO:not published on npm yet
```

## Quick Start

### Basic Configuration

```typescript
import { SmartDapp, SmartDappConfig } from 'smartdapp';

const config: SmartDappConfig = {
  appName: "My DApp",
  appDescription: "A decentralized application",
  appUrl: "https://mydapp.com",
  appIcon: "/logo.png",
  
  // Define your ABIs
  abis: {
    "ERC20": [
      // ERC20 ABI here
    ],
    "UniswapV2Router": [
      // Router ABI here
    ]
  },
  
  // Configure networks
  networks: {
    1: { // Ethereum Mainnet
      appKit: {
        id: 1,
        name: "Ethereum",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["https://eth.llamarpc.com"] } },
        blockExplorers: { default: { url: "https://etherscan.io" } }
      },
      customNetworkId: "ethereum-mainnet",
      contracts: {
        "Router": {
          name: "UniswapV2Router",
          address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        }
      },
      metadata: {
        "weth9": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "defaultRefCode": "REF123"
      }
    },
    137: { // Polygon
      appKit: {
        id: 137,
        name: "Polygon",
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        rpcUrls: { default: { http: ["https://polygon.llamarpc.com"] } },
        blockExplorers: { default: { url: "https://polygonscan.com" } }
      },
      customNetworkId: "polygon-mainnet",
      contracts: {
        "Router": {
          name: "UniswapV2Router",
          address: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
        }
      },
      metadata: {
        "weth9": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        "defaultRefCode": "REF456"
      }
    }
  },
  
  // Configure API URLs per network
  apiUrls: {
    1: {
      "markets": { url: "https://markets.mydapp.com" },
      "backend": { url: "https://api.mydapp.com" },
      "analytics": { url: "https://analytics.mydapp.com" }
    },
    137: {
      "markets": { url: "https://markets-polygon.mydapp.com" },
      "backend": { url: "https://api-polygon.mydapp.com" },
      "analytics": { url: "https://analytics-polygon.mydapp.com" }
    }
  }
};

// Initialize SmartDapp
const smartDapp = new SmartDapp(config, false); // false = production mode
```

### Wallet Connection

```typescript
// Subscribe to wallet changes FIRST - this is the only way to get state updates
smartDapp.subscribeToChanges((notification, data) => {
  switch (notification) {
    case "CONNECTED":
      console.log("Wallet connected to:", data.address);
      // Handle connection state in your UI
      break;
    case "DISCONNECTED":
      console.log("Wallet disconnected:", data.reason);
      // Handle disconnection state in your UI
      break;
    case "NETWORK_CHANGED":
      console.log("Network changed to:", data.chainId);
      console.log("API URLs for this network:", data.apiUrls);
      // Handle network change in your UI
      // data.apiUrls contains all configured API endpoints for the new network
      break;
  }
});

// Open wallet connection modal
await smartDapp.openAppKitModal();

// Note: There are NO getters - you must rely on events for state updates
```

### Contract Interactions

```typescript
// Read from contract
const balance = await smartDapp.readCall("Router", "getAmountsOut", [
  "1000000000000000000", // 1 ETH
  ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C"] // WETH -> Token
]);

// Send transaction
const tx = await smartDapp.sendTransaction("Router", "swapExactETHForTokens", [
  "0", // min amount out
  ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C"], // path
  "0x123...", // recipient
  Math.floor(Date.now() / 1000) + 1800 // deadline
], "1000000000000000000"); // 1 ETH value

console.log("Transaction hash:", tx.hash);
```

### Storage and Metadata

```typescript
// Store network-specific data
smartDapp.storeMetadata("storedTokens", [
  {
    address: "0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6
  }
]);

// Find token by any field
const token = await smartDapp.findContentByKeyAndQuery("storedTokens", "USDC");
console.log("Found token:", token);

// Get API URL for current network
const marketsApi = smartDapp.getApiUrl("markets");
console.log("Markets API:", marketsApi);
```

## Event-Driven Philosophy

SmartDapp enforces an event-driven architecture by removing all getter methods. This design decision addresses a critical problem in Web3 development: **developers often rely on non-reactive getters instead of implementing proper state management**.

### Why No Getters?

Traditional Web3 libraries provide getters like `getAddress()` or `getNetworkId()`, but these create several problems:

1. **Non-reactive**: Getters don't automatically update when state changes
2. **Stale data**: Developers forget to re-fetch data after state changes
3. **Poor UX**: UI doesn't update when wallet disconnects or network changes
4. **Debugging nightmare**: Hard to track when and why state becomes inconsistent

### The SmartDapp Solution

Instead of getters, SmartDapp provides:

- **Event subscriptions**: `subscribeToChanges()` is the only way to get state updates
- **Reactive patterns**: Forces developers to implement proper state management
- **Predictable flow**: Clear event flow makes debugging easier
- **Better UX**: UI automatically updates when state changes
- **Network-aware data**: Events include relevant data like API URLs for the current network

### Event Types

```typescript
enum Web3InteropNotification {
  NETWORK_CHANGED = "NETWORK_CHANGED",    // data = { chainId: number, apiUrls: Record<string, SmartDappApiUrl> }
  CONNECTED = "CONNECTED",                // data = { address: string }
  DISCONNECTED = "DISCONNECTED"           // data = { reason?: string }
}
```

### Event Data Structure

```typescript
// NETWORK_CHANGED event data
interface NetworkChangeEventData {
  chainId: number;
  apiUrls: Record<string, SmartDappApiUrl>;  // API URLs for the new network
}

// CONNECTED event data  
interface ConnectedEventData {
  address: string;
}

// DISCONNECTED event data
interface DisconnectedEventData {
  reason?: string;
}
```

## Architecture

SmartDapp follows a service-oriented architecture with clear separation of concerns:

```
SmartDapp
├── Web3InteropService    # Wallet & network management
├── ContractService       # Contract interactions
├── StorageService        # Data persistence
└── LocalStorageAdapter   # Storage implementation
```

### Service Responsibilities

- **Web3InteropService**: Handles wallet connections, network switching, and Web3 provider management
- **ContractService**: Manages contract interactions, ABI handling, and transaction processing
- **StorageService**: Provides network-aware storage with search capabilities
- **LocalStorageAdapter**: Implements storage interface (can be swapped for other storage backends)

## API Reference

### Core Methods

#### Event-Driven State Management
```typescript
// Subscribe to all state changes - this is the ONLY way to get state updates
smartDapp.subscribeToChanges(callback)

// Available events:
// - "CONNECTED": Wallet connected (data = { address: string })
// - "DISCONNECTED": Wallet disconnected (data = { reason?: string })
// - "NETWORK_CHANGED": Network switched (data = { chainId: number, apiUrls: Record<string, SmartDappApiUrl> })
```

#### Wallet & Network Actions
```typescript
// Connection actions
await smartDapp.openAppKitModal()
await smartDapp.closeAppKitModal()

// Network management
await smartDapp.selectNetwork(chainId)

// Configuration access (read-only, not reactive)
smartDapp.getCurrentCustomNetworkId()
smartDapp.getNetworks()
smartDapp.getApiUrl(name)
```

#### Contract Interactions
```typescript
// Read operations
await smartDapp.readCall(contractName, methodName, args?, staticCall?, value?, abiName?)

// Write operations
await smartDapp.sendTransaction(contractName, methodName, args?, value?, abiName?)

// Utility
await smartDapp.encodeFunctionData(contractName, methodName, args?, abiName?)
```

#### Storage & Metadata
```typescript
// Storage
smartDapp.storeMetadata(key, value)
smartDapp.retrieveMetadata(key)
smartDapp.createCacheKey(key, ...params)

// Search
await smartDapp.findContentByKeyAndQuery(key, query)

// API URLs
smartDapp.getApiUrl(name)
```

## Best Practices

### Event-Driven State Management
```typescript
// Good: Subscribe to events and manage state reactively
let currentNetwork: number | null = null;
let currentAddress: string | null = null;
let currentApiUrls: Record<string, SmartDappApiUrl> = {};

smartDapp.subscribeToChanges((notification, data) => {
  switch (notification) {
    case "CONNECTED":
      currentAddress = data.address;
      updateUI();
      break;
    case "NETWORK_CHANGED":
      currentNetwork = data.chainId;
      currentApiUrls = data.apiUrls; // Get API URLs for the new network
      updateUI();
      // Now you can use currentApiUrls.backend.url, currentApiUrls.markets.url, etc.
      break;
    case "DISCONNECTED":
      currentAddress = null;
      currentNetwork = null;
      currentApiUrls = {};
      updateUI();
      break;
  }
});

// Bad: Trying to use getters (they don't exist!)
// const network = smartDapp.getNetworkId(); // This method doesn't exist!
// const address = smartDapp.getAddress(); // This method doesn't exist!
```

### Configuration Management
```typescript
// Good: Centralized configuration
const config = {
  networks: {
    1: { /* mainnet config */ },
    137: { /* polygon config */ }
  },
  apiUrls: {
    1: { backend: { url: "https://api-mainnet.com" } },
    137: { backend: { url: "https://api-polygon.com" } }
  }
};

// Bad: Hardcoded values scattered throughout code
const mainnetApi = "https://api-mainnet.com";
const polygonApi = "https://api-polygon.com";
```

### Error Handling
```typescript
// Good: Proper error handling
try {
  const tx = await smartDapp.sendTransaction("Router", "swapExactETHForTokens", args, value);
  console.log("Transaction successful:", tx.hash);
} catch (error) {
  if (error.message.includes("insufficient funds")) {
    // Handle specific error
  } else {
    // Handle general error
  }
}

// Bad: No error handling
const tx = await smartDapp.sendTransaction("Router", "swapExactETHForTokens", args, value);
```

### Network Awareness
```typescript
// Good: Track network state and API URLs through events
let currentNetwork: number | null = null;
let currentApiUrls: Record<string, SmartDappApiUrl> = {};

smartDapp.subscribeToChanges((notification, data) => {
  if (notification === "NETWORK_CHANGED") {
    currentNetwork = data.chainId;
    currentApiUrls = data.apiUrls;
    handleNetworkChange(currentNetwork, currentApiUrls);
  }
});

function handleNetworkChange(networkId: number, apiUrls: Record<string, SmartDappApiUrl>) {
  if (networkId === 1) {
    // Ethereum mainnet logic
    console.log("Using mainnet API:", apiUrls.backend.url);
  } else if (networkId === 137) {
    // Polygon logic  
    console.log("Using Polygon API:", apiUrls.backend.url);
  }
  
  // Use the correct API URLs for the current network
  fetch(`${apiUrls.backend.url}/user-data`)
    .then(response => response.json())
    .then(data => console.log(data));
}

// Bad: Assuming network or trying to use getters
const apiUrl = "https://api-mainnet.com"; // Always mainnet!
// const network = smartDapp.getNetworkId(); // This method doesn't exist!
```

### Storage Patterns
```typescript
// Good: Use network-aware storage
smartDapp.storeMetadata("userPreferences", {
  theme: "dark",
  language: "en"
});

// Bad: Global storage without network context
localStorage.setItem("userPreferences", JSON.stringify(prefs));
```

## Advanced Usage

### Custom Storage Adapter

```typescript
class CustomStorageAdapter implements StorageAdapter {
  getItem<Storable extends Object>(key: string): Storable | null {
    // Your custom storage logic
    return JSON.parse(localStorage.getItem(key) || 'null');
  }
  
  setItem<Storable extends Object>(key: string, value: Storable): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

const smartDapp = new SmartDapp(config, false, new CustomStorageAdapter());
```

### Developer Mode

```typescript
// Enable testnet networks
const smartDapp = new SmartDapp(config, true); // true = developer mode
```

### Multiple Contract Instances

```typescript
// Use direct addresses with ABI names
const tx = await smartDapp.sendTransaction(
  "0x123...", // Direct address
  "transfer",
  ["0x456...", "1000000"],
  undefined,
  "ERC20" // ABI name
);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/saefstroem/SmartDapp.git
cd SmartDapp
npm install
npm run dev
```

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/saefstroem/SmartDapp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/saefstroem/SmartDapp/discussions)
- **Documentation**: [Full API Docs](https://github.com/saefstroem/SmartDapp/wiki)

---

**SmartDapp** - Event-driven Web3 development that prevents state management nightmares.