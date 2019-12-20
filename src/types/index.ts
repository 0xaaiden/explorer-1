import BN from 'bn.js'
import { TransactionReceipt } from 'web3-core'

export type Command = () => void
export type Mutation<T> = (original: T) => T

export enum Network {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
}

export interface MinimalTokenDetails {
  address: string
  symbol?: string
  name?: string
  decimals: number
}

export interface TokenDetails extends MinimalTokenDetails {
  id: number
  addressMainnet?: string
  image?: string
}

export interface TokenBalanceDetails extends TokenDetails {
  exchangeBalance: BN
  pendingDeposit: PendingFlux
  pendingWithdraw: PendingFlux
  walletBalance: BN
  claimable: boolean
  enabled: boolean
  totalExchangeBalance: BN
}

export interface TokenList {
  getTokens: (networkId: number) => TokenDetails[]
}

export interface PendingFlux {
  amount: BN
  batchId: number
}

export interface BalanceState {
  balance: BN
  pendingDeposits: PendingFlux
  pendingWithdraws: PendingFlux
}

export interface TxOptionalParams {
  onSentTransaction?: (transactionHash: string) => void
}

export type Receipt = TransactionReceipt

export interface Order {
  buyTokenId: number
  sellTokenId: number
  validFrom: number
  validUntil: number
  priceNumerator: BN
  priceDenominator: BN
  remainingAmount: BN
}

export interface AuctionElement extends Order {
  user: string
  sellTokenBalance: BN
  id: string // string because we might need natural ids
}

export interface PlaceOrderParams {
  userAddress: string
  buyTokenId: number
  sellTokenId: number
  validUntil: number
  buyAmount: BN
  sellAmount: BN
}
