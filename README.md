# SmartDapp

**A comprehensive, maintainable Web3 development framework that solves common pitfalls in dApp development**

SmartDapp is a TypeScript library designed to provide a clean, structured approach to Web3 development. Born from real-world experience building decentralized applications, it addresses the common issues that plague dApp development teams - particularly the chaos that ensues when developers lack proper Web3 and API communication patterns.

## 🎯 Motivation

During the development of decentralized applications, I identified critical patterns that lead to unmaintainable codebases. The core issues were:

- **Misunderstanding of Web3 patterns**: Improper handling of wallet connections, network switching, and contract interactions
- **Poor API communication**: Lack of structured patterns for handling different networks and environments
- **Inconsistent state management**: No clear separation between on-chain and off-chain data
- **Maintenance challenges**: Code that works but becomes difficult to understand, debug, or extend over time

SmartDapp was created to solve these problems by providing:

✅ **Structured Web3 interactions** with proper error handling  
✅ **Network-aware configuration** that scales across environments  
✅ **Type-safe contract interactions** with clear patterns  
✅ **Maintainable architecture** that teams can actually work with  
✅ **Best practices built-in** to prevent common Web3 mistakes  

## 🚀 Key Features

### 🔗 **Unified Web3 Interface**
- **Wallet Management**: Seamless connection with AppKit integration
- **Network Switching**: Automatic network detection and switching
- **Multi-chain Support**: Configure multiple networks with different contracts
- **Event Subscriptions**: React to wallet and network changes

### 📋 **Contract Management**
- **ABI Organization**: Centralized ABI management with type safety
- **Contract Registry**: Named contracts with network-specific addresses
- **Transaction Handling**: Gas estimation and proper transaction flow
- **Read Operations**: Optimized read calls with provider management

### 🗄️ **Smart Storage**
- **Network-aware Storage**: Data automatically namespaced by network
- **Metadata Management**: Store and retrieve application-specific data
- **Search Capabilities**: Find stored data by any field
- **Cache Management**: Built-in caching with network-specific keys

### 🌐 **API Integration**
- **Environment-aware URLs**: Different API endpoints per network
- **Type-safe Configuration**: Compile-time validation of API structures
- **Flexible Backend Integration**: Support for any backend architecture

## 📦 Installation

```bash
npm install smartdapp
```

## 🛠️ Quick Start

### 1. Basic Configuration

```typescript
import { SmartDapp, SmartDappConfig } from 'smartdapp';

const config: SmartDappConfig = {
  projectId: "your-reown-project-id",
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

### 2. Wallet Connection

```typescript
// Open wallet connection modal
await smartDapp.openAppKitModal();

// Get connected address
const address = await smartDapp.getAddress();
console.log("Connected:", address);

// Subscribe to wallet changes
smartDapp.subscribeToChanges((notification) => {
  switch (notification) {
    case "CONNECTED":
      console.log("Wallet connected!");
      break;
    case "DISCONNECTED":
      console.log("Wallet disconnected!");
      break;
    case "NETWORK_CHANGED":
      console.log("Network changed to:", smartDapp.getNetworkId());
      break;
  }
});
```

### 3. Contract Interactions

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

### 4. Storage and Metadata

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

## 🏗️ Architecture

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

## 📚 API Reference

### Core Methods

#### Wallet & Network
```typescript
// Connection
await smartDapp.openAppKitModal()
await smartDapp.closeAppKitModal()
await smartDapp.getAddress()

// Network management
smartDapp.getNetworkId()
smartDapp.getCurrentCustomNetworkId()
await smartDapp.selectNetwork(chainId)
smartDapp.getNetworks()

// Subscriptions
smartDapp.subscribeToChanges(callback)
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

## 🎯 Best Practices

### 1. **Configuration Management**
```typescript
// ✅ Good: Centralized configuration
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

// ❌ Bad: Hardcoded values scattered throughout code
const mainnetApi = "https://api-mainnet.com";
const polygonApi = "https://api-polygon.com";
```

### 2. **Error Handling**
```typescript
// ✅ Good: Proper error handling
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

// ❌ Bad: No error handling
const tx = await smartDapp.sendTransaction("Router", "swapExactETHForTokens", args, value);
```

### 3. **Network Awareness**
```typescript
// ✅ Good: Always check current network
const currentNetwork = smartDapp.getNetworkId();
if (currentNetwork === 1) {
  // Ethereum mainnet logic
} else if (currentNetwork === 137) {
  // Polygon logic
}

// ❌ Bad: Assuming network
const apiUrl = "https://api-mainnet.com"; // Always mainnet!
```

### 4. **Storage Patterns**
```typescript
// ✅ Good: Use network-aware storage
smartDapp.storeMetadata("userPreferences", {
  theme: "dark",
  language: "en"
});

// ❌ Bad: Global storage without network context
localStorage.setItem("userPreferences", JSON.stringify(prefs));
```

## 🔧 Advanced Usage

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

## 🤝 Contributing

Just make a PR!

### Development Setup

```bash
git clone https://github.com/saefstroem/SmartDapp.git
cd SmartDapp
npm install
npm run dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
