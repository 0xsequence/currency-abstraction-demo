import { useQueryClient } from '@tanstack/react-query'

interface UseClearCachedQuotes {
  clearCachedQuotes: () => void
}

export const useClearCachedQuotes = (): UseClearCachedQuotes => {
  const queryClient = useQueryClient()

  return {
    clearCachedQuotes: () => {
      queryClient.invalidateQueries({
        queryKey: ['swapQuotes']
      })
    }
  }
}
