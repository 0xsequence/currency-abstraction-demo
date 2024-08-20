import { useQueryClient } from '@tanstack/react-query'
import { getBalanceQueryKey } from 'wagmi/query'

interface UseClearCachedBalances {
  clearCachedBalances: () => void
}

export const useClearCachedBalances = (): UseClearCachedBalances => {
  const queryClient = useQueryClient()
  const balanceQueryKey = getBalanceQueryKey()

  return {
    clearCachedBalances: () => {
      queryClient.invalidateQueries({
        queryKey: ['balances']
      })
      queryClient.invalidateQueries({
        queryKey: balanceQueryKey
      })
    }
  }
}
