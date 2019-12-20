import { BATCH_TIME, ZERO, TWO } from 'const'
import { DepositApiMock } from 'api/exchange/DepositApiMock'
import * as testHelpers from '../../testHelpers'
import Erc20ApiMock from 'api/erc20/Erc20ApiMock'
import { createFlux } from '../../data'
import { DepositApi } from 'api/exchange/DepositApiImpl'
import { Erc20Api } from 'api/erc20/Erc20ApiImpl'

const { USER_1, USER_2, TOKEN_1, TOKEN_2, TOKEN_3, TOKEN_4, TOKEN_5, TOKEN_6, AMOUNT, AMOUNT_SMALL } = testHelpers

jest.mock('api/erc20/Erc20ApiMock')

let instance: DepositApi
let mockErc20Api: Erc20Api

const ZERO_FLUX = createFlux()

beforeAll(() => {
  testHelpers.mockTimes()
})

beforeEach(() => {
  mockErc20Api = new Erc20ApiMock()
  instance = new DepositApiMock(
    {
      [USER_1]: {
        [TOKEN_1]: {
          balance: ZERO,
          pendingDeposits: { amount: ZERO, batchId: 0 },
          pendingWithdraws: { amount: ZERO, batchId: 0 },
        },
        [TOKEN_2]: {
          balance: AMOUNT,
          pendingDeposits: { amount: ZERO, batchId: 0 },
          pendingWithdraws: { amount: ZERO, batchId: 0 },
        },
        [TOKEN_4]: {
          balance: ZERO,
          pendingDeposits: { amount: AMOUNT, batchId: 1 },
          pendingWithdraws: { amount: AMOUNT, batchId: 1 },
        },
        [TOKEN_5]: {
          balance: AMOUNT,
          pendingDeposits: { amount: AMOUNT, batchId: testHelpers.BATCH_ID },
          pendingWithdraws: { amount: AMOUNT, batchId: testHelpers.BATCH_ID },
        },
        [TOKEN_6]: {
          balance: AMOUNT,
          pendingDeposits: { amount: AMOUNT_SMALL, batchId: 1 },
          pendingWithdraws: { amount: AMOUNT_SMALL, batchId: 1 },
        },
      },
    },
    mockErc20Api,
  )
})

describe('Basic view functions', () => {
  test('Get batch time', async () => {
    const batchTime = await instance.getBatchTime()
    expect(batchTime).toBe(BATCH_TIME)
  })

  test('Get current batch id (state index)', async () => {
    const batchId = await instance.getCurrentBatchId()
    expect(batchId).toBe(testHelpers.BATCH_ID)
  })

  test('Get seconds remaining in batch', async () => {
    const remainingSeconds = await instance.getSecondsRemainingInBatch()
    expect(remainingSeconds).toBe(BATCH_TIME - testHelpers.BATCH_SECOND)
  })
})

describe('Get balance', () => {
  test('Unknown user address', async () => {
    // GIVEN: A user that doesn't have any deposits

    // WHEN: We get the balance
    const balance = await instance.getBalance({ userAddress: USER_2, tokenAddress: TOKEN_1 })

    // THEN: The balance is zero
    expect(balance).toEqual(ZERO)
  })

  test('Unknown token', async () => {
    // GIVEN: A user that has deposits for some tokens, but not for TOKEN_3

    // WHEN: We get the balance for TOKEN_3
    const balance = await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_3 })

    // THEN: The balance is zero
    expect(balance).toEqual(ZERO)
  })

  test('Token with no balance', async () => {
    // GIVEN: A user that has balance zero for TOKEN_1

    // WHEN: We get the balance for TOKEN_1
    const balance = await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_1 })

    // THEN: The balance is zero
    expect(balance).toEqual(ZERO)
  })

  test('Token with balance', async () => {
    // GIVEN: A user that has balance for TOKEN_2

    // WHEN: We get the balance for TOKEN_2
    const balance = await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_2 })

    // THEN: The balance is AMOUNT
    expect(balance).toEqual(AMOUNT)
  })
})

describe('Get pending deposit amounts', () => {
  test('Unknown user address', async () => {
    // GIVEN: An user that hasn't deposit any tokens yet
    // WHEN: -

    // THEN: there's no pending deposits nor batchId
    expect(await instance.getPendingDeposit({ userAddress: USER_2, tokenAddress: TOKEN_1 })).toEqual(ZERO_FLUX)
  })

  test('Unknown token', async () => {
    // GIVEN: An user with no token balance for TOKEN_3
    // WHEN: -

    // THEN: there's no pending deposits nor batchId
    expect(await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO_FLUX)
  })

  test('No pending balance', async () => {
    // GIVEN: An user with no balance for TOKEN_2
    // WHEN: -

    // THEN: there's no pending deposits
    expect(await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_2 })).toEqual(ZERO_FLUX)
  })
})

describe('Get pending withdraw amounts', () => {
  test('Unknown user address', async () => {
    // GIVEN: An user that hasn't any tokens yet
    // WHEN: -

    // THEN: there's no pending withdraws nor batchId
    expect(await instance.getPendingWithdraw({ userAddress: USER_2, tokenAddress: TOKEN_1 })).toEqual(ZERO_FLUX)
  })

  test('Unknown token', async () => {
    // GIVEN: An user with no token balance for TOKEN_3
    // WHEN: -

    // THEN: there's no pending withdraws nor batchId
    expect(await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO_FLUX)
  })

  test('No pending balance', async () => {
    // GIVEN: An user with no balance for TOKEN_2
    // WHEN: -

    // THEN: there's no pending withdraws
    expect(await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_2 })).toEqual(ZERO_FLUX)
  })
})

describe('Deposit', () => {
  test('Unknown token', async () => {
    // GIVEN: An user with no token balance for TOKEN_3 and no pending deposits
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO)
    expect(await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO_FLUX)

    // WHEN: Deposits AMOUNT
    await instance.deposit({ userAddress: USER_1, tokenAddress: TOKEN_3, amount: AMOUNT })

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO)

    // THEN: There's a pending deposit of AMOUNT
    const { amount } = await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_3 })
    expect(amount).toEqual(AMOUNT)
  })

  test('No balance', async () => {
    // GIVEN: An user with no token balance for TOKEN_1 and no pending deposits
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO)
    expect(await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO_FLUX)

    // WHEN: Deposits AMOUNT
    await instance.deposit({ userAddress: USER_1, tokenAddress: TOKEN_1, amount: AMOUNT })

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO)

    // THEN: There's a pending deposit of AMOUNT
    const { amount } = await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_1 })
    expect(amount).toEqual(AMOUNT)
  })

  test('Applicable pending balance', async () => {
    // GIVEN: An user with no balance for TOKEN_4, and applicable pending deposits
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(ZERO)
    const { amount } = await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount).toEqual(AMOUNT)

    // WHEN: Deposits AMOUNT
    await instance.deposit({ userAddress: USER_1, tokenAddress: TOKEN_4, amount: AMOUNT })

    // THEN: The previous pending deposit is applied
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(AMOUNT)

    // THEN: There's a pending deposit of AMOUNT
    const { amount: amount2 } = await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount2).toEqual(AMOUNT)
  })

  test('Unapplicable pending balance', async () => {
    // GIVEN: An user with an unapplicable pending deposit for TOKEN_5
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_5 })).toEqual(AMOUNT)
    const { amount } = await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_5 })
    expect(amount).toEqual(AMOUNT)

    // WHEN: Deposits AMOUNT
    await instance.deposit({ userAddress: USER_1, tokenAddress: TOKEN_5, amount: AMOUNT })

    // THEN: There's still the same balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_5 })).toEqual(AMOUNT)

    // THEN: There's a pending deposit of AMOUNT + AMOUNT
    const { amount: amount2 } = await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_5 })
    expect(amount2).toEqual(AMOUNT.add(AMOUNT))
  })
})

describe('Request withdraw', () => {
  test('Unknown token', async () => {
    // GIVEN: An user with no token balance for TOKEN_3 and no pending withdraw
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO)
    expect(await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO_FLUX)

    // WHEN: Requesting a withdraw of AMOUNT
    await instance.requestWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_3, amount: AMOUNT })

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO)

    // THEN: There's a pending withdraw of AMOUNT
    const { amount } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_3 })
    expect(amount).toEqual(AMOUNT)
  })

  test('No balance', async () => {
    // GIVEN: An user with no token balance for TOKEN_1 and no pending withdraw
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO)
    expect(await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO_FLUX)

    // WHEN: Requesting a withdraw of AMOUNT
    await instance.requestWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_1, amount: AMOUNT })

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO)

    // THEN: There's a pending withdraw of AMOUNT
    const { amount } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_1 })
    expect(amount).toEqual(AMOUNT)
  })

  test('Increase previous withdraw request amount', async () => {
    // GIVEN: An user with no balance for TOKEN_4, and a previous pending withdraw of AMOUNT
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(ZERO)
    const { amount } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount).toEqual(AMOUNT)

    // WHEN: Requesting a withdraw of 2 * AMOUNT
    await instance.requestWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4, amount: AMOUNT.mul(TWO) })

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(ZERO)

    // THEN: There's a pending withdraw of 2 * AMOUNT
    const { amount: amount2 } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount2).toEqual(AMOUNT.mul(TWO))
  })

  test('Decrease previous withdraw request amount', async () => {
    // GIVEN: An user with no balance for TOKEN_4, and a previous pending withdraw of AMOUNT
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(ZERO)
    const { amount } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount).toEqual(AMOUNT)

    // WHEN: Requesting a withdraw of 2 * AMOUNT
    await instance.requestWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4, amount: AMOUNT.div(TWO) })

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(ZERO)

    // THEN: There's a pending withdraw of 2 * AMOUNT
    const { amount: amount2 } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount2).toEqual(AMOUNT.div(TWO))
  })
})

describe('Withdraw', () => {
  test('Unknown token', async () => {
    // GIVEN: An user with no token balance for TOKEN_3 and no pending withdraw
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO)
    expect(await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO_FLUX)

    // WHEN: Withdraw AMOUNT
    const withdrawPromise = instance.withdraw({ userAddress: USER_1, tokenAddress: TOKEN_3 })

    // THEN: The withdraw fails
    await expect(withdrawPromise).rejects.toBeTruthy()

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_3 })).toEqual(ZERO)

    // THEN: There's still no pending withdraw
    const { amount } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_3 })
    expect(amount).toEqual(ZERO)
  })

  test('No balance', async () => {
    // GIVEN: An user with no token balance for TOKEN_1 and no pending withdraw
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO)
    expect(await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO_FLUX)

    // WHEN: Withdraw AMOUNT
    const withdrawPromise = instance.withdraw({ userAddress: USER_1, tokenAddress: TOKEN_1 })

    // THEN: The withdraw fails
    await expect(withdrawPromise).rejects.toBeTruthy()

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO)

    // THEN: There's still no pending withdraw
    expect(await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_1 })).toEqual(ZERO_FLUX)
  })

  test('Settled withdraw request, but not balance', async () => {
    // GIVEN: An user with no balance for TOKEN_4, and a previous pending withdraw of AMOUNT
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(ZERO)
    const { amount } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount).toEqual(AMOUNT)

    // WHEN: Withdraw AMOUNT
    const withdrawPromise = instance.withdraw({ userAddress: USER_1, tokenAddress: TOKEN_4 })

    // THEN: The withdraw fails
    await expect(withdrawPromise).rejects.toBeTruthy()

    // THEN: There's still no balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_4 })).toEqual(ZERO)

    // THEN: There's still a withdraw request
    const { amount: amount2 } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_4 })
    expect(amount2).toEqual(AMOUNT)
  })

  test('Settled withdraw request', async () => {
    // GIVEN: An user with AMOUNT balance for TOKEN_6, and a previous pending withdraw of AMOUNT_SMALL
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_6 })).toEqual(AMOUNT)
    const { amount } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_6 })
    expect(amount).toEqual(AMOUNT_SMALL)

    // WHEN: Withdraw AMOUNT_SMALL
    await instance.withdraw({ userAddress: USER_1, tokenAddress: TOKEN_6 })

    // THEN: There remaining balance is AMOUNT - AMOUNT_SMALL
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_6 })).toEqual(AMOUNT.sub(AMOUNT_SMALL))

    // THEN: There's no pending withdraw anymore
    const { amount: amount2 } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_6 })
    expect(amount2).toEqual(ZERO)
  })

  test('Unsettled withdraw request', async () => {
    // GIVEN: An user with a non applicable withdraw request on TOKEN_5
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_5 })).toEqual(AMOUNT)
    const { amount, batchId } = await instance.getPendingDeposit({ userAddress: USER_1, tokenAddress: TOKEN_5 })
    expect(amount).toEqual(AMOUNT)
    expect(await instance.getCurrentBatchId()).toBeGreaterThanOrEqual(batchId)

    // WHEN: Withdraw AMOUNT
    const withdrawPromise = instance.withdraw({ userAddress: USER_1, tokenAddress: TOKEN_5 })

    // THEN: The withdraw fails
    await expect(withdrawPromise).rejects.toBeTruthy()

    // THEN: There's still the same balance
    expect(await instance.getBalance({ userAddress: USER_1, tokenAddress: TOKEN_5 })).toEqual(AMOUNT)

    // THEN: There's still the same withdraw request
    const { amount: amount2 } = await instance.getPendingWithdraw({ userAddress: USER_1, tokenAddress: TOKEN_5 })
    expect(amount2).toEqual(AMOUNT)
  })
})
