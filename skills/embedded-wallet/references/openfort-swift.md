---
name: openfort-swift
description: Setup and configure Openfort in iOS/Swift applications. Use this skill whenever implementing OFSDK, embedded wallet configuration, authentication flows, EIP-1193 provider, wallet recovery, OAuth with deep links, Sign in with Apple, SIWE, or initial project scaffolding with OpenfortSwift. Trigger on any mention of "Swift Openfort", "iOS Openfort", "OpenfortSwift", "OFSDK", "OFConfig.plist", "embeddedStatePublisher", "getEthereumProvider", "signMessage Swift", "iOS embedded wallet", or integrating Openfort into an iOS/Swift app.
---

# Openfort Swift SDK

Complete guide for setting up `OpenfortSwift` in iOS applications.

---

## Installation

Add via Swift Package Manager in Xcode. Package URL:
```
https://github.com/openfort-xyz/swift-sdk.git
```

Import in your Swift files:
```swift
import OpenfortSwift
```

## OFConfig.plist

Add `OFConfig.plist` to your Xcode project (select "Copy items if needed"):

| Key | Required | Description |
|-----|----------|-------------|
| `openfortPublishableKey` | **Yes** | `pk_test_...` or `pk_live_...` from dashboard |
| `shieldPublishableKey` | **Yes** | Shield publishable key from dashboard |
| `backendUrl` | No | Override backend API URL |
| `iframeUrl` | No | Override iframe environment URL |
| `shieldUrl` | No | Override Shield service URL |
| `debug` | **Yes** | Enable debug logging (boolean) |

## SDK Initialization

Initialize in `AppDelegate.swift` — the SDK reads configuration from `OFConfig.plist` automatically:

```swift
import UIKit
import OpenfortSwift

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        do {
            try OFSDK.setupSDK()
        } catch {
            print("Failed to initialize Openfort SDK: \(error)")
        }
        return true
    }
}
```

For SwiftUI apps, wire the AppDelegate via `@UIApplicationDelegateAdaptor`:

```swift
@main
struct MyApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}
```

### Third-Party Auth Setup

For Firebase, Supabase, or other third-party auth providers:

```swift
try OFSDK.setupSDK(
    thirdParty: .firebase,  // OFAuthProvider enum
    getAccessToken: {
        try await Auth.auth().currentUser?.getIDToken()
    }
)
```

Supported third-party providers: `.firebase`, `.supabase`, `.accelbyte`, `.lootlocker`, `.playfab`, `.oidc`, `.custom`

## Accessing the SDK

After initialization, use the singleton throughout your app:

```swift
let openfort = OFSDK.shared
```

All SDK methods are `async throws`.

## Embedded Wallet State

The wallet goes through states tracked via a Combine publisher:

```swift
enum OFEmbeddedState: Int {
    case none = 0                        // Initial SDK state
    case unauthenticated = 1             // Before user authentication
    case embeddedSignerNotConfigured = 2 // Before wallet configuration
    case creatingAccount = 3             // Creating new account for chainID
    case ready = 4                       // Wallet ready for use
}
```

Subscribe to state changes:

```swift
OFSDK.shared.embeddedStatePublisher.sink { state in
    switch state {
    case .ready:
        print("Wallet is ready")
    case .embeddedSignerNotConfigured:
        print("Need to configure wallet")
    case .none:
        print("No state yet")
    default:
        print("State: \(String(describing: state))")
    }
}
```

## Wallet Configuration (Recovery)

After authentication, configure the embedded wallet with a recovery method. This creates or recovers the wallet.

### Password Recovery

```swift
let chainId = 80002
let recoveryParams = OFRecoveryParamsDTO(
    recoveryMethod: .password,
    password: "user-password"
)
let account = try await OFSDK.shared.configure(
    params: OFEmbeddedAccountConfigureParams(
        chainId: chainId,
        recoveryParams: recoveryParams
    )
)
```

### Automatic Recovery

Requires an encryption session from your backend:

```swift
// 1. Fetch encryption session from your backend
let session = try await fetchEncryptionSession()

// 2. Configure with automatic recovery
let chainId = 80002
let recoveryParams = OFRecoveryParamsDTO(
    recoveryMethod: .automatic,
    encryptionSession: session
)
let account = try await OFSDK.shared.configure(
    params: OFEmbeddedAccountConfigureParams(
        chainId: chainId,
        recoveryParams: recoveryParams
    )
)
```

Backend endpoint example (returns `{ "session": "<session_id>" }`):

```swift
func fetchEncryptionSession() async throws -> String {
    let url = URL(string: "https://your-backend.com/api/protected-create-encryption-session")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONSerialization.data(withJSONObject: [:])
    let (data, _) = try await URLSession.shared.data(for: request)
    let decoded = try JSONDecoder().decode(EncryptionSessionResponse.self, from: data)
    return decoded.session
}

struct EncryptionSessionResponse: Decodable {
    let session: String
}
```

### Configure Parameters

```swift
struct OFEmbeddedAccountConfigureParams {
    public init(
        chainId: Int? = nil,
        recoveryParams: OFRecoveryParamsDTO,
        chainType: OFChainType? = nil,       // .evm | .svm
        accountType: OFAccountType? = nil     // .eoa | .smartAccount | .delegatedAccount
    )
}

struct OFRecoveryParamsDTO {
    public let recoveryMethod: OFRecoveryMethod  // .automatic | .password
    public let encryptionSession: String?
    public let password: String?
}
```

### Returns: OFEmbeddedAccount

```swift
struct OFEmbeddedAccount {
    public let id: String
    public let chainType: OFChainType        // .evm | .svm
    public let address: String
    public let createdAt: Int?
    public let implementationType: String?
    public let implementationAddress: String?
    public let factoryAddress: String?
    public let salt: String?
    public let accountType: OFAccountType    // .eoa | .smartAccount | .delegatedAccount
    public let recoveryMethod: OFRecoveryMethod?
    public let recoveryMethodDetails: OFRecoveryMethodDetails?
    public let chainId: Int?
    public let ownerAddress: String?         // @deprecated
    public let type: String?                 // @deprecated
}
```

### Change Recovery Method

```swift
try await OFSDK.shared.setRecoveryMethod(params: OFSetRecoveryMethodParams(
    previousRecovery: OFRecoveryParamsDTO(recoveryMethod: .password, password: "old-password"),
    newRecovery: OFRecoveryParamsDTO(recoveryMethod: .automatic, encryptionSession: session)
))
```

## Authentication

### Email & Password

```swift
// Sign up
let result = try await OFSDK.shared.signUpWithEmailPassword(
    params: OFSignUpWithEmailPasswordParams(
        email: "user@example.com",
        password: "password123",
        options: OFSignUpWithEmailPasswordOptionsParams(data: ["name": "John"])
    )
)

// If email verification required
if result?.action == "verify_email" {
    try await OFSDK.shared.requestEmailVerification(
        params: OFRequestEmailVerificationParams(email: email, redirectUrl: "myapp://verify")
    )
}

// Log in
let result = try await OFSDK.shared.logInWithEmailPassword(
    params: OFLogInWithEmailPasswordParams(email: email, password: password)
)
```

### Verify Email

```swift
// OFVerifyEmailParams(token: String, callbackURL: String? = nil)
try await OFSDK.shared.verifyEmail(
    params: OFVerifyEmailParams(token: verificationToken)
)
```

### Email OTP

```swift
// Request OTP
try await OFSDK.shared.requestEmailOtp(params: OFRequestEmailOtpParams(email: email))

// Verify OTP
let result = try await OFSDK.shared.logInWithEmailOtp(
    params: OFLogInWithEmailOtpParams(email: email, otp: otpCode)
)
```

### Phone OTP

```swift
// Request OTP
try await OFSDK.shared.requestPhoneOtp(params: OFRequestPhoneOtpParams(phoneNumber: "+1234567890"))

// Log in with OTP
let result = try await OFSDK.shared.logInWithPhoneOtp(
    params: OFLogInWithPhoneOtpParams(phoneNumber: "+1234567890", otp: otpCode)
)

// Link phone to existing account
let result = try await OFSDK.shared.linkPhoneOtp(
    params: OFLinkPhoneOtpParams(phoneNumber: "+1234567890", otp: otpCode)
)
```

### OAuth (Google, etc.)

```swift
// 1. Initiate OAuth — opens browser
let response = try await OFSDK.shared.initOAuth(
    params: OFInitOAuthParams(
        provider: "google",
        options: ["redirectTo": AnyCodable("myapp://login")]
    )
)
if let urlString = response?.url, let url = URL(string: urlString) {
    await UIApplication.shared.open(url)
}

// 2. Handle redirect in .onOpenURL or SceneDelegate
// URL format: myapp://login?token=...&user_id=...
let params = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
let token = params?.first(where: { $0.name == "token" })?.value
let userId = params?.first(where: { $0.name == "user_id" })?.value

// 3. Store credentials
try await OFSDK.shared.storeCredentials(
    params: OFStoreCredentialsParams(token: token!, userId: userId!)
)
```

### Guest

```swift
let result = try await OFSDK.shared.signUpGuest()
```

Guest accounts cannot merge into existing accounts — they can only be upgraded.

### Sign in with Apple

```swift
// 1. Get Apple ID credential (ASAuthorizationAppleIDProvider or AppleAuthManager)
// 2. Extract idToken from credential
let idToken = String(data: credential.identityToken!, encoding: .utf8)!

// 3. Authenticate with Openfort
let result = try await OFSDK.shared.loginWithIdToken(
    params: OFLoginWithIdTokenParams(provider: "apple", token: idToken)
)
```

Requires "Sign in with Apple" capability in Xcode and provider enabled in Openfort Dashboard.

### SIWE (External Wallet Authentication)

```swift
// 1. Initialize SIWE
let siweResponse = try await OFSDK.shared.initSIWE(
    params: OFInitSIWEParams(address: walletAddress)
)
// siweResponse.address, siweResponse.nonce

// 2. Get signature from external wallet (MetaMask, Coinbase, WalletConnect)
let signature = try await getSignatureFromWallet(message)

// 3. Authenticate
let result = try await OFSDK.shared.authenticateWithSIWE(
    params: OFAuthenticateWithSIWEParams(
        signature: signature,
        message: message,
        walletClientType: "MetaMask",
        connectorType: "metaMask"
    )
)
```

### SIWE Login (Direct)

Alternative to `initSIWE` + `authenticateWithSIWE` — single-step SIWE login:

```swift
let result = try await OFSDK.shared.loginWithSiwe(
    params: OFLoginWithSiweParams(
        signature: signature,
        message: message,
        walletClientType: "MetaMask",
        connectorType: "metaMask",
        address: walletAddress
    )
)
```

### Link External Wallet (SIWE)

```swift
// 1. Initialize SIWE link
let siweResponse = try await OFSDK.shared.initLinkSiwe(
    params: OFInitLinkSiweParams(address: walletAddress)
)

// 2. Get signature, then link
let result = try await OFSDK.shared.linkWithSiwe(
    params: OFLinkWithSiweParams(
        signature: signature,
        message: message,
        walletClientType: "MetaMask",
        connectorType: "metaMask",
        address: walletAddress,
        chainId: 1
    )
)
```

### Link / Unlink OAuth Provider

```swift
// Initialize OAuth linking
let linkResponse = try await OFSDK.shared.initLinkOAuth(
    params: OFInitLinkOAuthParams(
        provider: "google",
        authToken: accessToken,
        options: ["redirectTo": AnyCodable("myapp://link")]
    )
)

// Poll for OAuth completion
let result = try await OFSDK.shared.poolOAuth(key: linkResponse!.key!)

// Unlink OAuth provider
let unlinkResult = try await OFSDK.shared.unlinkOAuth(
    params: OFUnlinkOAuthParams(provider: "google", authToken: accessToken)
)
```

### Link / Unlink External Wallet

```swift
// Link wallet
let result = try await OFSDK.shared.linkWallet(
    params: OFLinkWalletParams(
        signature: sig, message: msg,
        walletClientType: "MetaMask", connectorType: "metaMask",
        authToken: accessToken
    )
)

// Unlink wallet
let unlinkResult = try await OFSDK.shared.unlinkWallet(
    params: OFUnlinkWalletParams(address: "0x...", authToken: accessToken)
)
```

### Add Email

```swift
let result = try await OFSDK.shared.addEmail(
    params: OFAddEmailParams(email: "new@example.com", callbackURL: "myapp://verify")
)
// result.status: Bool, result.message: String?
```

### Verify Email OTP

```swift
try await OFSDK.shared.verifyEmailOtp(
    params: OFVerifyEmailOtpParams(email: email, otp: otpCode)
)
```

### Auth Provider Enum

```swift
enum OFAuthProvider: String {
    case email, wallet, apple, google, twitter, discord,
         facebook, epic_games, accelbyte, firebase,
         lootlocker, playfab, supabase, custom, oidc
}
```

## User Session

```swift
// Get access token
let token = try await OFSDK.shared.getAccessToken()  // String?

// Get current user
let user = try await OFSDK.shared.getUser()
// user.id, user.email, user.createdAt, user.linkedAccounts

// Log out
try await OFSDK.shared.logOut()
```

### Password Reset

```swift
// Request reset email
try await OFSDK.shared.requestResetPassword(
    params: OFRequestResetPasswordParams(email: email, redirectUrl: "myapp://reset")
)

// Complete reset (token from redirect link)
try await OFSDK.shared.resetPassword(
    params: OFResetPasswordParams(password: newPassword, token: resetToken)
)
```

## Ethereum Provider (EIP-1193)

Get a standard EIP-1193 provider for JSON-RPC requests:

```swift
let provider = try await OFSDK.shared.getEthereumProvider(
    params: OFGetEthereumProviderParams()
)
```

With gas sponsorship policy:

```swift
let provider = try await OFSDK.shared.getEthereumProvider(
    params: OFGetEthereumProviderParams(policy: "YOUR_POLICY_ID")
)
```

### Provider Parameters

```swift
struct OFGetEthereumProviderParams {
    public let policy: String?              // Gas sponsorship policy ID
    public let chains: [Int: String]?       // Chain ID to RPC URL mapping
    public let providerInfo: ProviderInfo?  // EIP-6963 provider metadata
    public let announceProvider: Bool?      // Announce via EIP-6963
}
```

### Send Transaction

```swift
let tx: [String: String] = [
    "to": "0x...",
    "from": "0x...",
    "value": "0x8ac7230489e80000",  // 10 ETH in wei hex
    "data": "0x",
]
let request = RPCRequest<[[String: String]]>(
    id: 1, jsonrpc: "2.0",
    method: "eth_sendTransaction",
    params: [tx]
)
provider.send(request: request) { (resp: Web3Response<String>) in
    if let txHash = resp.result {
        print("Transaction: \(txHash)")
    }
}
```

### Sponsored Transaction

Pass `policy` to `getEthereumProvider` and omit `gas`/`gasPrice` from the transaction:

```swift
let provider = try await OFSDK.shared.getEthereumProvider(
    params: OFGetEthereumProviderParams(policy: "YOUR_POLICY_ID")
)
let tx: [String: String] = [
    "to": "0x...",
    "from": "0x...",
    "value": "0x8ac7230489e80000",
    "data": "0x",
]
// No gas/gasPrice — sponsored by policy
```

### Switch Chain

```swift
let request = RPCRequest<[[String: String]]>(
    id: 1, jsonrpc: "2.0",
    method: "wallet_switchEthereumChain",
    params: [["chainId": "0x14a34"]]  // Base Sepolia
)
provider.send(request: request) { (resp: Web3Response<String>) in
    // Chain switched
}
```

### Get Current Chain

```swift
let request = RPCRequest<[String]>(
    id: 1, jsonrpc: "2.0",
    method: "eth_chainId",
    params: []
)
provider.send(request: request) { (resp: Web3Response<String>) in
    if let hex = resp.result {
        let chainId = Int(hex.dropFirst(2), radix: 16) ?? -1
    }
}
```

## Sign Message (EIP-191)

```swift
let signature = try await OFSDK.shared.signMessage(
    params: OFSignMessageParams(message: "Hello World!")
)

// With options
let signature = try await OFSDK.shared.signMessage(
    params: OFSignMessageParams(
        message: "Hello World!",
        options: OFSignMessageParams.Options(hashMessage: true, arrayifyMessage: false)
    )
)
```

## Sign Typed Data (EIP-712)

```swift
let domain = EIP712Domain(
    name: "Openfort",
    version: "0.5",
    chainId: 80002,
    verifyingContract: "0x..."
)
let types: [String: [EIP712TypeField]] = [
    "Mail": [
        EIP712TypeField(name: "from", type: "Person"),
        EIP712TypeField(name: "to", type: "Person"),
        EIP712TypeField(name: "content", type: "string")
    ],
    "Person": [
        EIP712TypeField(name: "name", type: "string"),
        EIP712TypeField(name: "wallet", type: "address")
    ]
]
let message = EIP712MailMessage(
    from: EIP712PersonMessage(name: "Alice", wallet: "0x..."),
    to: EIP712PersonMessage(name: "Bob", wallet: "0x..."),
    content: "Hello!"
)
let signature = try await OFSDK.shared.signTypedData(
    params: OFSignTypedDataParams(domain: domain, types: types, message: message)
)
```

## Export Private Key

```swift
let privateKey = try await OFSDK.shared.exportPrivateKey()
```

## Embedded Account Management

```swift
// Get current embedded account
let account = try await OFSDK.shared.get()
// Returns OFEmbeddedAccount?

// List all embedded accounts
let accounts = try await OFSDK.shared.list()
// Returns [OFEmbeddedAccount]?

// Create a new embedded account
let account = try await OFSDK.shared.create(
    params: OFEmbeddedAccountCreateParams(
        accountType: .smartAccount,
        chainType: .evm,
        chainId: 80002,
        recoveryParams: OFRecoveryParamsDTO(recoveryMethod: .password, password: "pw")
    )
)

// Recover an existing embedded account
let account = try await OFSDK.shared.recover(
    params: OFEmbeddedAccountRecoverParams(
        account: "account-id",
        recoveryParams: OFRecoveryParamsDTO(recoveryMethod: .password, password: "pw")
    )
)
```

## Token Management

```swift
// Get access token
let token = try await OFSDK.shared.getAccessToken()  // String?

// Validate and optionally refresh the token
try await OFSDK.shared.validateAndRefreshToken(forceRefresh: true)
```

## Session Signature Request

```swift
let result = try await OFSDK.shared.sendSignatureSessionRequest(
    params: OFSendSignatureSessionRequestParams(
        sessionId: "ses_...",
        signature: signature,
        optimistic: false
    )
)
// Returns OFSessionResponse?
```

## Sign Transaction Intent

```swift
let result = try await OFSDK.shared.sendSignatureTransactionIntentRequest(
    params: OFSendSignatureTransactionIntentRequestParams(
        transactionIntentId: "ti_...",
        signableHash: hash,
        signature: signature,
        optimistic: false
    )
)
// Returns OFTransactionIntentResponse
```

## Key Types

```swift
// Recovery
enum OFRecoveryMethod: String { case automatic, password }

// Chain
enum OFChainType: String { case evm = "EVM", svm = "SVM" }

// Account
enum OFAccountType: String {
    case eoa = "Externally Owned Account"
    case smartAccount = "Smart Account"
    case delegatedAccount = "Delegated Account"
}

// Wallet state
enum OFEmbeddedState: Int {
    case none = 0, unauthenticated = 1,
         embeddedSignerNotConfigured = 2,
         creatingAccount = 3, ready = 4
}

// Auth providers (used in setupSDK thirdParty and loginWithIdToken)
enum OFAuthProvider: String {
    case email, wallet, apple, google, twitter, discord,
         facebook, epic_games, accelbyte, firebase,
         lootlocker, playfab, supabase, custom, oidc
}

// OAuth providers (used in initOAuth)
enum OFOAuthProvider: String {
    case google, twitter, apple, facebook, discord,
         epicGames = "epic_games", line
}
```
