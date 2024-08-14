import { SequenceIndexer } from '@0xsequence/indexer'
import { useQuery } from '@tanstack/react-query'

import { SequenceAPIClient, SwapQuote } from '@0xsequence/api'
import { ContractInfo, SequenceMetadata } from '@0xsequence/metadata'
import { useAPIClient } from '../hooks/useAPIClient'
import { useIndexerClient } from '../hooks/useIndexerClient'
import { useMetadataClient } from '../hooks/useMetadataClient'

export const time = {
  oneSecond: 1 * 1000,
  oneMinute: 60 * 1000,
  oneHour: 60 * 60 * 1000
}

export const useTokenMetadata = (chainId: number, contractAddress: string, tokenIds: string[]) => {
  const metadataClient = useMetadataClient()

  return useQuery({
    queryKey: ['tokenMetadata', chainId, contractAddress, tokenIds],
    queryFn: async () => {
      const res = await metadataClient.getTokenMetadata({
        chainID: String(chainId),
        contractAddress,
        tokenIDs: tokenIds
      })

      return res.tokenMetadata
    },
    retry: true,
    staleTime: time.oneMinute * 10,
    enabled: !!chainId && !!contractAddress
  })
}

const getContractInfo = async (
  metadataClient: SequenceMetadata,
  chainId: number,
  contractAddress: string
): Promise<ContractInfo | undefined> => {
  if (!chainId || !contractAddress) {
    return undefined
  }

  const res = await metadataClient.getContractInfo({
    chainID: String(chainId),
    contractAddress
  })

  return res.contractInfo
}

export const useContractInfo = (chainId: number, contractAddress: string | undefined) => {
  const metadataClient = useMetadataClient()

  return useQuery({
    queryKey: ['contractInfo', chainId, contractAddress],
    queryFn: () => getContractInfo(metadataClient, chainId, contractAddress || ''),
    retry: true,
    staleTime: time.oneMinute * 10,
    enabled: !!chainId && !!contractAddress
  })
}

interface UseBalanceArgs {
  chainId: number
  accountAddress: string
  contractAddress: string
  includeMetadata?: boolean
  verifiedOnly?: boolean
}

export const getBalance = async (indexerClient: SequenceIndexer, args: UseBalanceArgs) => {
  if (!args.chainId || !args.accountAddress || !args.contractAddress) {
    return []
  }

  const res = await indexerClient.getTokenBalances({
    accountAddress: args.accountAddress,
    contractAddress: args.contractAddress,
    includeMetadata: args.includeMetadata ?? true,
    metadataOptions: {
      verifiedOnly: args.verifiedOnly ?? true
    }
  })

  return res?.balances || []
}

export const useBalance = (args: UseBalanceArgs) => {
  const indexerClient = useIndexerClient(args.chainId)

  return useQuery({
    queryKey: ['balances', args],
    queryFn: () => getBalance(indexerClient, args),
    retry: true,
    staleTime: time.oneSecond * 30,
    enabled: !!args.chainId && !!args.accountAddress && !!args.contractAddress
  })
}

interface UseSwapQuotesArgs {
  userAddress: string
  currencyAddress: string
  currencyAmount: string
  chainId: number
  withContractInfo?: boolean
}

type SwapQuotesWithCurrencyInfo = {
  quote: SwapQuote
  info: ContractInfo | undefined
}

const getSwapQuotes = async (
  apiClient: SequenceAPIClient,
  metadataClient: SequenceMetadata,
  args: UseSwapQuotesArgs
): Promise<SwapQuotesWithCurrencyInfo[]> => {
  if (!args.chainId || !args.userAddress || !args.currencyAddress || !args.currencyAmount || args.currencyAmount === '0') {
    return []
  }

  const res = await apiClient.getSwapQuotes({
    ...args,
    includeApprove: true
  })

  if (res.swapQuotes === null) {
    return []
  }

  const currencyInfoMap = new Map<string, Promise<ContractInfo | undefined>>()
  if (args.withContractInfo) {
    res?.swapQuotes.forEach(quote => {
      const { currencyAddress } = quote
      if (currencyAddress && !currencyInfoMap.has(currencyAddress)) {
        currencyInfoMap.set(currencyAddress, getContractInfo(metadataClient, args.chainId, currencyAddress))
      }
    })
  }

  return Promise.all(
    res?.swapQuotes.map(async quote => ({
      quote,
      info: (await currencyInfoMap.get(quote.currencyAddress)) || undefined
    })) || []
  )
}

//TODO Cancel request when values are changed

export const useSwapQuotes = (args: UseSwapQuotesArgs) => {
  const apiClient = useAPIClient()
  const metadataClient = useMetadataClient()

  const enabled =
    !!args.chainId && !!args.userAddress && !!args.currencyAddress && !!args.currencyAmount && args.currencyAmount !== '0'

  return useQuery({
    queryKey: ['swapQuotes', args],
    queryFn: () => getSwapQuotes(apiClient, metadataClient, args),
    retry: true,
    staleTime: time.oneMinute,
    enabled
  })
}
