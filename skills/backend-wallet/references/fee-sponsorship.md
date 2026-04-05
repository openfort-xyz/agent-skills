# Gas Sponsorship (Fee Sponsorship)

Gasless transactions require a **two-step setup**: create a policy (rules), then create a fee sponsorship (strategy) linked to that policy. This can be done via the SDK or the [Openfort Dashboard](https://dashboard.openfort.io).

## Strategy Types

| Strategy | Description |
|----------|-------------|
| `pay_for_user` | Developer fully sponsors gas — user pays nothing |
| `charge_custom_tokens` | User pays in ERC-20 tokens (fixed or dynamic exchange rate) |
| `fixed_rate` | User pays a fixed token amount per transaction |

## Create via SDK (Programmatic)

```ts
// Step 1: Create a policy with criteria rules
const policy = await openfort.policies.create({
  scope: 'project',          // 'project' (all accounts) or 'account' (single account)
  description: 'Sponsor gas on Base for USDC contract',
  rules: [{
    action: 'accept',
    operation: 'sponsorEvmTransaction',
    criteria: [
      { type: 'evmNetwork', operator: 'in', chainIds: [8453] },
      { type: 'evmAddress', operator: 'in', addresses: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'] },
    ],
  }],
})

// Step 2: Create a fee sponsorship linked to that policy
const sponsorship = await openfort.feeSponsorship.create({
  name: 'Base USDC Gas Sponsorship',
  strategy: { sponsorSchema: 'pay_for_user' },
  policyId: policy.id,
})

// Step 3: Use sponsorship ID in transactions
await openfort.accounts.evm.backend.sendTransaction({
  account,
  chainId: 8453,
  interactions: [{ to: '0x...', value: '0', data: '0x...' }],
  policy: sponsorship.id,  // pol_... from sponsorship
})
```

## Create via Dashboard

1. Go to [Openfort Dashboard](https://dashboard.openfort.io) → **Policies**
2. Create a policy with your desired criteria rules
3. Go to **Fee Sponsorship** → Create and link to the policy
4. Copy the fee sponsorship ID (`pol_...`)
5. Use it in your code:

```ts
await openfort.accounts.evm.backend.sendTransaction({
  account,
  chainId: 84532,
  interactions: [{ to: '0x...', value: '0', data: '0x' }],
  policy: process.env.OPENFORT_FEE_SPONSORSHIP_ID!, // pol_... from dashboard
})
```

> **Auto-discovery**: When no explicit `policy` is passed to `sendTransaction`, project-scoped fee sponsorships are auto-discovered and the first matching one is applied.

## Fee Sponsorship CRUD

```ts
// List
const sponsorships = await openfort.feeSponsorship.list()

// Get
const sponsorship = await openfort.feeSponsorship.get('pol_...')

// Update
await openfort.feeSponsorship.update('pol_...', { name: 'New Name' })

// Enable / Disable
await openfort.feeSponsorship.disable('pol_...')
await openfort.feeSponsorship.enable('pol_...')

// Delete (soft delete)
await openfort.feeSponsorship.delete('pol_...')
```

## Charge Custom Tokens Strategy

```ts
const sponsorship = await openfort.feeSponsorship.create({
  name: 'Pay gas with USDC',
  strategy: {
    sponsorSchema: 'charge_custom_tokens',
    tokenContract: 'con_...',        // Contract ID from dashboard
    tokenContractAmount: '1000000',  // Amount in token base units
  },
  policyId: policy.id,
})
```
