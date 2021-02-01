import { RawOrder } from 'api/operator'
import { getOrderStatus } from 'api/operator/utils'

import { mockTimes, DATE } from '../../testHelpers'

// TODO: add to test data and use it everywhere
const BASE_ORDER: RawOrder = {
  creationDate: '2021-01-20T23:15:07.892538607Z',
  owner: '0x5b0abe214ab7875562adee331deff0fe1912fe42',
  uid: 'asdasdasd',
  buyAmount: '0',
  executedBuyAmount: '0',
  sellAmount: '0',
  executedSellAmount: '0',
  feeAmount: '0',
  executedFeeAmount: '0',
  invalidated: false,
  sellToken: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  buyToken: '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735',
  validTo: 0,
  appData: 0,
  kind: 'sell',
  partiallyFillable: false,
  signature:
    '0x04dca25f59e9ac744c4093530a38f1719c4e0b1ce8e4b68c8018b6b05fd4a6944e1dcf2a009df2d5932f7c034b4a24da0999f9309dd5108d51d54236b605ed991c',
}

function _getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

function _getPastTimestamp(): number {
  return Math.floor(DATE.getTime() / 1000) - 1
}

// mockTimes set's Date.now() to DATE const in the test context
beforeEach(mockTimes)

describe('Filled status', () => {
  describe('Buy order', () => {
    test('Filled, within epsilon', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'buy', buyAmount: '10000', executedBuyAmount: '9999' }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, exact amount', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'buy', buyAmount: '100', executedBuyAmount: '100' }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, surplus', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'buy', buyAmount: '1000', executedBuyAmount: '1001' }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, not yet expired', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'buy',
        buyAmount: '100',
        executedBuyAmount: '100',
        validTo: _getCurrentTimestamp(),
      }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, sell amount does not affect output', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'buy',
        buyAmount: '100',
        executedBuyAmount: '100',
        sellAmount: '100',
        executedSellAmount: '1100',
      }

      expect(getOrderStatus(order)).toEqual('filled')
    })
  })
  describe('Sell order', () => {
    test('Filled, within epsilon', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'sell', sellAmount: '10000', executedSellAmount: '9999' }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, exact amount', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'sell', sellAmount: '100', executedSellAmount: '100' }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, surplus', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'sell', sellAmount: '1000', executedSellAmount: '1001' }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, not yet expired', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'sell',
        sellAmount: '100',
        executedSellAmount: '100',
        validTo: _getCurrentTimestamp(),
      }

      expect(getOrderStatus(order)).toEqual('filled')
    })
    test('Filled, buy amount does not affect output', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'sell',
        sellAmount: '100',
        executedSellAmount: '100',
        buyAmount: '100',
        executedBuyAmount: '1100',
      }

      expect(getOrderStatus(order)).toEqual('filled')
    })
  })
})

describe('Partially filled status', () => {
  describe('Buy order', () => {
    test('Partially filled, on the border to be considered filled', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'buy', buyAmount: '10000', executedBuyAmount: '9998' }

      expect(getOrderStatus(order)).toEqual('partially filled')
    })
    test('Partially filled', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'buy', buyAmount: '10000', executedBuyAmount: '11' }

      expect(getOrderStatus(order)).toEqual('partially filled')
    })
    test('Partially filled, sell amount does not affect output', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'buy',
        buyAmount: '10000',
        executedBuyAmount: '11',
        sellAmount: '10000',
        executedSellAmount: '123',
      }

      expect(getOrderStatus(order)).toEqual('partially filled')
    })
  })
  describe('Sell order', () => {
    test('Partially filled, on the border to be considered filled', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'sell', sellAmount: '10000', executedSellAmount: '9998' }

      expect(getOrderStatus(order)).toEqual('partially filled')
    })
    test('Partially filled', () => {
      const order: RawOrder = { ...BASE_ORDER, kind: 'sell', sellAmount: '10000', executedSellAmount: '11' }

      expect(getOrderStatus(order)).toEqual('partially filled')
    })
    test('Partially filled, buy amount does not affect output', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'sell',
        sellAmount: '10000',
        executedSellAmount: '11',
        buyAmount: '10000',
        executedBuyAmount: '20',
      }

      expect(getOrderStatus(order)).toEqual('partially filled')
    })
  })
})

describe('Expired status', () => {
  describe('Buy order', () => {
    test('Expired', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'buy',
        buyAmount: '10000',
        executedBuyAmount: '0',
        validTo: _getPastTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('expired')
    })
  })
  describe('Sell order', () => {
    test('Expired', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'sell',
        sellAmount: '10000',
        executedSellAmount: '0',
        validTo: _getPastTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('expired')
    })
  })
})

describe('Open status', () => {
  describe('Buy order', () => {
    test('Open, no fills', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'buy',
        buyAmount: '10000',
        executedBuyAmount: '0',
        validTo: _getCurrentTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('open')
    })
    test('Open, with partial fills', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'buy',
        buyAmount: '10000',
        executedBuyAmount: '10',
        validTo: _getCurrentTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('open')
    })
    test('Open, sell amount does not affect output', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'buy',
        buyAmount: '10000',
        executedBuyAmount: '10',
        sellAmount: '10000',
        executedSellAmount: '123',
        validTo: _getCurrentTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('open')
    })
  })
  describe('Sell order', () => {
    test('Open, no fills', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'sell',
        sellAmount: '10000',
        executedSellAmount: '0',
        validTo: _getCurrentTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('open')
    })
    test('Open, with partial fills', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'sell',
        sellAmount: '10000',
        executedSellAmount: '10',
        validTo: _getCurrentTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('open')
    })
    test('Open, buy amount does not affect output', () => {
      const order: RawOrder = {
        ...BASE_ORDER,
        kind: 'sell',
        sellAmount: '10000',
        executedSellAmount: '10',
        buyAmount: '10000',
        executedBuyAmount: '323',
        validTo: _getCurrentTimestamp(),
      }
      expect(getOrderStatus(order)).toEqual('open')
    })
  })
})
