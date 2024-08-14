import { SwapQuote } from '@0xsequence/api'
import { Box, Button, NumericInput, Spinner, Text } from '@0xsequence/design-system'
import { ContractInfo } from '@0xsequence/indexer'
import { utils as etherUtils } from 'ethers'
import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useSwapQuotes } from '../../hooks/data'
import { useClearCachedBalances } from '../../hooks/useClearCachedBalances'

interface SwapModalProps {
  currencyInfo: ContractInfo
  closeModal: () => void
}

export const SwapModal = ({ currencyInfo, closeModal }: SwapModalProps) => {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { address: userAddress } = useAccount()
  const { clearCachedBalances } = useClearCachedBalances()

  const [swapInProgress, setSwapInProgress] = useState(false)
  const [buyAmount, setBuyAmount] = useState(1)

  const fullAmountStr = (BigInt(buyAmount) * BigInt(10) ** BigInt(currencyInfo.decimals || 1)).toString()

  const { data: swapQuotes, isLoading: swapQuotesIsLoading, error } = useSwapQuotes({
    userAddress: userAddress ?? '',
    currencyAddress: currencyInfo.address,
    chainId: currencyInfo.chainId,
    currencyAmount: fullAmountStr,
    withContractInfo: true
  })


  console.log('currency info,,,', currencyInfo, fullAmountStr, swapQuotes, error)

  const onClickSwap = async (swapQuote: SwapQuote) => {
    if (!walletClient || !userAddress || !publicClient) {
      return
    }

    setSwapInProgress(true)

    try {
      const walletClientChainId = await walletClient.getChainId()
      if (walletClientChainId !== currencyInfo.chainId) {
        // Switch chain if required
        await walletClient.switchChain({ id: currencyInfo.chainId })
      }

      // Approve
      const approveTxHash = await walletClient.sendTransaction({
        to: swapQuote.currencyAddress as `0x${string}`,
        data: swapQuote.approveData as `0x${string}`
      })
      await publicClient.waitForTransactionReceipt({
        hash: approveTxHash,
        confirmations: 1
      })

      // Swap
      const swapTxHash = await walletClient.sendTransaction({
        to: swapQuote.to as `0x${string}`,
        data: swapQuote.transactionData as `0x${string}`
      })
      await publicClient.waitForTransactionReceipt({
        hash: swapTxHash,
        confirmations: 1
      })
    } catch (e) {
      console.error('Failed to swap...', e)
    }
    clearCachedBalances()
    setSwapInProgress(false)
    closeModal()
  }

  const SwapQuotesList = () => {
    if (fullAmountStr === '0') {
      return (
        <Box width="full" justifyContent="center" alignItems="center" paddingTop="5">
          <Text variant="normal" color="text100">
            Select {currencyInfo?.name || 'currency'} amount
          </Text>
        </Box> 
      )
    }

    if (swapQuotesIsLoading) {
      return (
        <Box width="full" justifyContent="center" alignItems="center" paddingTop="5">
          <Spinner size="lg" />
        </Box>
      )
    }

    return (
      <>
      {!swapQuotesIsLoading &&
        swapQuotes &&
        swapQuotes?.map(quote => {
          const currName = quote.info ? `${quote.info.name} (${quote.info.symbol})` : quote.quote.currencyAddress
          return (
            <Box
              key={`swapQuote-${quote.quote.transactionData}`}
              flexDirection="row"
              width={'full'}
              justifyContent={'space-between'}
              alignItems="center"
              gap="1"
            >
              <Text color="text100">
                {etherUtils.formatEther(quote.quote.price)} {currName}
              </Text>
              <Button label="Swap" onClick={() => onClickSwap(quote.quote)} variant="primary" disabled={swapInProgress} />
            </Box>
          )
        })}
      </> 
    )
  }

  return (
    <Box padding={'4'} paddingTop="12" flexDirection="column" gap="5">
      <Box flexDirection="column" gap="4">
        <NumericInput
          type="number"
          value={buyAmount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyAmount(parseFloat(e.target?.value || '0'))}
        />
        <SwapQuotesList />
      </Box>
    </Box>
  )
}
