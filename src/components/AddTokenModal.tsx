import React, { useState, useCallback, useRef, useEffect } from 'react'
import { toChecksumAddress } from 'web3-utils'
import Modali, { useModali, ModalHook } from 'modali'
import { AddTokenToListParams, addTokenToList, isTokenAddedSuccess, getTokenFromExchangeByAddress } from 'services'
import { toast } from 'toastify'
import { safeFilledToken, logDebug } from 'utils'
import { TokenDetails } from 'types'
import TokenImg from './TokenImg'
import styled from 'styled-components'
import { tokenListApi } from 'api'

// const addTokenFromInput = async ({ networkId, tokenAddress }: AddTokenToListParams): Promise<TokenDetails | null> => {
//   try {
//     const tokenAddedResult = await addTokenToList({ networkId, tokenAddress })

//     if (!isTokenAddedSuccess(tokenAddedResult)) {
//       toast.warn(tokenAddedResult.error)
//       throw new Error(tokenAddedResult.error)
//     }

//     const { symbol: tokenDisplayName } = safeFilledToken(tokenAddedResult.token)

//     toast.success(`The token ${tokenDisplayName} has been enabled for trading`)
//     return tokenAddedResult.token
//   } catch (error) {
//     logDebug('Error adding token', tokenAddress, error)
//     toast.error(`Failed to add token at address ${tokenAddress} to token list`)
//     throw error
//   }
// }
const addTokenFromInput = async (
  { networkId, tokenAddress }: AddTokenToListParams,
  tokenPromised: Promise<TokenDetails | null>,
): Promise<TokenDetails | null> => {
  try {
    const token = await tokenPromised

    if (token) {
      logDebug('Added new Token to userlist', token)

      tokenListApi.addToken({ token, networkId })
    } else {
      const error = `Token at address ${tokenAddress} not available in Exchange contract`
      toast.warn(error)
      throw new Error(error)
    }

    const { symbol: tokenDisplayName } = safeFilledToken(token)

    toast.success(`The token ${tokenDisplayName} has been enabled for trading`)
    return token
  } catch (error) {
    logDebug('Error adding token', tokenAddress, error)
    // toast.error(`Failed to add token at address ${tokenAddress} to token list`)
    throw error
  }
}

export const ModalBodyWrapper = styled.div`
  p {
    line-height: 1.8;
  }

  min-height: 15rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

interface TokenAddConfirmationProps {
  tokenAddress: string
  networkId: number
}

const TokenAddConfirmation: React.FC<TokenAddConfirmationProps> = ({ tokenAddress }) => {
  return (
    <ModalBodyWrapper>
      <div>
        <p>Do you want to add {tokenAddress} to your local list of tokens?</p>
      </div>
    </ModalBodyWrapper>
  )
}

interface TokenAddResultProps {
  token: TokenDetails
}

const TokenDisplay = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  grid-template-areas:
    'image symbol'
    'image name';

  .tokenImage {
    grid-area: image;
    height: 5em;
    width: 5em;
  }

  .tokenSymbol {
    grid-area: symbol;
  }

  .tokenName {
    grid-area: name;
  }
`

const CenteredContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;

  ${TokenDisplay} {
    margin: auto;
  }
`

const TokeAddResult: React.FC<TokenAddResultProps> = ({ token }) => {
  return (
    <ModalBodyWrapper>
      <CenteredContent>
        <h2>Added token</h2>
        <TokenDisplay>
          <TokenImg src={token.image} alt={token.name} className="tokenImage" />
          <div className="tokenSymbol">
            <strong>{token.symbol}</strong>
          </div>
          <div className="tokenName">{token.name}</div>
        </TokenDisplay>
      </CenteredContent>
    </ModalBodyWrapper>
  )
}

interface ErrorProps {
  error: string
}

const ErrorDisplay: React.FC<ErrorProps> = ({ error }) => {
  return (
    <ModalBodyWrapper>
      <p>{error}</p>
    </ModalBodyWrapper>
  )
}

interface GenerateMessageParams extends TokenAddConfirmationProps {
  token: TokenDetails | null
  error: Error | null
}

const generateMessage = ({ token, tokenAddress, networkId, error }: GenerateMessageParams): React.ReactNode => {
  if (error) return <ErrorDisplay error={error.message} />
  if (token) return <TokeAddResult token={token} />
  if (tokenAddress && networkId) return <TokenAddConfirmation tokenAddress={tokenAddress} networkId={networkId} />
  return null
}

type PromiseResolve<T> = (value: T | PromiseLike<T>) => void
type PromiseReject = (reason?: unknown) => void

interface Deferred<T> {
  promise: Promise<T>
  resolve: PromiseResolve<T>
  reject: PromiseReject
}
const createDeferredPromise = <T,>(): Deferred<T> => {
  let resolve: PromiseResolve<T> = () => void 0
  let reject: PromiseReject = () => void 0

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve,
    reject,
  }
}

interface UseAddTokenModalResult {
  addTokenToList: (params: TokenAddConfirmationProps) => Promise<boolean>
  modalProps: ModalHook
}

export const useAddTokenModal = (): UseAddTokenModalResult => {
  const [networkId, setNetworkId] = useState(0)
  const [tokenAddress, setTokenAddress] = useState('')

  const result = useRef<Deferred<boolean>>()
  const prefetchToken = useRef<Promise<TokenDetails | null>>(Promise.resolve(null))
  const [token, setToken] = useState<TokenDetails | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const [modalProps, toggleModal] = useModali({
    animated: true,
    centered: true,
    title: 'Are you sure?',
    message: generateMessage({ token, tokenAddress, networkId, error }),
    buttons: [
      token || error ? (
        <>&nbsp;</>
      ) : (
        <Modali.Button
          label="Cancel"
          key="no"
          isStyleCancel
          onClick={(): void => {
            result.current?.resolve(false)
          }}
        />
      ),
      <Modali.Button
        label={token || error ? 'Done' : 'Confirm'}
        key="yes"
        isStyleDefault
        onClick={(): void => {
          if (token) {
            result.current?.resolve(true)
          } else if (error) {
            result.current?.resolve(false)
          } else {
            addTokenFromInput({ networkId, tokenAddress }, prefetchToken.current).then(setToken, setError)
          }
        }}
      />,
    ],
  })
  ;(window as any).toggleModal = toggleModal

  const toggleRef = useRef(toggleModal)
  toggleRef.current = toggleModal

  const addTokenToList = useCallback(({ networkId, tokenAddress }: TokenAddConfirmationProps): Promise<boolean> => {
    setNetworkId(networkId)
    setTokenAddress(tokenAddress)

    const deferred = createDeferredPromise<boolean>()
    result.current = deferred

    prefetchToken.current = getTokenFromExchangeByAddress({ tokenAddress: toChecksumAddress(tokenAddress), networkId })
    prefetchToken.current.then(console.log)

    toggleRef.current()
    console.log('Toggle MODAL ON')

    return deferred.promise.then(value => {
      console.log('value', value)
      // close modal
      console.log('Toggle MODAL OFF')
      toggleRef.current()

      // reset hook state
      result.current = undefined

      return value
    })
  }, [])

  useEffect(() => {
    if (!modalProps.isModalVisible) {
      // reset hook state
      setNetworkId(0)
      setTokenAddress('')
      setToken(null)
      setError(null)
    }
  }, [modalProps.isModalVisible])

  console.log('modalProps', modalProps)
  return {
    addTokenToList,
    modalProps,
  }
}
