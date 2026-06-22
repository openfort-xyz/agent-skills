---
name: openfort-react
description: Setup and configure Openfort in React and Next.js applications. Use this skill whenever implementing OpenfortProvider, OpenfortWagmiBridge, OpenfortButton, the Openfort auth/wallet modal widget, wagmi configuration with Openfort, wallet configuration with shieldPublishableKey, theme customization, uiConfig, auth providers in the modal, useUI hook, modal routes, phoneConfig, walletRecovery options, or initial project scaffolding with @openfort/react. Trigger on any mention of "Openfort provider", "Openfort React setup", "OpenfortWagmiBridge", "OpenfortButton", "Openfort widget", "Openfort modal", "walletConfig", "uiConfig", "useUI", "auth providers modal", or integrating Openfort into a React/Next.js app.
---

# Openfort React Setup

Complete guide for setting up `@openfort/react` in React and Next.js applications.

> **How to read this document:**
> 1. Always read **COMMON** sections — they apply to every integration.
> 2. Then read **only** the chain section that matches your integration:
>    - **ETHEREUM** (lines ~276–431) — EVM chains with wagmi (includes wagmi + OpenfortWagmiBridge)
>    - **SOLANA** (lines ~439–538) — Solana without wagmi (headless provider only)
> 3. Skip the other chain section — but **only** that section. The next `---` separator marks its end, and the other chain section follows immediately after.

---

<!-- ─────────────────────────────────────────── -->
<!-- COMMON — always read                        -->
<!-- ─────────────────────────────────────────── -->

## COMMON: OpenfortProvider Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `publishableKey` | `string` | **Yes** | `pk_test_...` or `pk_live_...` from dashboard |
| `walletConfig` | `OpenfortWalletConfig` | **Yes** (for embedded wallets) | Shield + recovery + chain configuration |
| `uiConfig` | `ConnectUIOptions` | Recommended | Theme, auth providers, modal customization |
| `debugMode` | `boolean \| DebugModeOptions` | Dev only | `true` enables all logs. Object for granular: `{ openfortReactDebugMode, openfortCoreDebugMode, shieldDebugMode, debugRoutes }` |
| `overrides` | `SDKOverrides` | Rarely needed | Override `backendUrl`, `iframeUrl`, `shieldUrl`, custom `storage`, `crypto`, `passkeyHandler` |
| `thirdPartyAuth` | `ThirdPartyAuthConfiguration` | Only for Firebase/Supabase/OIDC | `{ provider, getAccessToken }` for third-party auth |
| `onConnect` | `({ address, connectorId, user }) => void` | Rarely needed | Callback on connect — receives the connected address, connector ID, and user object |
| `onDisconnect` | `() => void` | Rarely needed | Callback on disconnect |

## COMMON: walletConfig (shared options)

```ts
const walletConfig = {
  // ── Always needed ──
  shieldPublishableKey: import.meta.env.VITE_SHIELD_PUBLISHABLE_KEY!,  // Required — from dashboard

  // ── Recovery (recommended: pick one) ──
  createEncryptedSessionEndpoint: import.meta.env.VITE_CREATE_ENCRYPTED_SESSION_ENDPOINT,
    // Recommended for production — backend URL for automatic recovery
    // Alternative: getEncryptionSession: async ({ accessToken, userId }) => sessionId

  // ── Behavior ──
  connectOnLogin: true,  // Recommended — auto create/recover wallet after auth (default: true)

  // ── Chain config ──
  // See ETHEREUM or SOLANA sections below for chain-specific walletConfig fields

  // ── Other advanced (rarely needed) ──
  // chainType: ChainTypeEnum.EVM,           // default EVM — initial chain type on mount
  // passkeyDisplayName: 'My Wallet',        // name in browser passkey dialog
  // requestWalletRecoverOTPEndpoint: '...',  // backend URL for OTP-based wallet recovery
  // getEncryptionSession: async (params) => { // alternative to createEncryptedSessionEndpoint
  //   // params: { accessToken: string, userId: string, otpCode?: string }
  //   return sessionId
  // },
}
```

## COMMON: Widget (OpenfortButton + Modal)

`OpenfortButton` is a single component that adapts to the user's state:

- **Not logged in** → shows a "Connect" button. Clicking opens the auth modal (login/signup).
- **Logged in + wallet connected** → shows a preview of the wallet address (truncated) and avatar. Clicking opens the profile/wallet modal (balance, send, receive, buy, linked accounts, etc.).
- **Logged in + no wallet** → shows connecting/loading state while wallet is being created/recovered.

```tsx
import { OpenfortButton } from '@openfort/react'

function App() {
  return <OpenfortButton />
}
```

No need to conditionally render different buttons for logged-in vs logged-out users.

## COMMON: uiConfig

```tsx
import { AuthProvider, RecoveryMethod } from '@openfort/react'

<OpenfortProvider
  publishableKey={import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY!}
  walletConfig={walletConfig}
  uiConfig={{
    // ── Common (most implementations use these) ──
    theme: 'midnight',              // Recommended — 'auto' | 'web95' | 'retro' | 'soft' | 'midnight' | 'minimal' | 'rounded' | 'nouns'
    mode: 'dark',                   // Recommended — 'light' | 'dark' | 'auto'
    authProviders: [                // Recommended — which login methods appear in the modal
      AuthProvider.GOOGLE,
      AuthProvider.EMAIL_OTP,
      AuthProvider.WALLET,          // ETHEREUM ONLY — requires OpenfortWagmiBridge, auto-removed if no wagmi
    ],
    authProvidersLength: 4,         // Recommended — how many to show before "More options" (default: all)
    walletRecovery: {               // Recommended — controls wallet recovery UI in modal
      allowedMethods: [RecoveryMethod.AUTOMATIC, RecoveryMethod.PASSKEY],
      defaultMethod: RecoveryMethod.AUTOMATIC,
    },

    // ── Branding ──
    // appName: 'My App',           // Rarely needed — defaults to getDefaultConfig appName
    // logo: <img src="/logo.svg" />, // Rarely needed — custom logo in modal
    // customAvatar: MyAvatarComponent, // Rarely needed — custom avatar component

    // ── Legal (if your app requires it) ──
    // termsOfServiceUrl: 'https://myapp.com/tos',
    // privacyPolicyUrl: 'https://myapp.com/privacy',
    // disclaimer: 'By continuing you agree to our terms.',

    // ── Rarely needed options ──
    // customTheme: { ... },        // Override specific CSS variables for full custom theming
    // skipEmailVerification: false, // Skip email verification step
    // linkWalletOnSignUp: LinkWalletOnSignUpOption.OPTIONAL, // 'optional' | 'required' | 'disabled'
    // overlayBlur: 4,              // Background blur intensity when modal is open
    // hideBalance: false,          // Hide token balances in wallet view
    // hideTooltips: false,         // Hide UI tooltips
    // hideRecentBadge: false,      // Hide "recent" badge on wallets
    // reducedMotion: false,        // Disable animations
    // avoidLayoutShift: true,      // Add body padding when modal open
    // embedGoogleFonts: true,      // Auto-embed theme font
    // truncateLongENSAddress: true, // Shorten long ENS names (ETHEREUM ONLY)
    // enforceSupportedChains: true, // Force chain switch if on unsupported chain (ETHEREUM ONLY)
    // walletConnectCTA: 'both',    // 'link' | 'modal' | 'both' — WalletConnect button style (ETHEREUM ONLY)
    // buyWithCardUrl: 'https://...', // Custom onramp URL
    // buyFromExchangeUrl: 'https://...', // Custom exchange URL
    // phoneConfig: { defaultCountry: 'us', preferredCountries: ['us', 'gb'], forceDialCode: true },
    // customPageComponents: { connected: <MyCustomPage /> }, // Replace built-in pages
  }}
/>
```

### Auth Providers

```ts
enum AuthProvider {
  GOOGLE = 'google',
  TWITTER = 'twitter',      // Also available as X = 'twitter'
  FACEBOOK = 'facebook',
  DISCORD = 'discord',
  APPLE = 'apple',
  EMAIL_PASSWORD = 'emailPassword',
  EMAIL_OTP = 'emailOtp',
  PHONE = 'phone',
  WALLET = 'wallet',        // ETHEREUM ONLY — SIWE / external wallet connect via wagmi
  GUEST = 'guest',
}
```

### Programmatic Modal Control with useUI()

```tsx
import { useUI } from '@openfort/react'

function MyComponent() {
  const ui = useUI()
  // ui.isOpen: boolean              — whether modal is open
  // ui.open(): void                 — open modal (auto-detects correct route based on auth/wallet state)
  // ui.close(): void                — close modal
  // ui.setIsOpen(bool): void        — set open state directly
  // ui.openProfile(): void          — open to connected/profile screen
  // ui.openSwitchNetworks(): void   — open chain switcher (ETHEREUM ONLY)
  // ui.openProviders(): void        — open auth provider selection
  // ui.openWallets(): void          — open external wallet connectors (ETHEREUM ONLY)
}
```

### Phone Config

```tsx
phoneConfig: {
  defaultCountry: 'es',                    // ISO2 country code
  preferredCountries: ['es', 'us', 'gb'],  // Shown at top of dropdown
  forceDialCode: true,                     // Can't remove dial code
  hideDropdown: false,                     // Show/hide country selector
  disableFormatting: false,                // Raw numbers without mask
  disableCountryGuess: false,              // Auto-detect country
  disableDialCodePrefill: false,           // Pre-fill dial code on init
  disableFocusAfterCountrySelect: false,   // Keep focus after selecting country
}
```

### Wallet Linking on Signup (ETHEREUM ONLY)

```tsx
import { LinkWalletOnSignUpOption } from '@openfort/react'

uiConfig: {
  linkWalletOnSignUp: LinkWalletOnSignUpOption.OPTIONAL,
  // OPTIONAL — user can optionally link an external wallet after signup
  // REQUIRED — user must link a wallet to complete signup
  // DISABLED — no wallet linking prompt shown
}
```

### Custom Page Components

```tsx
<OpenfortProvider
  uiConfig={{
    customPageComponents: {
      connected: <MyCustomDashboard />, // Replaces the default connected page
    },
  }}
/>
```

Currently customizable routes: `'connected'`.

## COMMON: Auth Hooks

```ts
import { useEmailAuth, useEmailOtpAuth, usePhoneOtpAuth, useOAuth, useGuestAuth, useSignOut, useUser } from '@openfort/react'
```

## COMMON: Modal Routes

**Auth**: `'providers'` `'socialProviders'` `'emailLogin'` `'emailOtp'` `'phoneOtp'` `'forgotPassword'` `'emailVerification'` `'linkEmail'` `'createGuestUser'`

**Wallet lifecycle**: `'loadWallets'` `'createWallet'` `'recoverWallets'` `'selectWalletToRecover'` `'connectedSuccess'`

**Profile**: `'profile'` `'exportKey'` `'linkedProviders'` `'linkedProvider'` `'removeLinkedProvider'`

**Shared**: `'walletOverview'` `'assetInventory'` `'noAssetsAvailable'` `'send'` `'sendTokenSelect'` `'sendConfirmation'` `'receive'` `'buy'` `'buyTokenSelect'` `'buySelectProvider'` `'buyProviderSelect'` `'buyProcessing'` `'buyComplete'` `'about'` `'onboarding'` `'loading'` `'connectWithMobile'` `'download'`

## COMMON: SSR Compatibility Rules

- All hooks and `OpenfortProvider` are client-only — use `"use client"` directive
- Do NOT import hooks in Server Components
- No hydration mismatches when provider is on client boundary
- `OpenfortButton` must be in a Client Component

## COMMON: Next.js App Router

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

```tsx
// app/providers.tsx
"use client"
// Use the provider setup from the ETHEREUM or SOLANA section below
```

For Next.js, prefix env vars with `NEXT_PUBLIC_` instead of `VITE_`.

## COMMON: Types/Enums

```ts
import { AccountTypeEnum, ChainTypeEnum, RecoveryMethod, OAuthProvider, AuthProvider } from '@openfort/react'
```

---

<!-- ─────────────────────────────────────────── -->
<!-- ETHEREUM — read only for EVM integrations   -->
<!-- Solana developers: skip to "## SOLANA:"     -->
<!-- below — this section ends at the next ---   -->
<!-- ─────────────────────────────────────────── -->

## ETHEREUM: Packages

```bash
npm install @openfort/react @tanstack/react-query wagmi viem
```

## ETHEREUM: Environment Variables

```env
VITE_OPENFORT_PUBLISHABLE_KEY=pk_test_...       # From https://dashboard.openfort.io
VITE_SHIELD_PUBLISHABLE_KEY=your-shield-publishable-key        # Shield public key from dashboard
VITE_WALLET_CONNECT_PROJECT_ID=...               # From https://cloud.walletconnect.com
VITE_FEE_SPONSORSHIP_ID=pol_...                  # Fee sponsorship ID (optional, for gasless tx)
VITE_CREATE_ENCRYPTED_SESSION_ENDPOINT=https://...  # Backend endpoint for automatic recovery (optional)
```

## ETHEREUM: Provider Setup

The provider stack is always: `QueryClientProvider` → `WagmiProvider` → `OpenfortWagmiBridge` → `OpenfortProvider`.

```tsx
"use client" // Required in Next.js App Router

import { OpenfortProvider } from '@openfort/react'
import { getDefaultConfig, OpenfortWagmiBridge } from '@openfort/react/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { createConfig, http, WagmiProvider } from 'wagmi'

const config = createConfig(
  getDefaultConfig({
    appName: 'My App',                                                     // Required — app display name
    chains: [base, baseSepolia],                                           // Recommended — your supported chains (default: [mainnet, polygon, optimism, arbitrum])
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,// Recommended — enables external wallets via WalletConnect
    transports: {                                                          // Recommended for production — custom RPCs (default: public http() per chain)
      [base.id]: http('https://your-base-rpc.com'),
      [baseSepolia.id]: http(),
    },
    // ssr: true,                                                          // Only for Next.js — enable SSR hydration support
    // coinbaseWalletPreference: 'smartWalletOnly',                        // Rarely needed — 'all' | 'smartWalletOnly' | 'eoaOnly'
    // appIcon: 'https://myapp.com/icon.png',                              // Rarely needed — WalletConnect metadata
    // appDescription: 'My awesome app',                                   // Rarely needed — WalletConnect metadata
    // appUrl: 'https://myapp.com',                                        // Rarely needed — WalletConnect metadata
    // connectors: [...],                                                  // Rarely needed — override all default connectors
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

## ETHEREUM: getDefaultConfig

```ts
type DefaultConfigProps = {
  appName: string                         // Required — app display name
  chains?: Chain[]                        // Recommended, default [mainnet, polygon, optimism, arbitrum] — your supported chains
  walletConnectProjectId?: string         // Recommended — WalletConnect Cloud project ID (enables external wallets)
  transports?: Record<number, Transport>  // Recommended for production — custom RPC per chain (default: public http())
  ssr?: boolean                           // Only for Next.js, default false — SSR hydration support
  coinbaseWalletPreference?: 'all' | 'smartWalletOnly' | 'eoaOnly'  // Rarely needed — Coinbase Wallet mode
  appIcon?: string                        // Rarely needed — icon URL for WalletConnect metadata
  appDescription?: string                 // Rarely needed — description for WalletConnect metadata
  appUrl?: string                         // Rarely needed — URL for WalletConnect metadata
  connectors?: CreateConnectorFn[]        // Rarely needed — override all default connectors
  // ...plus any wagmi CreateConfigParameters (storage, syncConnectedChain, etc.)
}
```

Default connectors (when `connectors` is not overridden):
- `embeddedWalletConnector()` — always included (Openfort embedded wallet)
- `coinbaseWallet()` — always included
- `walletConnect()` — only if `walletConnectProjectId` is provided
- `safe()` — only if running inside a Safe iframe

## ETHEREUM: walletConfig.ethereum

```ts
ethereum: {
  // ── Recommended ──
  ethereumFeeSponsorshipId: import.meta.env.VITE_FEE_SPONSORSHIP_ID,
    // Recommended — gasless tx (from dashboard)
    // Can also be per-chain:
    // ethereumFeeSponsorshipId: {
    //   8453: import.meta.env.VITE_FEE_SPONSORSHIP_BASE,
    //   84532: import.meta.env.VITE_FEE_SPONSORSHIP_BASE_SEPOLIA,
    // },

  // ── Rarely needed ──
  // chainId: 8453,                              // initial chain ID (wagmi manages this via bridge)
  // rpcUrls: { 8453: 'https://...' },           // custom RPCs per chain (wagmi transports preferred)
  // accountType: AccountTypeEnum.SMART_ACCOUNT,  // EOA | SMART_ACCOUNT | DELEGATED_ACCOUNT
  // assets: { 8453: ['0xUSDC...'] },            // token addresses per chain for asset inventory widget
}
```

## ETHEREUM: Hooks

```ts
import { useEthereumEmbeddedWallet } from '@openfort/react/ethereum'
import { useWalletAuth } from '@openfort/react/wagmi'
```

## ETHEREUM: Modal Routes

**EVM-specific**: `'eth:connected'` `'eth:createWallet'` `'eth:recoverWallet'` `'eth:switchNetworks'` `'eth:send'` `'eth:receive'` `'eth:buy'` `'eth:connectors'`

**External wallets**: `'connectors'` `'mobileConnectors'` `'connect'` `'connected'` (customizable) `'switchNetworks'`

## ETHEREUM: Key Exports

```ts
// Provider + wagmi
import { OpenfortProvider, OpenfortButton } from '@openfort/react'
import { OpenfortWagmiBridge, getDefaultConfig, embeddedWalletConnector, useWalletAuth, useChainIsSupported } from '@openfort/react/wagmi'

// Ethereum wallet
import { useEthereumEmbeddedWallet } from '@openfort/react/ethereum'

// Auth + user
import { useUser, useEmailAuth, useEmailOtpAuth, usePhoneOtpAuth, useOAuth, useGuestAuth, useSignOut } from '@openfort/react'

// Types
import { AccountTypeEnum, ChainTypeEnum, RecoveryMethod, OAuthProvider, AuthProvider } from '@openfort/react'
```

---

<!-- ─────────────────────────────────────────── -->
<!-- SOLANA — read only for Solana integrations  -->
<!-- EVM developers: skip this section entirely  -->
<!-- This is the last section in the document    -->
<!-- ─────────────────────────────────────────── -->

## SOLANA: Packages

```bash
npm install @openfort/react @tanstack/react-query @solana/kit
```

No wagmi or viem needed for Solana-only integrations.

## SOLANA: Environment Variables

```env
VITE_OPENFORT_PUBLISHABLE_KEY=pk_test_...       # From https://dashboard.openfort.io
VITE_SHIELD_PUBLISHABLE_KEY=your-shield-publishable-key        # Shield public key from dashboard
VITE_CREATE_ENCRYPTED_SESSION_ENDPOINT=https://...  # Backend endpoint for automatic recovery (optional)
```

No WalletConnect or fee sponsorship IDs needed for Solana.

## SOLANA: Provider Setup

The provider stack is: `QueryClientProvider` → `OpenfortProvider`. No wagmi, no bridge.

```tsx
"use client" // Required in Next.js App Router

import { OpenfortProvider, AuthProvider } from '@openfort/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const walletConfig = {
  shieldPublishableKey: import.meta.env.VITE_SHIELD_PUBLISHABLE_KEY!,
  chainType: ChainTypeEnum.SVM,
  solana: {
    cluster: 'mainnet-beta',
  },
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
          // Do NOT include AuthProvider.WALLET — that requires wagmi/SIWE
        }}
      >
        {children}
      </OpenfortProvider>
    </QueryClientProvider>
  )
}
```

## SOLANA: walletConfig.solana

```ts
solana: {
  // ── Required ──
  cluster: 'mainnet-beta',              // 'mainnet-beta' | 'devnet' | 'testnet'

  // ── Rarely needed ──
  // rpcUrls: { 'mainnet-beta': 'https://...' },  // custom RPCs
  // commitment: 'confirmed',                       // 'processed' | 'confirmed' | 'finalized' (default: 'confirmed')
}
```

Also set `chainType: ChainTypeEnum.SVM` in the top-level walletConfig to default to Solana on mount.

> **Solana builders:** `chainType` defaults to `EVM`. Without `chainType: ChainTypeEnum.SVM`, OAuth (and other auth flows) succeed but `useSolanaEmbeddedWallet` stays at `isConnected: false` — auto-recovery filters wallets by the active `chainType` and picks EVM. After auth, gate UI on `isConnected` from `useSolanaEmbeddedWallet`.

## SOLANA: Hooks

```ts
import { useSolanaEmbeddedWallet } from '@openfort/react/solana'
```

## SOLANA: Modal Routes

**Solana-specific**: `'sol:connected'` `'sol:createWallet'` `'sol:recoverWallet'` `'sol:send'` `'sol:sendConfirmation'` `'sol:receive'` `'sol:assetInventory'` `'sol:wallets'`

## SOLANA: Key Exports

```ts
// Provider (no wagmi)
import { OpenfortProvider, OpenfortButton } from '@openfort/react'

// Solana wallet
import { useSolanaEmbeddedWallet } from '@openfort/react/solana'

// Auth + user
import { useUser, useEmailAuth, useEmailOtpAuth, usePhoneOtpAuth, useOAuth, useGuestAuth, useSignOut } from '@openfort/react'

// Types
import { ChainTypeEnum, RecoveryMethod, OAuthProvider, AuthProvider } from '@openfort/react'
```
