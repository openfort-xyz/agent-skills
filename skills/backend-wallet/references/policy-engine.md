# Policy Engine

Policies define rules that control which operations are allowed or rejected. They are evaluated server-side before any signing or transaction execution.

**Key concepts:**
- **Scope**: `'project'` (all accounts) or `'account'` (single account)
- **Priority**: Higher priority policies evaluated first
- **Fail-closed**: No matching rule = operation rejected
- **Rules**: Each policy has 1-10 rules with `action` (`'accept'` | `'reject'`), `operation`, and `criteria` (AND logic)

## Create Policy

```ts
const policy = await openfort.policies.create({
  scope: 'project',
  description: 'Allow USDC transfers under 10k on Base',
  enabled: true,
  priority: 10,
  rules: [
    {
      action: 'accept',
      operation: 'sendEvmTransaction',
      criteria: [
        { type: 'evmNetwork', operator: 'in', chainIds: [8453] },
        { type: 'evmAddress', operator: 'in', addresses: ['0xUSDC_CONTRACT'] },
        { type: 'ethValue', operator: '<=', ethValue: '10000000000' },
      ],
    },
  ],
})
```

## Policy CRUD

```ts
// List policies
const policies = await openfort.policies.list({ scope: 'project', enabled: true })

// Get by ID
const policy = await openfort.policies.get('ply_...')

// Update (replaces all rules)
await openfort.policies.update('ply_...', {
  enabled: false,
  rules: [/* new rules */],
})

// Delete (soft delete)
await openfort.policies.delete('ply_...')

// Dry-run evaluation — check if an operation would be allowed without executing
const decision = await openfort.policies.evaluate({ /* operation details */ })
```

## EVM Operations & Criteria

**Operations:** `signEvmTransaction`, `sendEvmTransaction`, `signEvmTypedData`, `signEvmMessage`, `signEvmHash`, `sponsorEvmTransaction`

| Criteria Type | Operators | Fields |
|------|-----------|--------|
| `ethValue` | `<=`, `>=`, `<`, `>` | `ethValue: string` (wei) |
| `evmAddress` | `in`, `not in` | `addresses: Address[]` |
| `evmNetwork` | `in`, `not in` | `chainIds: number[]` |
| `evmData` | `in`, `not in`, `<`, `<=`, `>`, `>=`, `==`, `match` | `abi: string` (JSON ABI), `functionName: string`, `args?: Record<string, unknown>` |
| `evmMessage` | `match` | `pattern: string` (RE2 regex) |
| `evmTypedDataVerifyingContract` | `in`, `not in` | `addresses: Address[]` |
| `evmTypedDataField` | `in`, `<=`, `match` | `fieldPath: string`, `values?: string[]` (for `in`), `value?: string` (for `<=`/`match`) |

## Solana Operations & Criteria

**Operations:** `signSolTransaction`, `sendSolTransaction`, `signSolMessage`, `sponsorSolTransaction`

| Criteria Type | Operators | Fields |
|------|-----------|--------|
| `solAddress` | `in`, `not in` | `addresses: string[]` (base58) |
| `solValue` | `<=`, `>=` | `value: string` (lamports) |
| `splAddress` | `in`, `not in` | `addresses: string[]` (base58) |
| `splValue` | `<=`, `>=` | `value: string` (token units) |
| `mintAddress` | `==`, `in` | `addresses: string[]` (base58 mint addresses) |
| `programId` | `in`, `not in` | `programIds: string[]` (base58) |
| `solNetwork` | `in`, `not in` | `networks: ('mainnet-beta' \| 'devnet' \| 'testnet')[]` |
| `solMessage` | `match` | `pattern: string` (RE2 regex) |
| `solData` | `in`, `not in`, `<=`, `>=`, `==`, `match` | `idl: string` (Anchor IDL JSON), `instructionName: string`, `args?: Record<string, unknown>` |

## Validation Schemas

The SDK exports Zod schemas for client-side validation before API calls:

```ts
import {
  CreatePolicyBodySchema,
  UpdatePolicyBodySchema,
  RuleSchema,
} from '@openfort/openfort-node'

// Validate before sending
const parsed = CreatePolicyBodySchema.parse(myPolicyInput)
```
