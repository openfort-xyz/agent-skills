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
await openfort.ConfigureEmbeddedWallet(new ConfigureEmbeddedWalletRequest(
    recoveryParams: new PasswordRecoveryParams("user-password"),
    chainId: 80002
));
```

### Automatic Recovery

Requires an encryption session from your backend:

```csharp
// 1. Fetch encryption session from backend
var session = await FetchEncryptionSession();

// 2. Configure with automatic recovery
await openfort.ConfigureEmbeddedWallet(new ConfigureEmbeddedWalletRequest(
    recoveryParams: new AutomaticRecoveryParams(encryptionSession: session),
    chainId: 80002
));
```

### ConfigureEmbeddedWalletRequest

```csharp
new ConfigureEmbeddedWalletRequest(
    RecoveryParams recoveryParams = null,  // PasswordRecoveryParams or AutomaticRecoveryParams
    int? chainId = null,
    ChainType? chainType = null,           // EVM or SVM
    AccountType? accountType = null        // EOA, SMART_ACCOUNT, or DELEGATED_ACCOUNT
)
```

### Additional Wallet Operations

```csharp
// Create a new embedded wallet
var wallet = await openfort.CreateEmbeddedWallet(new CreateEmbeddedWalletRequest(
    accountType: AccountType.SMART_ACCOUNT,
    chainType: ChainType.EVM,
    recoveryParams: new AutomaticRecoveryParams(),
    chainId: 80002
));

// Recover embedded wallet
var wallet = await openfort.RecoverEmbeddedWallet(new RecoverEmbeddedWalletRequest(
    account: "account-id",
    recoveryParams: new PasswordRecoveryParams("password")
));

// Get current wallet
var wallet = await openfort.GetEmbeddedWallet();

// List all wallets (with optional filters)
var wallets = await openfort.ListWallets(new ListWalletsRequest
{
    AccountType = AccountType.SMART_ACCOUNT,  // Optional filter
    ChainType = ChainType.EVM,                // Optional filter
    ChainId = 80002,                          // Optional filter
    Limit = 10,                               // Optional pagination
    Skip = 0,                                 // Optional pagination
    SortOrder = SortOrdering.DESC             // Optional: ASC or DESC
});
```

## Authentication

### Email & Password

```csharp
// Sign up
var authResponse = await openfort.SignUpWithEmailPassword(
    email: "user@example.com",
    password: "password123",
    name: "User Name",           // Optional
    callbackURL: "https://..."   // Optional — email verification callback
);

// Log in
var authResponse = await openfort.LogInWithEmailPassword(
    email: "user@example.com",
    password: "password123"
);

// Request email verification
await openfort.RequestEmailVerification(
    new RequestEmailVerificationRequest("user@example.com", "https://your-redirect-url")
);

// Verify email
await openfort.VerifyEmail(new VerifyEmailRequest(
    token: "verification-token",
    callbackURL: "https://..."  // Optional
));
```

### Email OTP

```csharp
// Request OTP
await openfort.RequestEmailOtp("user@example.com");

// Log in with OTP
var authResponse = await openfort.LogInWithEmailOtp("user@example.com", "123456");

// Verify email via OTP
await openfort.VerifyEmailOtp("user@example.com", "123456");
```

### Phone OTP

```csharp
// Request phone OTP
await openfort.RequestPhoneOtp("+1234567890");

// Log in with phone OTP
var authResponse = await openfort.LogInWithPhoneOtp("+1234567890", "123456");

// Link phone number (returns AuthResponse)
var authResponse = await openfort.LinkPhoneOtp(new LinkPhoneOtpRequest("+1234567890", "123456"));
```

### Guest

```csharp
var authResponse = await openfort.SignUpGuest();
```

Guest accounts cannot merge into existing accounts — they can only be upgraded. Use `AddEmail()` to upgrade:

```csharp
await openfort.AddEmail(new AddEmailRequest(
    email: "user@example.com",
    callbackURL: "https://..."  // Optional — email verification callback
));
```

### Third-Party Auth (Firebase, Supabase, etc.)

Initialize SDK with third-party provider (see Init section above), then use your provider's auth flow. The SDK automatically uses the `getThirdPartyToken` callback.

```csharp
// After authenticating with your provider:
var authResponse = await openfort.LogInWithIdToken("firebase", idToken);
```

### External Wallet (SIWE)

```csharp
// 1. Initialize SIWE
var initResponse = await openfort.InitSiwe(
    new InitSiweRequest(address: walletAddress)
);

// 2. Build the SIWE message using the nonce and sign it with external wallet
var siweMessage = BuildSiweMessage(initResponse.address, initResponse.nonce);
var signature = SignWithExternalWallet(siweMessage);

// 3. Complete authentication (address is required)
var authResponse = await openfort.LoginWithSiwe(
    new LoginWithSiweRequest(
        signature: signature,
        message: siweMessage,
        walletClientType: "MetaMask",
        connectorType: "metaMask",
        address: walletAddress
    )
);

// Link additional wallet
var linkInit = await openfort.InitLinkSiwe(new InitLinkSiweRequest(anotherAddress));
var linkMsg = BuildSiweMessage(linkInit.address, linkInit.nonce);
await openfort.LinkWithSiwe(new LinkWithSiweRequest(
    signature: sig, message: linkMsg,
    walletClientType: "MetaMask", connectorType: "metaMask",
    address: anotherAddress, chainId: 1
));

// Unlink wallet
await openfort.UnlinkWallet(new UnlinkWalletRequest(walletAddress, chainId: 1));
```

### OAuth

The SDK supports OAuth via `InitOAuth` which returns a URL to redirect the user to:

```csharp
// Initialize OAuth flow — returns URL string for browser redirect
var url = await openfort.InitOAuth(OAuthProvider.GOOGLE, "https://your-redirect-url");

// Link OAuth provider to existing account
var url = await openfort.InitLinkOAuth(OAuthProvider.DISCORD, "https://your-redirect-url");

// Unlink OAuth provider
var user = await openfort.UnlinkOAuth(OAuthProvider.GOOGLE);
```

### InitializeOAuthOptions

```csharp
var options = new InitializeOAuthOptions
{
    scopes = "email profile",
    skipBrowserRedirect = true
};
var url = await openfort.InitOAuth(OAuthProvider.GOOGLE, "https://your-redirect-url", options);
```

Note: OAuth requires browser redirects, which may need platform-specific handling in Unity.

## User Session

```csharp
// Get current user
var user = await openfort.GetUser();
// user.Id, user.LinkedAccounts

// Get access token
var token = await openfort.GetAccessToken();

// Validate and refresh token
await openfort.ValidateAndRefreshToken(forceRefresh: false);

// Store credentials (for OAuth callback flows)
await openfort.StoreCredentials(
    new AuthCredentialsRequest(player: playerId, accessToken: accessToken, refreshToken: refreshToken)
);

// Log out
await openfort.Logout();
```

### Password Reset

```csharp
// Request reset (uses ResetPasswordRequest with password and token fields)
await openfort.RequestResetPassword(
    new ResetPasswordRequest(password: "", token: resetToken)
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
    new EthereumProviderRequest(new EthereumProviderOptions(policy: "YOUR_POLICY_ID"))
);
```

### Send Transaction

Use the provider for standard JSON-RPC requests:

```csharp
var provider = await openfort.GetEthereumProvider(new EthereumProviderRequest());

// Send transaction via IRequestArguments
var txParams = new Dictionary<string, object>
{
    { "to", "0x..." },
    { "from", "0x..." },
    { "value", "0x8ac7230489e80000" },
    { "data", "0x" }
};
var request = new JsonRpcRequestPayload
{
    method = "eth_sendTransaction",
    @params = new List<object> { txParams }
};
var txHash = await provider.Request(request);
```

### Sponsored Transaction

Pass `policy` via `EthereumProviderOptions` and omit gas params:

```csharp
var provider = await openfort.GetEthereumProvider(
    new EthereumProviderRequest(new EthereumProviderOptions(policy: "YOUR_POLICY_ID"))
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
    new SignTypedDataRequest(domain: domain, types: types, value: message)
);
```

## Sign Transaction Intent

For server-originated transactions:

```csharp
var response = await openfort.SendSignatureTransactionIntentRequest(
    new SignatureTransactionIntentRequest(
        transactionIntentId: "ti_...",
        userOperationHash: userOpHash,
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
    await openfort.LogInWithEmailPassword("user@example.com", "password");
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
// Set browser communication timeout (milliseconds) — synchronous, not async
openfort.SetCallTimeout(30000);

// Clear WebView cache — synchronous, requires bool param
openfort.ClearCache(includeDiskFiles: true);

// Clear WebView storage — synchronous
openfort.ClearStorage();
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
enum RecoveryMethod { PASSWORD, AUTOMATIC }

// Chain
enum ChainType { EVM, SVM }

// Account
enum AccountType { EOA, SMART_ACCOUNT, DELEGATED_ACCOUNT }

// OAuth providers
enum OAuthProvider { GOOGLE, TWITTER, APPLE, FACEBOOK, DISCORD, EPIC_GAMES, LINE }

// Sort ordering (for ListWalletsRequest)
enum SortOrdering { ASC, DESC }
```

## Namespaces

```csharp
using Openfort.OpenfortSDK;         // OpenfortSDK class
using Openfort.OpenfortSDK.Model;   // Request/Response models, enums
using Openfort.OpenfortSDK.Event;   // OnAuthEventDelegate, OpenfortAuthEvent
```
