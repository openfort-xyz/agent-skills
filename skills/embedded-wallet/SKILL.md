---
name: openfort-embedded-wallet
description: >
  Always use this skill when the user asks about embedded wallets, client-side wallets,
  user-facing wallets, wallet integration in React/React Native/Swift/Unity/JS apps,
  or non-custodial wallets with Openfort. Covers all client SDKs.
  Trigger on: "embedded wallet", "client wallet", "user wallet", "@openfort/react",
  "@openfort/react-native", "OpenfortSwift", "openfort-csharp-unity", "@openfort/openfort-js",
  "OpenfortProvider", "OpenfortButton", "wallet setup", "wallet integration",
  "passkey recovery", "gasless transaction client", "auth modal", or any client-side
  wallet operation with Openfort.
license: MIT
metadata:
  author: Openfort
  version: "1.0.0"
  homepage: https://openfort.io/docs/products/embedded-wallet
  source: https://github.com/openfort-xyz/agent-skills
inputs:
  - name: OPENFORT_PUBLISHABLE_KEY
    description: "Openfort Publishable Key (pk_test_...) — identifies your project (client-safe)"
    required: true
  - name: SHIELD_PUBLISHABLE_KEY
    description: "Shield Publishable Key (your-shield-publishable-key) — for embedded wallet encryption"
    required: true
references:
  - openfort-js.md
  - openfort-react.md
  - openfort-react-native.md
  - openfort-swift.md
  - openfort-unity.md
---

# Openfort Embedded Wallet Setup

> ⚠️ **Test keys vs. live keys — read before shipping.**
> Openfort runs two fully isolated universes: **test mode** (`pk_test_…`, testnet only) and **live mode** (`pk_live_…`, mainnet, real funds). Wallets and their recovery (Shield) configuration in one universe **cannot** be accessed from the other.
> - Wallets created with your **test (dev) publishable key live only on testnet** and must **never** be relied on for real user funds.
> - To go to production, switch to your **live** publishable key (and live Shield keys) — users get **fresh** wallets; test wallets and their recovery shares do not carry over.
> - The publishable key is client-safe; never ship a secret (`sk_…`) key to the browser or app.
> See https://openfort.io/docs/configuration/api-keys.

Embedded wallets provide a seamless experience by abstracting away wallet management. Users interact with your app without needing to understand private keys, seed phrases, or blockchain concepts.

## Choose Your SDK

Openfort provides embedded wallet SDKs for multiple platforms:

| Platform | Package | Best for |
|----------|---------|----------|
| **React / Next.js** | `@openfort/react` | Web apps with pre-built UI modal |
| **React Native / Expo** | `@openfort/react-native` | Mobile apps (iOS + Android) |
| **iOS / Swift** | `OpenfortSwift` | Native iOS apps |
| **Unity / C#** | `openfort-csharp-unity` | Games (Windows, macOS, Android, iOS, WebGL) |
| **Vanilla JS / TS** | `@openfort/openfort-js` | Custom UIs, any JS framework, bare-metal access |

> **Which SDK should I use?**
> - If you're building a **React or Next.js** web app → use `@openfort/react` (includes pre-built auth modal + wallet UI)
> - If you're building a **React Native / Expo** mobile app → use `@openfort/react-native`
> - If you're building a **native iOS** app → use `OpenfortSwift`
> - If you're building a **Unity game** → use `openfort-csharp-unity`
> - If you're building with **Svelte, Vue, Angular, vanilla JS**, or need **custom login flows** → use `@openfort/openfort-js`

For detailed API references per SDK, see the reference files:
- `references/openfort-react.md` — React / Next.js
- `references/openfort-react-native.md` — React Native / Expo
- `references/openfort-swift.md` — iOS / Swift
- `references/openfort-unity.md` — Unity / C#
- `references/openfort-js.md` — Vanilla JS / TS

---

## Quick Start: Scaffold a New Project

The fastest way to get started with a web app is the Openfort CLI:

```bash
npm create openfort@latest
# or
pnpm create openfort@latest
# or
yarn create openfort
```

This scaffolds a new project with all dependencies, configurations, and a working embedded wallet integration. You can select:
- **Framework**: Vite or Next.js
- **Authentication providers**: Google, email, passkeys, etc.
- **Embedded wallet**: Pre-configured with recovery
- **UI theming**: Choose from built-in themes

> The CLI currently scaffolds React web apps. For other platforms, follow the manual setup below.

---

## Prerequisites (All Platforms)

Before integrating any SDK, get your keys from the [Openfort Dashboard](https://dashboard.openfort.io):

1. **Publishable Key** (`pk_test_...`) — identifies your project
2. **Shield Publishable Key** (`your-shield-publishable-key`) — for embedded wallet encryption
3. **Recovery endpoint** (recommended) — a backend URL for automatic wallet recovery
4. **Fee Sponsorship ID** (`pol_...`, optional) — for gasless transactions

---

## React / Next.js — `@openfort/react`

Pre-built auth modal + wallet UI. Supports Ethereum (EVM) and Solana chains.

### Installation

```bash
# Ethereum (EVM) — with wagmi
npm install @openfort/react @tanstack/react-query wagmi viem

# Solana — no wagmi needed
npm install @openfort/react @tanstack/react-query @solana/kit
```

### Environment Variables

```env
VITE_OPENFORT_PUBLISHABLE_KEY=pk_test_...
VITE_SHIELD_PUBLISHABLE_KEY=your-shield-publishable-key
VITE_WALLET_CONNECT_PROJECT_ID=...               # Optional — enables external wallets (EVM only)
VITE_FEE_SPONSORSHIP_ID=pol_...                   # Optional — gasless transactions
VITE_CREATE_ENCRYPTED_SESSION_ENDPOINT=https://... # Backend endpoint for automatic recovery
```

For Next.js, use `NEXT_PUBLIC_` prefix instead of `VITE_`.

### Ethereum Provider Setup

The provider stack is: `QueryClientProvider` → `WagmiProvider` → `OpenfortWagmiBridge` → `OpenfortProvider`.

```tsx
"use client" // Required in Next.js App Router

import { OpenfortProvider, AuthProvider } from '@openfort/react'
import { getDefaultConfig, OpenfortWagmiBridge } from '@openfort/react/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { createConfig, http, WagmiProvider } from 'wagmi'

const config = createConfig(
  getDefaultConfig({
    appName: 'My App',
    chains: [base, baseSepolia],
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    transports: {
      [base.id]: http('https://your-base-rpc.com'),
      [baseSepolia.id]: http(),
    },
  }),
)

const queryClient = new QueryClient()

const walletConfig = {
  shieldPublishableKey: import.meta.env.VITE_SHIELD_PUBLISHABLE_KEY!,
  ethereum: {
    ethereumFeeSponsorshipId: import.meta.env.VITE_FEE_SPONSORSHIP_ID,
  },
  createEncryptedSessionEndpoint: import.meta.env.VITE_CREATE_ENCRYPTED_SESSION_ENDPOINT,
  connectOnLogin: true,
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <OpenfortWagmiBridge>
          <OpenfortProvider
            publishableKey={import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY!}
            walletConfig={walletConfig}
            uiConfig={{
              theme: 'midnight',
              mode: 'dark',
              authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP, AuthProvider.WALLET],
            }}
          >
            {children}
          </OpenfortProvider>
        </OpenfortWagmiBridge>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
```

### Solana Provider Setup

No wagmi, no bridge — just `QueryClientProvider` → `OpenfortProvider`.

```tsx
"use client"

import { OpenfortProvider, AuthProvider, ChainTypeEnum } from '@openfort/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const walletConfig = {
  shieldPublishableKey: import.meta.env.VITE_SHIELD_PUBLISHABLE_KEY!,
  chainType: ChainTypeEnum.SVM,
  solana: { cluster: 'mainnet-beta' },
  createEncryptedSessionEndpoint: import.meta.env.VITE_CREATE_ENCRYPTED_SESSION_ENDPOINT,
  connectOnLogin: true,
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OpenfortProvider
        publishableKey={import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY!}
        walletConfig={walletConfig}
        uiConfig={{
          theme: 'midnight',
          mode: 'dark',
          authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP],
        }}
      >
        {children}
      </OpenfortProvider>
    </QueryClientProvider>
  )
}
```

### Usage — OpenfortButton

`OpenfortButton` adapts to user state automatically:
- **Not logged in** → "Connect" button → opens auth modal
- **Logged in + wallet** → shows wallet address → opens profile/wallet modal
- **Logged in, no wallet** → shows loading while wallet is created

```tsx
import { OpenfortButton } from '@openfort/react'

function App() {
  return <OpenfortButton />
}
```

### Key Hooks (React)

```ts
// Auth
import { useUser, useEmailAuth, useEmailOtpAuth, usePhoneOtpAuth, useOAuth, useGuestAuth, useSignOut } from '@openfort/react'

// Wallet
import { useEthereumEmbeddedWallet } from '@openfort/react/ethereum'
import { useSolanaEmbeddedWallet } from '@openfort/react/solana'

// UI control
import { useUI } from '@openfort/react' // open/close modal programmatically

// wagmi integration
import { useWalletAuth, useChainIsSupported } from '@openfort/react/wagmi'
```

### uiConfig Options

```ts
uiConfig={{
  theme: 'midnight',              // 'auto' | 'web95' | 'retro' | 'soft' | 'midnight' | 'minimal' | 'rounded' | 'nouns'
  mode: 'dark',                   // 'light' | 'dark' | 'auto'
  authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP, AuthProvider.WALLET],
  authProvidersLength: 4,         // How many to show before "More options"
  walletRecovery: {
    allowedMethods: [RecoveryMethod.AUTOMATIC, RecoveryMethod.PASSKEY],
    defaultMethod: RecoveryMethod.AUTOMATIC,
  },
  // termsOfServiceUrl, privacyPolicyUrl, disclaimer, customTheme, logo, etc.
}}
```

---

## React Native / Expo — `@openfort/react-native`

Native mobile SDK. Supports Ethereum and Solana embedded wallets.

### Installation

```bash
npx --yes expo install expo-apple-authentication expo-application expo-crypto expo-secure-store expo-constants
npm install react-native-get-random-values @openfort/react-native

# Optional:
npm install react-native-passkeys          # For passkey recovery
npx expo install expo-web-browser expo-linking  # For OAuth
```

### Entry Point

`react-native-get-random-values` **must** be imported first:

```ts
// entrypoint.ts
import "react-native-get-random-values";
import "expo-router/entry";
```

Update `package.json`: `{ "main": "entrypoint.ts" }`

### Provider Setup

```tsx
import { OpenfortProvider, RecoveryMethod } from "@openfort/react-native";
import Constants from "expo-constants";

export default function RootLayout() {
  return (
    <OpenfortProvider
      publishableKey={Constants.expoConfig?.extra?.openfortPublishableKey}
      walletConfig={{
        shieldPublishableKey: Constants.expoConfig?.extra?.openfortShieldPublishableKey,
        recoveryMethod: RecoveryMethod.AUTOMATIC,
        feeSponsorshipId: Constants.expoConfig?.extra?.openfortPolicyId,
        createEncryptedSessionEndpoint: Constants.expoConfig?.extra?.openfortShieldRecoveryEndpoint,
      }}
      supportedChains={[{
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'Base Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      }]}
      verbose={__DEV__}
    >
      {/* Your app */}
    </OpenfortProvider>
  );
}
```

No wagmi, no bridge, no QueryClientProvider, no manual WebView — just `OpenfortProvider`.

### Key Hooks (React Native)

```ts
import { useEmbeddedEthereumWallet } from '@openfort/react-native'  // EVM
import { useEmbeddedSolanaWallet } from '@openfort/react-native'    // Solana
import { AuthBoundary } from '@openfort/react-native'                // Auth state boundary
import { useUser, useEmailAuth, useEmailAuthOtp, useOAuth, useGuestAuth, useSignOut } from '@openfort/react-native'
```

### AuthBoundary

```tsx
<AuthBoundary
  loading={<LoadingScreen />}
  unauthenticated={<LoginScreen />}
  error={(error) => <ErrorScreen error={error} />}
>
  <MainApp />
</AuthBoundary>
```

---

## iOS / Swift — `OpenfortSwift`

Native Swift SDK for iOS apps. Ethereum-only (EVM).

### Installation

Add via Swift Package Manager: `https://github.com/openfort-xyz/swift-sdk.git`

### Configuration

Add `OFConfig.plist` to your Xcode project:
- `openfortPublishableKey` (required)
- `shieldPublishableKey` (required)
- `shieldEncryptionKey` or `shieldEncryptionEndpoint` (for recovery)

### Initialize

```swift
import OpenfortSwift

// In AppDelegate or App init:
try OFSDK.initialize()

// With third-party auth:
try OFSDK.initialize(thirdPartyAuth: .init(
    provider: .firebase,
    getAccessToken: { try await Auth.auth().currentUser?.getIDToken() ?? "" }
))
```

### Wallet & Auth

```swift
let sdk = OFSDK.shared

// Authenticate
try await sdk.logInWithEmailPassword(email: "user@example.com", password: "pass")
try await sdk.initOAuth(provider: .google, redirectTo: "myapp://callback")

// Configure embedded wallet (auto create or recover)
let account = try await sdk.configureEmbeddedWallet(
    chainId: 80002,
    recoveryMethod: .automatic(encryptionSession: session)
)

// Get EIP-1193 provider
let provider = try sdk.getEthereumProvider(policy: "pol_...")

// Send transaction
let txHash = try await provider.request(method: "eth_sendTransaction", params: [...])
```

---

## Unity / C# — `openfort-csharp-unity`

Game SDK supporting Windows, macOS, Android, iOS, and WebGL.

### Installation

Via UPM git URL: `https://github.com/openfort-xyz/openfort-csharp-unity.git?path=/src/Packages/OpenfortSDK`

Requires [UniTask](https://github.com/Cysharp/UniTask) v2.3.3.

### Initialize & Auth

```csharp
using Openfort;

var sdk = await OpenfortSDK.Init("pk_test_...", "your-shield-publishable-key");

// Authenticate
await sdk.LogInWithEmailPassword("user@example.com", "pass");

// Configure embedded wallet
var account = await sdk.ConfigureEmbeddedWallet(
    chainId: 80002,
    recoveryMethod: RecoveryMethod.Automatic,
    encryptionSession: session
);

// Get provider and send transaction
var provider = sdk.GetEthereumProvider(policy: "pol_...");
var txHash = await provider.Request("eth_sendTransaction", new object[] { txParams });
```

---

## Vanilla JavaScript / TypeScript — `@openfort/openfort-js`

Low-level SDK for custom login flows and bare-metal API access. Works with any framework (Svelte, Vue, Angular, etc.) or no framework at all.

### Installation

```bash
npm install @openfort/openfort-js@latest
```

### Initialize

```typescript
import { Openfort } from '@openfort/openfort-js'

const openfort = new Openfort({
  baseConfiguration: { publishableKey: 'pk_test_...' },
  shieldConfiguration: { shieldPublishableKey: 'your-shield-publishable-key' },
})

await openfort.waitForInitialization()
```

### Auth & Wallet

```typescript
// Authenticate
await openfort.auth.logInWithEmailPassword({ email: 'user@example.com', password: 'pass' })

// Or OAuth
const url = await openfort.auth.initOAuth({ provider: OAuthProvider.GOOGLE, redirectTo: '...' })

// Configure embedded wallet (auto create or recover)
const account = await openfort.embeddedWallet.configure({
  chainId: 80002,
  recoveryParams: {
    recoveryMethod: RecoveryMethod.AUTOMATIC,
    encryptionSession: await fetchEncryptionSession(),
  },
})

// Get EIP-1193 provider
const provider = await openfort.embeddedWallet.getEthereumProvider({ policy: 'pol_...' })

// Send transaction
const txHash = await provider.request({
  method: 'eth_sendTransaction',
  params: [{ from: account.address, to: '0x...', value: '0x...', data: '0x' }],
})
```

### Web3 Library Integration

```typescript
// Viem
import { createWalletClient, custom } from 'viem'
const walletClient = createWalletClient({ chain: sepolia, transport: custom(provider) })

// Ethers.js v6
import { ethers } from 'ethers'
const ethersProvider = new ethers.BrowserProvider(provider)
const signer = await ethersProvider.getSigner()
```

---

## Common Concepts (All Platforms)

### Authentication Providers

All SDKs support the same auth methods:
- **Email + Password** — traditional signup/login
- **Email OTP** — passwordless magic link
- **Phone OTP** — SMS verification
- **OAuth** — Google, Apple, Twitter, Discord, Facebook, LINE, Epic Games
- **Guest** — anonymous, upgradeable later
- **SIWE** — Sign-In With Ethereum (external wallet)
- **Third-party auth** — Firebase, Supabase, Auth0, etc.

### Recovery Methods

Embedded wallets use client-side encryption. Recovery is needed when users switch devices:
- **Automatic** (recommended) — backend encryption session, seamless
- **Password** — user-provided password
- **Passkey** — biometric (Face ID, fingerprint) — iOS 18+ / Android 14+

### Gasless Transactions (Fee Sponsorship)

Set up gas sponsorship in the [dashboard](https://dashboard.openfort.io) under **Policies** and **Fee Sponsorship**, then pass the `pol_...` ID to your SDK config.

### Supported Chains

Openfort embedded wallets support **any EVM chain** and **Solana**. Configure chains in your SDK setup with chain IDs and RPC URLs.

---

## Documentation & Resources

- **Full docs**: https://www.openfort.io/docs/products/embedded-wallet
- **React quickstart**: https://www.openfort.io/docs/products/embedded-wallet/react
- **React Native quickstart**: https://www.openfort.io/docs/products/embedded-wallet/react-native
- **Swift quickstart**: https://www.openfort.io/docs/products/embedded-wallet/swift
- **Unity quickstart**: https://www.openfort.io/docs/products/embedded-wallet/unity/quickstart
- **JS quickstart**: https://www.openfort.io/docs/products/embedded-wallet/javascript/quickstart
- **Dashboard**: https://dashboard.openfort.io
- **GitHub examples**: https://github.com/openfort-xyz
