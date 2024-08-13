import { SequenceAPIClient, WebrpcBadResponseError, WebrpcError, WebrpcRequestFailedError } from '@0xsequence/api'
import { useMemo } from 'react'

import { useProjectAccessKey } from './useProjectAccessKey'

export const useAPIClient = () => {
  const projectAccessKey = useProjectAccessKey()

  const clientUrl = import.meta.env.VITE_SEQUENCE_API_URL || 'https://api.sequence.app'

  const apiClient = useMemo(() => {
    return new ExtendedSequenceAPIClient(clientUrl, projectAccessKey)
  }, [clientUrl, projectAccessKey])

  return apiClient
}

// FIXME Everything below this point is here while we wait for sequence.js to be updated

export interface SwapQuote {
  currencyAddress: string
  currencyBalance: string
  price: string
  maxPrice: string
  to: string
  transactionData: string
  approveData: string
}

export interface GetSwapQuotesArgs {
  userAddress: string
  currencyAddress: string
  currencyAmount: string
  chainId: number
  includeApprove: boolean
}

export interface GetSwapQuotesReturn {
  swapQuotes: Array<SwapQuote>
}

const createHTTPRequest = (body: object = {}, headers: object = {}, signal: AbortSignal | null = null): object => {
  return {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
    signal
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildResponse = (res: Response): Promise<any> => {
  return res.text().then(text => {
    let data
    try {
      data = JSON.parse(text)
    } catch (error) {
      let message = ''
      if (error instanceof Error) {
        message = error.message
      }
      throw WebrpcBadResponseError.new({
        status: res.status,
        cause: `JSON.parse(): ${message}: response text: ${text}`
      })
    }
    if (!res.ok) {
      throw WebrpcError.new(data)
    }
    return data
  })
}

export class ExtendedSequenceAPIClient extends SequenceAPIClient {
  constructor(hostname: string, projectAccessKey?: string | undefined, jwtAuth?: string | undefined) {
    super(hostname, projectAccessKey, jwtAuth)
  }

  private xurl(name: string): string {
    return this.hostname + this.path + name
  }

  getSwapQuotes = (args: GetSwapQuotesArgs, headers?: object, signal?: AbortSignal): Promise<GetSwapQuotesReturn> => {
    return this.fetch(this.xurl('GetSwapQuotes'), createHTTPRequest(args, headers, signal)).then(
      res => {
        return buildResponse(res).then(_data => {
          return {
            swapQuotes: <Array<SwapQuote>>_data.swapQuotes
          }
        })
      },
      error => {
        throw WebrpcRequestFailedError.new({ cause: `fetch(): ${error.message || ''}` })
      }
    )
  }
}
