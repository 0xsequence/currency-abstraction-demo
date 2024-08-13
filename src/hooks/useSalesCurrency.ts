import type { ContractInfo } from '@0xsequence/indexer'
import { useReadContract } from 'wagmi'

import {
  useContractInfo
} from '../hooks/data'
import {  
  CHAIN_ID,
  SALES_CONTRACT_ADDRESS
} from '../constants'
import { SALES_CONTRACT_ABI } from '../constants/abi'

interface UseSalesCurrencyReturn {
  data: ContractInfo | undefined
  isLoading: boolean
}

export const useSalesCurrency = (): UseSalesCurrencyReturn => {
  const { data: paymentTokenData, isLoading: paymentTokenIsLoading } = useReadContract({
    abi: SALES_CONTRACT_ABI,
    functionName: 'paymentToken',
    chainId: CHAIN_ID,
    address: SALES_CONTRACT_ADDRESS,
  })

  const paymentTokenAddress = paymentTokenData as string || ''

  const { data: currencyContractInfoData, isLoading: currencyContractInfoIsLoading } = useContractInfo(
    CHAIN_ID,
    paymentTokenAddress
  )

  return ({
    data: currencyContractInfoData,
    isLoading: paymentTokenIsLoading || currencyContractInfoIsLoading
  })
}