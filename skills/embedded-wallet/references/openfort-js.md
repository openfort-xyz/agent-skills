---
name: openfort-js
description: Setup and configure Openfort in vanilla JavaScript/TypeScript applications. Use this skill whenever implementing the Openfort class, embedded wallet configuration, authentication flows, EIP-1193 provider, wallet recovery, OAuth, SIWE, passkey recovery, or initial project scaffolding with @openfort/openfort-js. Trigger on any mention of "Openfort JS", "openfort-js", "@openfort/openfort-js", "vanilla JS Openfort", "Openfort TypeScript", "Openfort class", "embeddedWallet", "getEthereumProvider", "signMessage JS", or integrating Openfort into a JS/TS app without React.
---

# Openfort JavaScript SDK

Complete guide for `@openfort/openfort-js` — the low-level SDK for custom login flows and bare-metal API access. For pre-built UI components, use `@openfort/react` instead.

Requires Node v20+ and TypeScript v5+.

## Installation

```bash
npm install @openfort/openfort-js@latest
```

## Initialization

```typescript
import { Openfort } from '@openfort/openfort-js'

const openfort = new Openfort({
  baseConfiguration: {
    publishableKey: 'pk_test_...',
  },
  shieldConfiguration: {
    shieldPublishableKey: 'your-shield-publishable-key',
    // For passkey recovery:
    // passkeyRpId: 'yourdomain.com',
    // passkeyRpName: 'My App',
    // passkeyDisplayName: 'My Wallet',
  },
  // For third-party auth:
  // thirdPartyAuth: {
  //   provider: ThirdPartyAuthProvider.FIREBASE,
  //   getAccessToken: async () => token,
  // },
  // debug: false,
})

await openfort.waitForInitialization()
```

### Configuration Types

```typescript
type OpenfortSDKConfiguration = {
  baseConfiguration: {
    publishableKey: string
    nativeAppIdentifier?: string
  }
  shieldConfiguration?: {
    shieldPublishableKey: string
    debug?: boolean
    passkeyRpId?: string
    passkeyRpName?: string
    passkeyDisplayName?: string
  }
  overrides?: {
    backendUrl?: string
    iframeUrl?: string
    shieldUrl?: string
    storage?: IStorage
    crypto?: { digest?: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer> }
    passkeyHandler?: IPasskeyHandler
  }
  thirdPartyAuth?: {
    provider: ThirdPartyOAuthProvider
    getAccessToken: () => Promise<string | null>
  }
  debug?: boolean
}
```

## SDK Structure

After initialization, the SDK exposes three API namespaces:

```typescript
openfort.auth           // Authentication methods
openfort.embeddedWallet // Wallet management, signing, provider
openfort.user           // User profile
openfort.proxy          // Transaction proxy
```

## Authentication

### Email & Password

```typescript
// Sign up
const response = await openfort.auth.signUpWithEmailPassword({
  email: 'user@example.com',
  password: 'password123',
  name: 'John',              // Optional
  callbackURL: 'https://...' // Optional — email verification redirect
})

// Log in
const response = await openfort.auth.logInWithEmailPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Email verification
await openfort.auth.requestEmailVerification({ email: 'user@example.com', redirectUrl: 'https://...' })
await openfort.auth.verifyEmail({ token: 'verification-token', callbackURL: 'https://...' })

// OTP-based email verification
await openfort.auth.verifyEmailOtp({ email: 'user@example.com', otp: '123456' })
```

### Email OTP (Passwordless)

```typescript
await openfort.auth.requestEmailOtp({ email: 'user@example.com' })
const response = await openfort.auth.logInWithEmailOtp({ email: 'user@example.com', otp: '123456' })
```

### Phone OTP

```typescript
await openfort.auth.requestPhoneOtp({ phoneNumber: '+1234567890' })
const response = await openfort.auth.logInWithPhoneOtp({ phoneNumber: '+1234567890', otp: '123456' })

// Link phone to existing account
await openfort.auth.linkPhoneOtp({ phoneNumber: '+1234567890', otp: '123456' })
```

### OAuth (Social Login)

```typescript
import { OAuthProvider } from '@openfort/openfort-js'

// 1. Get authorization URL
const url = await openfort.auth.initOAuth({
  provider: OAuthProvider.GOOGLE,
  redirectTo: 'https://your-app.com/callback',
})

// 2. Redirect user to URL
window.location.href = url

// 3. Handle callback — extract token and userId from URL params
const params = new URLSearchParams(window.location.search)
await openfort.auth.storeCredentials({
  token: params.get('access_token')!,
  userId: params.get('player_id')!,
})
```

Providers: `OAuthProvider.GOOGLE`, `.APPLE`, `.TWITTER`, `.DISCORD`, `.FACEBOOK`, `.LINE`, `.EPIC_GAMES`

### Guest

```typescript
const response = await openfort.auth.signUpGuest()
```

Guest accounts can be upgraded later via `addEmail()`.

### SIWE (External Wallet)

```typescript
// 1. Initialize SIWE
const { address, nonce } = await openfort.auth.initSiwe({ address: walletAddress })

// 2. Sign message with external wallet
const signature = await externalWallet.signMessage(message)

// 3. Authenticate
const response = await openfort.auth.loginWithSiwe({
  signature,
  message,
  walletClientType: 'MetaMask',
  connectorType: 'metaMask',
  address: walletAddress,
})
```

### Third-Party Auth (Firebase, Supabase, etc.)

```typescript
import { Openfort, ThirdPartyOAuthProvider } from '@openfort/openfort-js'

const openfort = new Openfort({
  baseConfiguration: { publishableKey: 'pk_test_...' },
  shieldConfiguration: { shieldPublishableKey: 'your-shield-publishable-key' },
  thirdPartyAuth: {
    provider: ThirdPartyOAuthProvider.FIREBASE,
    getAccessToken: async () => {
      return await firebase.auth().currentUser?.getIdToken() ?? null
    },
  },
})
```

Providers: `ThirdPartyOAuthProvider.FIREBASE`, `.SUPABASE`, `.BETTER_AUTH`, `.PLAYFAB`, `.ACCELBYTE`, `.LOOTLOCKER`, `.OIDC`, `.CUSTOM`

### Login with ID Token

```typescript
const response = await openfort.auth.logInWithIdToken({
  provider: OAuthProvider.GOOGLE,
  token: idToken,
})
```

### Account Linking

```typescript
// Link email
await openfort.auth.addEmail({ email: 'user@example.com', callbackURL: 'https://your-app.com/verify' })

// Link OAuth
const url = await openfort.auth.initLinkOAuth({ provider: OAuthProvider.GOOGLE, redirectTo: '...' })

// Unlink OAuth
await openfort.auth.unlinkOAuth({ provider: OAuthProvider.GOOGLE })

// Link wallet (SIWE)
const siwe = await openfort.auth.initLinkSiwe({ address: '0x...' })
await openfort.auth.linkWithSiwe({ signature, message, walletClientType: '...', connectorType: '...', address: '0x...', chainId: 1 })

// Unlink wallet
await openfort.auth.unlinkWallet({ address: '0x...', chainId: 1 })
```

### Session Management

```typescript
// Get access token
const token = await openfort.getAccessToken()

// Validate and refresh
await openfort.validateAndRefreshToken(forceRefresh?: boolean)

// Get user
const user = await openfort.user.get()
// user.id, user.email, user.name, user.linkedAccounts, etc.

// Log out
await openfort.auth.logout()
```

### Password Reset

```typescript
await openfort.auth.requestResetPassword({ email: 'user@example.com', redirectUrl: 'https://...' })
await openfort.auth.resetPassword({ password: 'newPassword', token: 'reset-token' })
```

## Embedded Wallet

### State Management

```typescript
import { EmbeddedState } from '@openfort/openfort-js'

// One-time check
const state = await openfort.embeddedWallet.getEmbeddedState()

// Reactive watching
const unsubscribe = openfort.embeddedWallet.watchEmbeddedState({
  onChange: (state) => { /* handle state */ },
  onError: (error) => { /* handle error */ },
  pollingInterval: 1000,
})

// States:
// EmbeddedState.NONE (0)
// EmbeddedState.UNAUTHENTICATED (1)
// EmbeddedState.EMBEDDED_SIGNER_NOT_CONFIGURED (2)
// EmbeddedState.CREATING_ACCOUNT (3)
// EmbeddedState.READY (4)
```

### Wallet Configuration (Recovery)

`configure()` auto-detects whether to create or recover:

```typescript
import { RecoveryMethod } from '@openfort/openfort-js'

// Automatic recovery (requires backend encryption session)
const account = await openfort.embeddedWallet.configure({
  chainId: 80002,
  recoveryParams: {
    recoveryMethod: RecoveryMethod.AUTOMATIC,
    encryptionSession: await fetchEncryptionSession(),
  },
})

// Password recovery
const account = await openfort.embeddedWallet.configure({
  chainId: 80002,
  recoveryParams: {
    recoveryMethod: RecoveryMethod.PASSWORD,
    password: 'user-password',
  },
})

// Passkey recovery
const account = await openfort.embeddedWallet.configure({
  chainId: 80002,
  recoveryParams: {
    recoveryMethod: RecoveryMethod.PASSKEY,
    passkeyInfo: { passkeyId: 'credential-id' }, // Optional for creation
  },
})
```

### Configure Parameters

```typescript
configure({
  chainId?: number,
  recoveryParams: RecoveryParams,  // Required
  chainType?: ChainTypeEnum,      // 'EVM' | 'SVM'
  accountType?: AccountTypeEnum,   // 'Externally Owned Account' | 'Smart Account' | 'Delegated Account'
})
```

### Wallet Operations

```typescript
// Create new wallet (always creates)
const account = await openfort.embeddedWallet.create({
  accountType: AccountTypeEnum.SMART_ACCOUNT,
  chainType: ChainTypeEnum.EVM,
  chainId: 80002,         // Optional
  recoveryParams,
})

// Recover specific wallet
const account = await openfort.embeddedWallet.recover({ account: 'account-id', recoveryParams })

// Get current configured wallet
const account = await openfort.embeddedWallet.get()

// List wallets
const wallets = await openfort.embeddedWallet.list({
  chainType: ChainTypeEnum.EVM, // Optional
  accountType: AccountTypeEnum.SMART_ACCOUNT, // Optional
  chainId: 80002, // Optional
  limit: 10,      // Optional
  skip: 0,        // Optional
})

// Change recovery method
await openfort.embeddedWallet.setRecoveryMethod(
  { recoveryMethod: RecoveryMethod.PASSWORD, password: 'old' },
  { recoveryMethod: RecoveryMethod.PASSKEY }
)

// Export private key
const privateKey = await openfort.embeddedWallet.exportPrivateKey()
```

### Returns: EmbeddedAccount

```typescript
interface EmbeddedAccount {
  id: string
  chainType: ChainTypeEnum       // 'EVM' | 'SVM'
  address: string
  accountType: AccountTypeEnum
  recoveryMethod?: RecoveryMethod // 'automatic' | 'password' | 'passkey'
  recoveryMethodDetails?: RecoveryMethodDetails
  chainId?: number
  createdAt?: number
  implementationType?: string
  factoryAddress?: string
  implementationAddress?: string
  salt?: string
}
```

## Ethereum Provider (EIP-1193)

```typescript
const provider = await openfort.embeddedWallet.getEthereumProvider({
  feeSponsorship: 'pol_...',             // Gas sponsorship policy ID
  chains: { 1: 'https://eth.rpc.url' }, // Multi-chain RPC URLs
  providerInfo: {                        // EIP-6963 provider info
    icon: 'data:image/svg+xml,...',
    name: 'My App',
    rdns: 'com.myapp',
  },
  announceProvider: true,                // EIP-6963 announcement
})
```

### Supported JSON-RPC Methods

```typescript
// Get accounts
const accounts = await provider.request({ method: 'eth_accounts' })

// Get chain ID
const chainId = await provider.request({ method: 'eth_chainId' })

// Sign message (EIP-191)
const sig = await provider.request({
  method: 'personal_sign',
  params: [message, address],
})

// Sign typed data (EIP-712)
const sig = await provider.request({
  method: 'eth_signTypedData_v4',
  params: [address, JSON.stringify({ domain, types, primaryType, message })],
})

// Send transaction
const txHash = await provider.request({
  method: 'eth_sendTransaction',
  params: [{ from, to, value, data }],
})

// Batch transactions (EIP-5792)
const id = await provider.request({
  method: 'wallet_sendCalls',
  params: [{ calls: [{ to, value, data }, ...] }],
})

// Switch chain
await provider.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xaa36a7' }],
})

// Provider events
provider.on('accountsChanged', (accounts) => {})
provider.on('chainChanged', (chainId) => {})
provider.on('connect', (info) => {})
provider.on('disconnect', (error) => {})
```

## Sign Message (Direct)

```typescript
const signature = await openfort.embeddedWallet.signMessage('Hello World!', {
  hashMessage: false,     // Optional
  arrayifyMessage: false, // Optional
})
```

## Sign Typed Data (Direct)

```typescript
const signature = await openfort.embeddedWallet.signTypedData(domain, types, message)
```

## Transaction Intent Signing

For server-originated transactions:

```typescript
const response = await openfort.proxy.sendSignatureTransactionIntentRequest(
  'ti_...',         // transactionIntentId
  signableHash,     // from server response
  signature,        // optional, auto-signed if null
  false,            // optimistic
)
```

## Web3 Library Integration

### Ethers.js v6

```typescript
import { ethers } from 'ethers'

const ethersProvider = new ethers.BrowserProvider(provider)
const signer = await ethersProvider.getSigner()
```

### Viem

```typescript
import { createWalletClient, custom } from 'viem'
import { sepolia } from 'viem/chains'

const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom(provider),
})
```

## Events

```typescript
import { openfortEvents, OpenfortEvents } from '@openfort/openfort-js'

// Auth events
openfortEvents.on(OpenfortEvents.ON_AUTH_INIT, (payload) => {})     // Auth process begins
openfortEvents.on(OpenfortEvents.ON_AUTH_SUCCESS, (authResponse) => {})
openfortEvents.on(OpenfortEvents.ON_AUTH_FAILURE, (error) => {})
openfortEvents.on(OpenfortEvents.ON_LOGOUT, () => {})
openfortEvents.on(OpenfortEvents.ON_SWITCH_ACCOUNT, (accountId) => {})

// OTP events
openfortEvents.on(OpenfortEvents.ON_OTP_REQUEST, (payload) => {})
openfortEvents.on(OpenfortEvents.ON_OTP_FAILURE, (error) => {})

// Wallet events
openfortEvents.on(OpenfortEvents.ON_EMBEDDED_WALLET_CREATED, (account) => {})
openfortEvents.on(OpenfortEvents.ON_EMBEDDED_WALLET_RECOVERED, (account) => {})
openfortEvents.on(OpenfortEvents.ON_SIGNED_MESSAGE, (payload) => {})

// Cleanup
openfortEvents.off(OpenfortEvents.ON_AUTH_SUCCESS, handler)
openfortEvents.removeAllListeners(OpenfortEvents.ON_AUTH_SUCCESS)
```

## Error Handling

```typescript
import { OpenfortError, AuthenticationError, RecoveryError } from '@openfort/openfort-js'

try {
  await openfort.auth.logInWithEmailPassword({ email, password })
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Auth failed:', error.error_description, error.statusCode)
  } else if (error instanceof RecoveryError) {
    console.error('Recovery failed:', error.recoveryMethod)
  } else if (error instanceof OpenfortError) {
    console.error('Openfort error:', error.error, error.error_description)
  }
}
```

### Error Classes

`OpenfortError` (base), `AuthenticationError`, `AuthorizationError`, `ConfigurationError`, `OAuthError`, `OTPError`, `RecoveryError`, `RequestError`, `SessionError`, `SignerError`, `UserError`

## Key Types & Enums

```typescript
import {
  // Main class
  Openfort,

  // Enums
  OAuthProvider,           // GOOGLE, APPLE, TWITTER, DISCORD, FACEBOOK, LINE, EPIC_GAMES
  ThirdPartyOAuthProvider, // FIREBASE, SUPABASE, BETTER_AUTH, PLAYFAB, ACCELBYTE, LOOTLOCKER, OIDC, CUSTOM
  ChainTypeEnum,           // EVM, SVM
  AccountTypeEnum,         // EOA, SMART_ACCOUNT, DELEGATED_ACCOUNT
  EmbeddedState,           // NONE, UNAUTHENTICATED, EMBEDDED_SIGNER_NOT_CONFIGURED, CREATING_ACCOUNT, READY
  RecoveryMethod,          // AUTOMATIC, PASSWORD, PASSKEY
  OpenfortEvents,          // ON_AUTH_INIT, ON_AUTH_SUCCESS, ON_AUTH_FAILURE, ON_LOGOUT, ON_OTP_REQUEST, ON_OTP_FAILURE, ON_SWITCH_ACCOUNT, ON_SIGNED_MESSAGE, ON_EMBEDDED_WALLET_CREATED, ON_EMBEDDED_WALLET_RECOVERED

  // Events
  openfortEvents,          // Global event emitter

  // Types
  type AuthResponse,
  type EmbeddedAccount,
  type User,
  type Provider,
  type RecoveryParams,
  type OpenfortSDKConfiguration,
  type ShieldConfiguration,
  type OpenfortEventMap,
  type AuthInitPayload,
  type SignedMessagePayload,

  // Errors
  OpenfortError,
  AuthenticationError,
  RecoveryError,
} from '@openfort/openfort-js'
```
