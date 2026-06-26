---
name: openfort-react-native
description: Setup and configure Openfort in React Native and Expo applications. Use this skill whenever implementing OpenfortProvider, AuthBoundary, embedded wallet hooks, authentication flows, passkey recovery, OAuth with deep linking, wallet creation/recovery, or initial project scaffolding with @openfort/react-native. Trigger on any mention of "React Native Openfort", "Expo Openfort", "@openfort/react-native", "mobile embedded wallet", "useEmbeddedEthereumWallet", "useEmbeddedSolanaWallet", "AuthBoundary", "mobile wallet integration", "passkey recovery mobile", "SIWE React Native", or integrating Openfort into a React Native/Expo app.
---

# Openfort React Native

Complete guide for setting up `@openfort/react-native` in React Native and Expo applications.

> **How to read this document:**
> 1. Always read **COMMON** sections — they apply to every integration.
> 2. Then read **only** the chain section that matches your integration:
>    - **ETHEREUM** — EVM chains (embedded Ethereum wallets)
>    - **SOLANA** — Solana (embedded Solana wallets)
> 3. Skip the other chain section.

---

<!-- ─────────────────────────────────────────── -->
<!-- COMMON — always read                        -->
<!-- ─────────────────────────────────────────── -->

## COMMON: Installation

```bash
npx --yes expo install expo-apple-authentication expo-application expo-crypto expo-secure-store expo-constants
npm install react-native-get-random-values @openfort/react-native
```

### Optional Dependencies

```bash
# For passkey recovery:
npm install react-native-passkeys
# For OAuth:
npx expo install expo-web-browser expo-linking
```

## COMMON: Metro Configuration

Create or update `metro.config.js` with the Jose module shim:

```js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  if (moduleName === "jose") {
    const ctx = {
      ...context,
      unstable_conditionNames: ["browser"],
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolveRequest = resolveRequestWithPackageExports;

module.exports = config;
```

## COMMON: Entry Point

Create `entrypoint.ts` — `react-native-get-random-values` **must** be imported first:

```ts [With expo-router]
// entrypoint.ts
import "react-native-get-random-values";
import "expo-router/entry";
```

```ts [Without expo-router]
// entrypoint.ts
import "react-native-get-random-values";
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

If your app needs additional polyfills (e.g., for `CustomEvent`, `AbortSignal.timeout`), import them after `react-native-get-random-values` but before `expo-router/entry`.

Update `package.json`:

```json
{ "main": "entrypoint.ts" }
```

## COMMON: Environment Variables

Create `app.config.js` to manage keys securely via `expo-constants`:

```js
// app.config.js
export default {
  expo: {
    name: "my-app",
    slug: "my-app",
    version: "1.0.0",
    platforms: ["ios", "android"],
    extra: {
      openfortPublishableKey: process.env.OPENFORT_PUBLISHABLE_KEY || "pk_test_...",
      openfortShieldPublishableKey: process.env.SHIELD_PUBLISHABLE_KEY || "your-shield-publishable-key",
      openfortShieldRecoveryEndpoint: process.env.OPENFORT_SHIELD_RECOVERY_ENDPOINT || "https://your-backend.com/api/protected-create-encryption-session",
      openfortPolicyId: process.env.OPENFORT_POLICY_ID || "pol_...",
      // For passkey recovery:
      // passkeyRpId: process.env.PASSKEY_RP_ID || "yourdomain.com",
      // passkeyRpName: process.env.PASSKEY_RP_NAME || "My App",
    },
  },
};
```

```bash
# .env
OPENFORT_PUBLISHABLE_KEY=pk_test_...
SHIELD_PUBLISHABLE_KEY=your-shield-publishable-key
OPENFORT_SHIELD_RECOVERY_ENDPOINT=https://your-backend.com/api/protected-create-encryption-session
OPENFORT_POLICY_ID=pol_...
```

Access values via `Constants.expoConfig?.extra?.openfortPublishableKey`.

## COMMON: OpenfortProvider Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `publishableKey` | `string` | **Yes** | `pk_test_...` or `pk_live_...` from dashboard |
| `walletConfig` | `EmbeddedWalletConfiguration` | **Yes** (for embedded wallets) | Shield + recovery configuration |
| `supportedChains` | `[Chain, ...Chain[]]` | Recommended | At least one chain; wagmi-compatible chain type |
| `verbose` | `boolean` | Dev only | `true` enables all debug logs |
| `overrides` | `SDKOverrides` | Rarely needed | Override `backendUrl`, `iframeUrl`, `shieldUrl` |
| `thirdPartyAuth` | `ThirdPartyAuthConfiguration` | Only for Firebase/Supabase/OIDC | `{ provider, getAccessToken }` for third-party auth |

The provider automatically renders a hidden WebView for embedded wallet communication. You do **not** need to set up a WebView manually.

## COMMON: walletConfig

```ts
type EmbeddedWalletConfiguration = {
  // ── Always needed ──
  shieldPublishableKey: string                         // Required — from dashboard

  // ── Recovery method (recommended) ──
  recoveryMethod?: 'automatic' | 'password' | 'passkey'  // Default recovery approach

  // ── Recovery endpoint (pick one, mutually exclusive) ──
  createEncryptedSessionEndpoint?: string              // Recommended — backend URL for automatic recovery
  // OR
  // getEncryptionSession?: (params?: { otpCode?: string, userId?: string }) => Promise<string>

  // ── Fee sponsorship (optional) ──
  feeSponsorshipId?: string | Record<number, string>  // Fee sponsorship (single or per-chain)
  accountType?: AccountTypeEnum                        // EOA | SMART_ACCOUNT | DELEGATED_ACCOUNT

  // ── Passkey recovery (if recoveryMethod is 'passkey') ──
  passkeyRpId?: string                                 // Relying Party domain
  passkeyRpName?: string                               // Relying Party display name
  passkeyDisplayName?: string                          // Name in passkey dialog

  // ── Debug ──
  debug?: boolean                                      // Enable Shield/WebView debugging
}
```

## COMMON: supportedChains

Chains use a wagmi-compatible format:

```ts
supportedChains={[
  {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Base Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
  },
  {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] } },
  },
]}
```

## COMMON: Provider Setup

```tsx
// app/_layout.tsx (with expo-router)
import { OpenfortProvider, RecoveryMethod } from "@openfort/react-native";
import Constants from "expo-constants";
import { Stack } from "expo-router";

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
      supportedChains={[
        {
          id: 84532,
          name: 'Base Sepolia',
          nativeCurrency: { name: 'Base Sepolia Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
        },
      ]}
      verbose={__DEV__}
    >
      <Stack />
    </OpenfortProvider>
  );
}
```

No wagmi, no bridge, no QueryClientProvider, no manual WebView — just `OpenfortProvider` at the root.

## COMMON: AuthBoundary Component

Renders different content based on authentication and SDK state:

```tsx
import { AuthBoundary } from '@openfort/react-native'

function App() {
  return (
    <AuthBoundary
      loading={<LoadingScreen />}
      unauthenticated={<LoginScreen />}
      error={(error) => <ErrorScreen error={error} />}
    >
      <MainApp />
    </AuthBoundary>
  )
}
```

| Prop | Type | Description |
|------|------|-------------|
| `loading` | `ReactNode` | While SDK is initializing |
| `unauthenticated` | `ReactNode` | When user is not logged in |
| `error` | `ReactNode \| (error: Error) => ReactNode` | On SDK initialization error |
| `children` | `ReactNode` | When authenticated |

## COMMON: Core Hooks

### useOpenfort

```ts
import { useOpenfort } from '@openfort/react-native'

const { isReady, error } = useOpenfort()
// isReady: boolean    — true when SDK is initialized and user state is loaded
// error: Error | null — initialization error, if any
```

### useUser

```ts
import { useUser } from '@openfort/react-native'

const { user, isAuthenticated, getAccessToken } = useUser()
// user: User | null                        — current user object
// isAuthenticated: boolean                 — whether user is logged in
// getAccessToken: () => Promise<string | null>  — get current access token
```

### useOpenfortClient

```ts
import { useOpenfortClient } from '@openfort/react-native'

const client = useOpenfortClient()
// Returns the raw OpenfortClient instance for advanced use cases
```

### usePasskeyPrfSupport (hook)

```ts
import { usePasskeyPrfSupport } from '@openfort/react-native'

const { isSupported, isLoading } = usePasskeyPrfSupport()
// Checks if PRF extension is supported (Android 14+ / iOS 18+)
```

### isPasskeyPrfSupported (standalone function)

For cases where you need to check passkey support outside of React render (e.g., before showing a recovery UI):

```ts
import { isPasskeyPrfSupported } from '@openfort/react-native'

const supported = await isPasskeyPrfSupported()
// Returns Promise<boolean> — true if device supports passkey PRF
```

## COMMON: Authentication Hooks

All auth hooks accept optional `OpenfortHookOptions`:

```ts
type OpenfortHookOptions<T> = {
  onSuccess?: (data: T) => void
  onError?: (error: OpenfortError) => void
  throwOnError?: boolean
}
```

### useEmailAuth

```ts
import { useEmailAuth } from '@openfort/react-native'

const {
  signInEmail,                // ({ email, password }) => Promise
  signUpEmail,                // ({ email, password, name? }) => Promise
  verifyEmail,                // ({ token }) => Promise
  requestResetPassword,       // ({ email, emailVerificationRedirectTo? }) => Promise
  resetPassword,              // ({ password, token }) => Promise
  isLoading, isError, isSuccess, error,
  requiresEmailVerification,  // boolean
} = useEmailAuth()
```

### useEmailAuthOtp

```ts
import { useEmailAuthOtp } from '@openfort/react-native'

const {
  signInEmailOtp,   // ({ email, otp }) => Promise
  requestEmailOtp,  // ({ email }) => Promise
  isLoading, isError, isSuccess, error,
} = useEmailAuthOtp()
```

### usePhoneAuthOtp

```ts
import { usePhoneAuthOtp } from '@openfort/react-native'

const {
  signInPhoneOtp,   // ({ phone, otp }) => Promise
  requestPhoneOtp,  // ({ phone }) => Promise
  isLoading, isError, isSuccess, error,
} = usePhoneAuthOtp()
```

### useOAuth

```ts
import { useOAuth, OAuthProvider } from '@openfort/react-native'

const {
  initOAuth,   // ({ provider, redirectTo? }) => starts OAuth flow (SDK handles browser)
  linkOauth,   // ({ provider }) => link OAuth provider to existing account
  isLoading, isError, isSuccess, error,
} = useOAuth()

// Usage:
initOAuth({ provider: OAuthProvider.GOOGLE })
```

Supported providers: `OAuthProvider.GOOGLE`, `OAuthProvider.APPLE`, `OAuthProvider.TWITTER`, `OAuthProvider.DISCORD`, `OAuthProvider.FACEBOOK`, `OAuthProvider.EPIC_GAMES`, `OAuthProvider.LINE`

### useWalletAuth (SIWE — Sign-In With Ethereum)

```ts
import { useWalletAuth } from '@openfort/react-native'

const {
  generateSiweMessage,  // ({ wallet, from: { domain, uri } }) => Promise
  signInWithSiwe,        // ({ walletAddress, signature, messageOverride?, disableSignup? }) => Promise
  linkSiwe,              // () => link wallet to existing account
  isLoading, isError, isSuccess, error,
  isAwaitingSignature, isGeneratingMessage, isSubmittingSignature,
} = useWalletAuth()
```

### useGuestAuth

```ts
import { useGuestAuth } from '@openfort/react-native'

const {
  signUpGuest,  // () => create anonymous guest account
  isLoading, isError, isSuccess, error,
} = useGuestAuth()
```

### useSignOut

```ts
import { useSignOut } from '@openfort/react-native'

const {
  signOut,  // () => clear auth state
  isLoading, isError, isSuccess, error,
} = useSignOut()
```

## COMMON: Re-exported Types

```ts
import {
  AccountTypeEnum,
  ChainTypeEnum,
  EmbeddedAccount,
  EmbeddedState,
  RecoveryMethod,
  RecoveryParams,
  AuthResponse,
  User,
  OAuthProvider,
  OpenfortEvents,
  ThirdPartyOAuthProvider,
  OpenfortClient,
  OpenfortError,
  Provider,
  OpenfortConfiguration,
  ShieldConfiguration,
  openfortEvents,
  OpenfortEventMap,
  AuthInitPayload,
  SignedMessagePayload,
} from '@openfort/react-native'

// Standalone utility function
import { isPasskeyPrfSupported } from '@openfort/react-native'
```

## COMMON: Passkey Recovery (iOS vs Android)

Passkey PRF support varies by platform. **Always detect support at runtime** before offering passkey recovery:

```ts
import { Platform } from 'react-native'
import { isPasskeyPrfSupported } from '@openfort/react-native'

// Detect support before showing recovery options
const supported = await isPasskeyPrfSupported()
// iOS 18+ and Android 14+ support PRF — older devices must fall back to password

// Platform-specific biometric labels
const biometricLabel = Platform.OS === 'ios' ? 'Face ID' : 'fingerprint'
```

### Passkey Error Handling

Passkey operations can fail for platform-specific reasons. Classify errors and handle gracefully:

```ts
function classifyError(error: any): 'cancelled' | 'prf_unsupported' | 'network' | 'unknown' {
  const msg = String(error?.message || error || '').toLowerCase()
  if (msg.includes('cancel')) return 'cancelled'
  if (msg.includes('prf')) return 'prf_unsupported'
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('fetch')) return 'network'
  return 'unknown'
}

// Usage in wallet creation/recovery:
try {
  await wallet.create({ recoveryMethod: 'passkey' })
} catch (err) {
  switch (classifyError(err)) {
    case 'cancelled':
      // User cancelled biometric prompt — silently return to passkey step
      break
    case 'prf_unsupported':
      // Device doesn't support PRF — fall back to password recovery
      break
    case 'network':
      // Network error — retry (max 2 retries recommended)
      break
    default:
      // Show error screen with "Use a password instead" fallback
  }
}
```

### Passkey Recovery Flow Pattern

When recovering a wallet with passkey, the wallet's `recoveryMethodDetails.passkeyId` is needed:

```ts
const existingWallet = wallet.wallets[0]

await wallet.setActive({
  address: existingWallet.address,
  recoveryMethod: 'passkey',
  passkeyId: existingWallet.recoveryMethodDetails?.passkeyId,
})
```

### Passkey Configuration Requirements

For passkey recovery, the `walletConfig` must include RP (Relying Party) settings and the associated domains must be configured:

```ts
walletConfig={{
  shieldPublishableKey: '...',
  passkeyRpId: 'yourdomain.com',        // Must match your associated domain
  passkeyRpName: 'My App',
  passkeyDisplayName: 'My App Wallet',
}}
```

You also need `.well-known` files served from your domain for native passkey verification:
- iOS: `/.well-known/apple-app-site-association` (with `webcredentials` service)
- Android: `/.well-known/assetlinks.json` (with `common.get_login_creds` relation)

And in `app.json`, add iOS associated domains:
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["webcredentials:yourdomain.com"]
    }
  }
}
```

## COMMON: Private Key Export

```ts
import { useOpenfortClient } from '@openfort/react-native'

const client = useOpenfortClient()

// Export private key (returns 0x-prefixed hex string)
const privateKey = await client.embeddedWallet.exportPrivateKey()
```

Always gate this behind security confirmation UI (passkey/password verification + user acknowledgment).

## COMMON: OAuth Platform Notes

- **Apple Sign-In**: Only available on iOS. Gate with `Platform.OS === 'ios'`.
- **Google**: Available on all platforms.
- **OAuth callbacks**: The SDK handles the browser flow via `initOAuth()`. For manual callback handling (e.g., custom deep link parsing), you can access the client directly:

```ts
const client = useOpenfortClient()

// In your deep link callback handler:
await client.auth.storeCredentials({ userId, token: accessToken })
```

## COMMON: Third-Party Authentication

For apps using their own auth (Firebase, Supabase, Auth0, etc.), configure `thirdPartyAuth` on the provider:

```tsx
import { ThirdPartyOAuthProvider } from '@openfort/react-native'

<OpenfortProvider
  publishableKey={Constants.expoConfig?.extra?.openfortPublishableKey}
  thirdPartyAuth={{
    provider: ThirdPartyOAuthProvider.Firebase,  // or Supabase, BetterAuth, Oidc, Custom, etc.
    getAccessToken: async () => {
      const token = await auth().currentUser?.getIdToken(false)
      return token ?? null
    },
  }}
  walletConfig={{ /* ... */ }}
/>
```

Supported: `ThirdPartyOAuthProvider.Firebase`, `.Supabase`, `.BetterAuth`, `.Playfab`, `.Accelbyte`, `.Lootlocker`, `.Oidc`, `.Custom`

You must sync auth state between your provider and Openfort — when the external user signs in/out, call `getAccessToken` / `signOut` accordingly.

## COMMON: Debugging

```tsx
<OpenfortProvider
  publishableKey={Constants.expoConfig?.extra?.openfortPublishableKey}
  walletConfig={{
    shieldPublishableKey: Constants.expoConfig?.extra?.openfortShieldPublishableKey,
    debug: true,  // Shield/WebView debugging (allows Safari/Chrome dev tools inspection)
  }}
  verbose={true}  // React SDK debug logs
/>
```

## COMMON: Expo Configuration

```json
{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.myapp"
    },
    "android": {
      "package": "com.myapp"
    },
    "plugins": [
      ["expo-build-properties", {
        "ios": { "deploymentTarget": "16.0" }
      }]
    ]
  }
}
```

## COMMON: Deep Linking for OAuth Callbacks

```json
// app.json
{ "expo": { "scheme": "myapp" } }
```

```ts
import { Linking } from 'react-native'

Linking.addEventListener('url', ({ url }) => {
  if (url.startsWith('myapp://auth/callback')) {
    // Parse token from URL
  }
})
```

---

<!-- ─────────────────────────────────────────── -->
<!-- ETHEREUM — read only for EVM integrations   -->
<!-- Solana developers: skip to "## SOLANA:"     -->
<!-- below — this section ends at the next ---   -->
<!-- ─────────────────────────────────────────── -->

## ETHEREUM: useEmbeddedEthereumWallet

```ts
import { useEmbeddedEthereumWallet } from '@openfort/react-native'

const wallet = useEmbeddedEthereumWallet({
  chainId: 84532,  // Optional — target chain ID
  onCreateSuccess: (wallet) => {},
  onCreateError: (error) => {},
  onSetActiveSuccess: (wallet) => {},
  onSetActiveError: (error) => {},
  onSetRecoverySuccess: () => {},
  onSetRecoveryError: (error) => {},
})
```

### Discriminated Union States

The hook returns a discriminated union based on the `status` field:

```ts
switch (wallet.status) {
  case 'disconnected':
    // wallet.create(options?)
    // wallet.setActive(options)
    // wallet.wallets — list of available wallets
    // wallet.setRecovery({ previousRecovery, newRecovery })
    // wallet.exportPrivateKey()
    break

  case 'fetching-wallets':
    // Loading wallet list...
    break

  case 'creating':
    // Creating new wallet...
    break

  case 'connecting':
  case 'reconnecting':
    // wallet.activeWallet — the wallet being activated
    break

  case 'needs-recovery':
    // wallet.activeWallet — wallet that needs recovery
    // Must call setActive with recovery credentials
    break

  case 'connected':
    // wallet.activeWallet — connected wallet info
    //   .id, .address, .chainId, .chainType (ChainTypeEnum.EVM)
    //   .accountType, .walletIndex, .getProvider()
    // wallet.provider — EIP-1193 compatible provider
    //   .request({ method, params })
    //   .on(event, handler)
    //   .removeListener(event, handler)
    break

  case 'error':
    // wallet.error — error message
    break
}
```

### Wallet Actions

```ts
// Create a new wallet
await wallet.create({
  chainId: 84532,
  recoveryPassword: 'user-password',      // For password recovery
  otpCode: '123456',                      // For automatic recovery with OTP
  accountType: AccountTypeEnum.SMART_ACCOUNT,
  feeSponsorshipId: 'pol_...',             // Optional — override fee sponsorship
  recoveryMethod: 'automatic',
  passkeyId: 'passkey-credential-id',     // For passkey recovery
})

// Activate an existing wallet (with automatic or password recovery)
await wallet.setActive({
  address: '0x...',
  chainId: 84532,
  recoveryMethod: 'password',
  recoveryPassword: 'user-password',
})

// Activate with passkey recovery (use stored passkeyId)
await wallet.setActive({
  address: '0x...',
  chainId: 84532,
  recoveryMethod: 'passkey',
  passkeyId: wallet.wallets[0]?.recoveryMethodDetails?.passkeyId,
})

// Change recovery method (uses RecoveryParams from @openfort/openfort-js)
await wallet.setRecovery({
  previousRecovery: { recoveryMethod: RecoveryMethod.PASSWORD, password: 'old-password' },
  newRecovery: { recoveryMethod: RecoveryMethod.PASSKEY },
})

// Export private key
const key = await wallet.exportPrivateKey()
```

### Using the EIP-1193 Provider

```ts
if (wallet.status === 'connected') {
  const provider = await wallet.activeWallet.getProvider()

  // Sign a message
  const signature = await provider.request({
    method: 'personal_sign',
    params: ['Hello from Openfort', wallet.activeWallet.address],
  })

  // Send transaction
  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from: wallet.activeWallet.address,
      to: '0x...',
      value: '0x...',
    }],
  })

  // Switch chain
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x14a34' }],  // Base Sepolia
  })
}
```

## ETHEREUM: Key Exports

```ts
import { OpenfortProvider, AuthBoundary } from '@openfort/react-native'
import { useEmbeddedEthereumWallet } from '@openfort/react-native'
import { useUser, useEmailAuth, useEmailAuthOtp, usePhoneAuthOtp, useOAuth, useWalletAuth, useGuestAuth, useSignOut } from '@openfort/react-native'
import { useOpenfort, useOpenfortClient, usePasskeyPrfSupport } from '@openfort/react-native'
import { AccountTypeEnum, ChainTypeEnum, EmbeddedState, RecoveryMethod, OAuthProvider } from '@openfort/react-native'
```

---

<!-- ─────────────────────────────────────────── -->
<!-- SOLANA — read only for Solana integrations  -->
<!-- EVM developers: skip this section entirely  -->
<!-- This is the last section in the document    -->
<!-- ─────────────────────────────────────────── -->

## SOLANA: useEmbeddedSolanaWallet

```ts
import { useEmbeddedSolanaWallet } from '@openfort/react-native'

const wallet = useEmbeddedSolanaWallet({
  onCreateSuccess: (wallet) => {},
  onCreateError: (error) => {},
  onSetActiveSuccess: (wallet) => {},
  onSetActiveError: (error) => {},
})
```

### Discriminated Union States

Same status pattern as Ethereum. Solana wallets are always EOA and work across all networks (mainnet-beta, devnet, testnet):

```ts
switch (wallet.status) {
  case 'disconnected':
    // wallet.create(options?)
    // wallet.setActive(options)
    // wallet.wallets
    // wallet.exportPrivateKey()
    break

  case 'connected':
    // wallet.activeWallet — connected wallet info
    //   .id, .address, .chainType (ChainTypeEnum.SVM)
    //   .walletIndex, .getProvider()
    // wallet.provider — Solana wallet adapter style provider
    //   .publicKey
    //   .signMessage(message: string): Promise<string>
    //   .signTransaction(tx): Promise<SignedSolanaTransaction>
    //   .signAllTransactions(txs): Promise<SignedSolanaTransaction[]>
    //   .request({ method, params })
    break

  // Other states: 'fetching-wallets', 'creating', 'connecting',
  // 'reconnecting', 'needs-recovery', 'error'
}
```

### Using the Solana Provider

```ts
if (wallet.status === 'connected') {
  const provider = await wallet.activeWallet.getProvider()

  // Sign a message
  const signature = await provider.signMessage('Hello Solana')

  // Sign a transaction
  const signed = await provider.signTransaction(transaction)

  // Batch sign
  const signedAll = await provider.signAllTransactions([tx1, tx2])
}
```

## SOLANA: Key Exports

```ts
import { OpenfortProvider, AuthBoundary } from '@openfort/react-native'
import { useEmbeddedSolanaWallet } from '@openfort/react-native'
import { useUser, useEmailAuth, useEmailAuthOtp, usePhoneAuthOtp, useOAuth, useGuestAuth, useSignOut } from '@openfort/react-native'
import { useOpenfort, useOpenfortClient } from '@openfort/react-native'
import { ChainTypeEnum, EmbeddedState, RecoveryMethod, OAuthProvider } from '@openfort/react-native'
```

## Full Example App

```tsx
import { Button, ScrollView, Text, View, Alert, StyleSheet } from "react-native";
import {
  OpenfortProvider,
  AuthBoundary,
  RecoveryMethod,
  OAuthProvider,
  useUser,
  useGuestAuth,
  useOAuth,
  useSignOut,
  useEmbeddedEthereumWallet,
} from "@openfort/react-native";
import Constants from "expo-constants";
import { useCallback } from "react";

// ── Login Screen ──

function LoginScreen() {
  const { signUpGuest } = useGuestAuth();
  const { initOAuth } = useOAuth();

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>My App</Text>
      <Button title="Login as Guest" onPress={() => signUpGuest()} />
      <Button title="Login with Google" onPress={() => initOAuth({ provider: OAuthProvider.GOOGLE })} />
    </View>
  );
}

// ── Wallet Screen ──

function WalletScreen() {
  const { user } = useUser();
  const { signOut } = useSignOut();
  const { wallets, create, status } = useEmbeddedEthereumWallet();
  const activeWallet = wallets?.[0];

  const handleSign = useCallback(async () => {
    if (!activeWallet?.address) return;
    const provider = await activeWallet.getProvider();
    const result = await provider.request({
      method: "personal_sign",
      params: ["Hello from Openfort", activeWallet.address],
    });
    Alert.alert("Signed", String(result));
  }, [activeWallet]);

  return (
    <ScrollView contentContainerStyle={styles.centered}>
      <Text>User: {user?.id}</Text>
      <Text>Wallet: {activeWallet?.address ?? "No wallet yet"}</Text>
      <Button
        title={status === "creating" ? "Creating..." : "Create Wallet"}
        disabled={status === "creating" || !!activeWallet?.address}
        onPress={() => create()}
      />
      <Button title="Sign Message" disabled={!activeWallet?.address} onPress={handleSign} />
      <Button title="Logout" onPress={signOut} />
    </ScrollView>
  );
}

// ── Root ──

export default function App() {
  return (
    <OpenfortProvider
      publishableKey={Constants.expoConfig?.extra?.openfortPublishableKey}
      walletConfig={{
        shieldPublishableKey: Constants.expoConfig?.extra?.openfortShieldPublishableKey,
        recoveryMethod: RecoveryMethod.AUTOMATIC,
        feeSponsorshipId: Constants.expoConfig?.extra?.openfortPolicyId,
        createEncryptedSessionEndpoint: Constants.expoConfig?.extra?.openfortShieldRecoveryEndpoint,
      }}
      supportedChains={[
        {
          id: 84532,
          name: "Base Sepolia",
          nativeCurrency: { name: "Base Sepolia Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
        },
      ]}
      verbose={__DEV__}
    >
      <AuthBoundary
        loading={<Text>Loading...</Text>}
        unauthenticated={<LoginScreen />}
      >
        <WalletScreen />
      </AuthBoundary>
    </OpenfortProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold" },
});
```
