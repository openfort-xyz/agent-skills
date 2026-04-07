---
name: openfort-unity
description: Setup and configure Openfort in Unity/C# games. Use this skill whenever implementing OpenfortSDK, embedded wallet configuration, authentication flows, EIP-1193 provider, wallet recovery, smart wallet transactions, session keys, signing messages, WebGL deployment, or initial project scaffolding with the Openfort Unity SDK. Trigger on any mention of "Unity Openfort", "C# Openfort", "OpenfortSDK", "ConfigureEmbeddedWallet", "GetEthereumProvider Unity", "SignMessage Unity", "Unity embedded wallet", "WebGL Openfort", or integrating Openfort into a Unity game.
---

# Openfort Unity SDK

Complete guide for setting up the Openfort Unity SDK (`openfort-csharp-unity`) in Unity games.

## Supported Platforms

- Windows (64-bit, Mono backend only — IL2CPP not supported)
- macOS (minimum version 12.5)
- Android (minimum version 5.1)
- iOS (minimum version 15.2)
- WebGL (requires additional setup)

Unity 2021.3+ for all platforms; 2019.4+ for non-Windows.

## Installation

Requires [UniTask](https://github.com/Cysharp/UniTask) (v2.3.3) and [git-lfs](https://git-lfs.github.com/).

### Via UPM (Unity Package Manager)

1. Add package from git URL: `https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask`
2. Add package from git URL: `https://github.com/openfort-xyz/openfort-csharp-unity.git?path=/src/Packages/OpenfortSDK`

### Via manifest.json

Add to `Packages/manifest.json` dependencies:
```json
{
  "com.cysharp.unitask": "https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask",
  "com.openfort.sdk": "https://github.com/openfort-xyz/openfort-csharp-unity.git?path=/src/Packages/OpenfortSDK"
}
```

## SDK Initialization

```csharp
using Cysharp.Threading.Tasks;
using Openfort.OpenfortSDK;
using Openfort.OpenfortSDK.Model;

private OpenfortSDK openfort;

private async UniTask InitializeOpenfort()
{
    openfort = await OpenfortSDK.Init(
        publishableKey: "pk_test_...",
        shieldPublishableKey: "your-shield-publishable-key",  // Optional, for embedded wallets
        shieldDebug: false
    );
}
```

### Init Method Signature

```csharp
public static UniTask<OpenfortSDK> Init(
    string publishableKey,                          // Required — from dashboard
    string shieldPublishableKey = null,              // For embedded wallets
    bool shieldDebug = false,                        // Shield debug mode
    string backendUrl = "https://api.openfort.io",   // Override backend URL
    string iframeUrl = "https://embed.openfort.io",  // Override iframe URL
    string shieldUrl = "https://shield.openfort.io", // Override Shield URL
    string thirdPartyProvider = null,                // e.g. "firebase", "supabase"
    Func<string, Task<string>> getThirdPartyToken = null,  // Token provider
    int engineStartupTimeoutMs = 4000                // Windows only
)
```

### Third-Party Auth Initialization

```csharp
openfort = await OpenfortSDK.Init(
    publishableKey: "pk_test_...",
    shieldPublishableKey: "your-shield-publishable-key",
    thirdPartyProvider: "firebase",
    getThirdPartyToken: async (userId) =>
    {
        return await FirebaseAuth.DefaultInstance.CurrentUser.TokenAsync(true);
    }
);
```

Supported third-party providers: `"firebase"`, `"supabase"`, `"playfab"`, `"accelbyte"`, `"lootlocker"`, `"oidc"`, `"custom"`

## Embedded Wallet State

```csharp
enum EmbeddedState
{
    NONE,                            // Initial SDK state
    UNAUTHENTICATED,                 // Before user authentication
    EMBEDDED_SIGNER_NOT_CONFIGURED,  // Before wallet configuration
    CREATING_ACCOUNT,                // Creating new account for chainID
    READY                            // Wallet ready for use
}

// Check current state
var state = await openfort.GetEmbeddedState();
```

## Wallet Configuration (Recovery)

After authentication, configure the embedded wallet with a recovery method:

### Password Recovery

```csharp
var shield = new ShieldAuthentication(
    ShieldAuthType.Openfort,
    openfortEncryptionKey: "YOUR_SHIELD_ENCRYPTION_SHARE"
);
var account = await openfort.ConfigureEmbeddedWallet(
    chainId: 80002,
    shieldAuthentication: shield,
    recoveryPassword: "user-password"
);
```

### Automatic Recovery

Requires an encryption session from your backend:

```csharp
// 1. Fetch encryption session from backend
var session = await FetchEncryptionSession();

// 2. Configure with automatic recovery
var shield = new ShieldAuthentication(
    ShieldAuthType.Openfort,
    openfortEncryptionSession: session
);
var account = await openfort.ConfigureEmbeddedWallet(
    chainId: 80002,
    shieldAuthentication: shield
);
```

### Additional Wallet Operations

```csharp
// Create a new embedded wallet
var wallet = await openfort.CreateEmbeddedWallet(chainId: 80002, shieldAuthentication: shield);

// Recover embedded wallet
var wallet = await openfort.RecoverEmbeddedWallet(chainId: 80002, shieldAuthentication: shield, recoveryPassword: "password");

// Get current wallet
var wallet = await openfort.GetEmbeddedWallet();

// List all wallets
var wallets = await openfort.ListWallets();
```

## Authentication

### Email & Password

```csharp
// Sign up
var authResponse = await openfort.SignUpWithEmailPassword(
    new SignUpEmailPasswordRequest(email: "user@example.com", password: "password123")
);

// Log in
var authResponse = await openfort.LogInWithEmailPassword(
    new LoginEmailPasswordRequest(email: "user@example.com", password: "password123")
);

// Request email verification
await openfort.RequestEmailVerification(
    new RequestEmailVerificationRequest(email: "user@example.com", redirectUrl: "https://your-redirect-url")
);

// Verify email
await openfort.VerifyEmail(new VerifyEmailRequest(token: "verification-token"));
```

### Email OTP

```csharp
// Request OTP
await openfort.RequestEmailOtp(new RequestEmailOtpRequest(email: "user@example.com"));

// Log in with OTP
var authResponse = await openfort.LogInWithEmailOtp(
    new LoginEmailOtpRequest(email: "user@example.com", otp: "123456")
);

// Verify email via OTP
await openfort.VerifyEmailOtp(new VerifyEmailOtpRequest(email: "user@example.com", otp: "123456"));
```

### Phone OTP

```csharp
// Request phone OTP
await openfort.RequestPhoneOtp(new RequestPhoneOtpRequest(phoneNumber: "+1234567890"));

// Log in with phone OTP
var authResponse = await openfort.LogInWithPhoneOtp(
    new LoginPhoneOtpRequest(phoneNumber: "+1234567890", otp: "123456")
);

// Link phone number
await openfort.LinkPhoneOtp(new LinkPhoneOtpRequest(phoneNumber: "+1234567890", otp: "123456"));
```

### Guest

```csharp
var authResponse = await openfort.SignUpGuest();
```

Guest accounts cannot merge into existing accounts — they can only be upgraded. Use `AddEmail()` to upgrade:

```csharp
await openfort.AddEmail(new AddEmailRequest(email: "user@example.com", password: "password123"));
```

### Third-Party Auth (Firebase, Supabase, etc.)

Initialize SDK with third-party provider (see Init section above), then use your provider's auth flow. The SDK automatically uses the `getThirdPartyToken` callback.

```csharp
// After authenticating with your provider:
var authResponse = await openfort.LogInWithIdToken(
    new LogInWithIdTokenRequest(provider: "firebase", token: idToken)
);
```

### External Wallet (SIWE)

```csharp
// 1. Initialize SIWE
var initResponse = await openfort.InitSiwe(
    new InitSiweRequest(address: walletAddress)
);

// 2. Sign the message with external wallet
var signature = SignWithExternalWallet(initResponse.Message);

// 3. Complete authentication
var authResponse = await openfort.LoginWithSiwe(
    new LoginWithSiweRequest(
        signature: signature,
        message: initResponse.Message,
        walletClientType: "MetaMask",
        connectorType: "metaMask"
    )
);

// Link additional wallet
var linkInit = await openfort.InitLinkSiwe(new InitSiweRequest(address: anotherAddress));
await openfort.LinkWithSiwe(new LinkWithSiweRequest(
    signature: sig, message: linkInit.Message,
    walletClientType: "MetaMask", connectorType: "metaMask"
));

// Unlink wallet
await openfort.UnlinkWallet(new UnlinkWalletRequest(address: walletAddress));
```

### OAuth

:::warning
OAuth flows (Google, Twitter, Facebook, Discord, etc.) are **not available** when using Openfort's built-in authentication in Unity. Use a third-party auth provider (Firebase, Supabase, etc.) and pass the JWT to Openfort via `LogInWithIdToken`.
:::

## User Session

```csharp
// Get current user
var user = await openfort.GetUser();
// user.Id, user.LinkedAccounts

// Get access token
var token = await openfort.GetAccessToken();

// Validate and refresh token
var tokenResponse = await openfort.ValidateAndRefreshToken(
    new ValidateAndRefreshTokenRequest(token: token)
);

// Store credentials (for OAuth callback flows)
await openfort.StoreCredentials(
    new StoreCredentialsRequest(token: accessToken, userId: userId)
);

// Log out
await openfort.Logout();
```

### Password Reset

```csharp
// Request reset
await openfort.RequestResetPassword(
    new RequestResetPasswordRequest(email: email, redirectUrl: "https://your-redirect")
);

// Complete reset
await openfort.ResetPassword(
    new ResetPasswordRequest(password: newPassword, token: resetToken)
);
```

## Ethereum Provider (EIP-1193)

```csharp
// Get provider
var provider = await openfort.GetEthereumProvider(new EthereumProviderRequest());

// With gas sponsorship
var provider = await openfort.GetEthereumProvider(
    new EthereumProviderRequest(policy: "YOUR_POLICY_ID")
);
```

### Send Transaction

Use the provider for standard JSON-RPC requests:

```csharp
var provider = await openfort.GetEthereumProvider(new EthereumProviderRequest());

// Send transaction
var txParams = new Dictionary<string, object>
{
    { "to", "0x..." },
    { "from", "0x..." },
    { "value", "0x8ac7230489e80000" },
    { "data", "0x" }
};
var txHash = await provider.Request("eth_sendTransaction", new object[] { txParams });
```

### Sponsored Transaction

Pass `policy` to the provider and omit gas params:

```csharp
var provider = await openfort.GetEthereumProvider(
    new EthereumProviderRequest(policy: "YOUR_POLICY_ID")
);
```

## Sign Message (EIP-191)

```csharp
var signature = await openfort.SignMessage(
    new SignMessageRequest(message: "Hello World!")
);
```

With options:

```csharp
var signature = await openfort.SignMessage(
    new SignMessageRequest(
        message: "Hello World!",
        options: new SignMessageOptions(hashMessage: true, arrayifyMessage: false)
    )
);
```

## Sign Typed Data (EIP-712)

```csharp
var domain = new TypedDataDomain(
    name: "Openfort",
    version: "0.5",
    chainId: 80002,
    verifyingContract: "0x..."
);
var types = new Dictionary<string, List<TypedDataField>>
{
    { "Mail", new List<TypedDataField>
        {
            new TypedDataField("from", "Person"),
            new TypedDataField("to", "Person"),
            new TypedDataField("content", "string")
        }
    },
    { "Person", new List<TypedDataField>
        {
            new TypedDataField("name", "string"),
            new TypedDataField("wallet", "address")
        }
    }
};
var message = new Dictionary<string, object>
{
    { "from", new Dictionary<string, string> { { "name", "Alice" }, { "wallet", "0x..." } } },
    { "to", new Dictionary<string, string> { { "name", "Bob" }, { "wallet", "0x..." } } },
    { "content", "Hello!" }
};
var signature = await openfort.SignTypedData(
    new SignTypedDataRequest(domain: domain, types: types, message: message)
);
```

## Sign Transaction Intent

For server-originated transactions:

```csharp
var response = await openfort.SendSignatureTransactionIntentRequest(
    new SendSignatureTransactionIntentRequest(
        transactionIntentId: "ti_...",
        signableHash: userOperationHash,
        signature: signature,
        optimistic: false
    )
);
```

## Auth Events

Subscribe to authentication state changes:

```csharp
openfort.OnAuthEvent += (eventType) =>
{
    switch (eventType)
    {
        case OpenfortAuthEvent.LoginSuccess:
            Debug.Log("User logged in");
            break;
        case OpenfortAuthEvent.LogoutSuccess:
            Debug.Log("User logged out");
            break;
        case OpenfortAuthEvent.LoginFailed:
            Debug.Log("Login failed");
            break;
    }
};
```

### OpenfortAuthEvent Values

`LoggingIn`, `LoginFailed`, `LoginSuccess`, `LoggingOut`, `LogoutFailed`, `LogoutSuccess`, `ReloggingIn`, `ReloginFailed`, `ReloginSuccess`, `Reconnecting`, `ReconnectFailed`, `ReconnectSuccess`, `CheckingForSavedCredentials`, `CheckForSavedCredentialsFailed`, `CheckForSavedCredentialsSuccess`

## Error Handling

```csharp
try
{
    await openfort.LogInWithEmailPassword(request);
}
catch (OpenfortException e)
{
    Debug.LogError($"Error: {e.Message}, Type: {e.Type}");
    if (e.IsNetworkError())
    {
        Debug.Log("Network error — check connectivity");
    }
}
```

### OpenfortErrorType Values

`INITIALIZATION_ERROR`, `AUTHENTICATION_ERROR`, `USER_REGISTRATION_ERROR`, `REFRESH_TOKEN_ERROR`, `OPERATION_NOT_SUPPORTED_ERROR`, `NOT_LOGGED_IN_ERROR`, `LOGOUT_ERROR`, `MISSING_SESSION_SIGNER_ERROR`, `MISSING_EMBEDDED_SIGNER_ERROR`, `MISSING_SIGNER_ERROR`

## Utility Methods

```csharp
// Set browser communication timeout (milliseconds)
await openfort.SetCallTimeout(30000);  // Default: 60000 (1 minute)

// Clear WebView cache
await openfort.ClearCache();

// Clear WebView storage
await openfort.ClearStorage();
```

## WebGL Deployment

Additional setup for WebGL builds:

1. In Player Settings → Resolution and Presentation → WebGL Template: select `openfort`
2. In Player Settings → Other Settings → Managed Stripping Level: set to `Minimal`
3. Configure allowed origins in the Openfort Dashboard (domain-based, not bundle IDs)

## Key Enums

```csharp
// Wallet state
enum EmbeddedState { NONE, UNAUTHENTICATED, EMBEDDED_SIGNER_NOT_CONFIGURED, CREATING_ACCOUNT, READY }

// Recovery
enum RecoveryMethod { PASSWORD, AUTOMATIC, PASSKEY }

// Chain
enum ChainType { EVM, SVM }

// Account
enum AccountType { EOA, SMART_ACCOUNT, DELEGATED_ACCOUNT }

// OAuth (not available with built-in auth in Unity — use third-party instead)
enum OAuthProvider { GOOGLE, TWITTER, APPLE, FACEBOOK, DISCORD, EPIC_GAMES, LINE }
```

## Namespaces

```csharp
using Openfort.OpenfortSDK;        // OpenfortSDK class
using Openfort.OpenfortSDK.Model;   // Request/Response models, enums
```
