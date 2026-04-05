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
  - name: OPENFORT_SHIELD_KEY
    description: "Shield Publishable Key (shield_pk_...) — for embedded wallet encryption"
    required: true
references:
  - openfort-js.md
  - openfort-react.md
  - openfort-react-native.md
  - openfort-swift.md
  - openfort-unity.md
---

# Openfort Embedded Wallet Setup

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

For detailed setup instructions per SDK, see the reference files:
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

> The CLI currently scaffolds React web apps. For other platforms, follow the manual setup in the SDK-specific references.

---

## Prerequisites (All Platforms)

Before integrating any SDK, get your keys from the [Openfort Dashboard](https://dashboard.openfort.io):

1. **Publishable Key** (`pk_test_...`) — identifies your project
2. **Shield Publishable Key** (`shield_pk_...`) — for embedded wallet encryption
3. **Recovery endpoint** (recommended) — a backend URL for automatic wallet recovery
4. **Fee Sponsorship ID** (`pol_...`, optional) — for gasless transactions

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
