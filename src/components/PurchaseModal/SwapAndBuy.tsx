import { useState, useEffect } from 'react'
import { Box, Button, Card, Spinner, Text, TokenImage, useMediaQuery } from '@0xsequence/design-system'
import { SequenceWaaS } from '@0xsequence/waas'
import { formatUnits, zeroAddress, Hex, toHex, encodeFunctionData } from 'viem'
import { usePublicClient, useWalletClient, useReadContract, useAccount } from 'wagmi'

import { useSwapQuotes, SwapQuotesWithCurrencyInfo } from '../../hooks/data'
import { useSalesCurrency } from '../../hooks/useSalesCurrency'
import { useClearCachedBalances } from '../../hooks/useClearCachedBalances'
import { useClearCachedQuotes } from '../../hooks/useClearCachedQuotes'
import { compareAddress } from '../../utils'

import { SALES_CONTRACT_ADDRESS, CHAIN_ID, TRANSACTION_CONFIRMATIONS } from '../../constants'
import { SALES_CONTRACT_ABI, ERC_20_CONTRACT_ABI } from '../../constants/abi'

interface BuyWithMainCurrencyProps {
  tokenId: string
  collectionAddress: string
  chainId: number
  closeModal: () => void
}

interface TokenSaleDetailsData {
  cost: bigint
  decimals: number
  address: string
}

export const SwapAndBuy = (args: BuyWithMainCurrencyProps) => {
  const isMobile = useMediaQuery('isMobile')
  const { data: currencyData, isLoading: currencyIsLoading } = useSalesCurrency()
  const { address: userAddress, connector } = useAccount()
  const { clearCachedBalances } = useClearCachedBalances()
  const { clearCachedQuotes } = useClearCachedQuotes()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [swapsInProgress, setSwapsInProgress] = useState<string[]>([])

  const { data: tokenSaleDetailsData, isLoading: tokenSaleDetailsDataIsLoading } = useReadContract({
    abi: SALES_CONTRACT_ABI,
    functionName: 'tokenSaleDetails',
    chainId: CHAIN_ID,
    address: SALES_CONTRACT_ADDRESS,
    args: [BigInt(args.tokenId)]
  })

  const {
    data: allowanceData,
    isLoading: allowanceIsLoading,
    refetch: refechAllowance
  } = useReadContract({
    abi: ERC_20_CONTRACT_ABI,
    functionName: 'allowance',
    chainId: CHAIN_ID,
    address: (currencyData?.address || zeroAddress) as Hex,
    args: [userAddress, SALES_CONTRACT_ADDRESS],
    query: {
      enabled: !!currencyData && !!userAddress
    }
  })

  const price = (tokenSaleDetailsData as TokenSaleDetailsData)?.cost || 0n
  const isApproved: boolean = (allowanceData as bigint) >= BigInt(price)

  const { data: swapQuotes, isLoading: swapQuotesIsLoading } = useSwapQuotes({
    userAddress: userAddress ?? '',
    currencyAddress: currencyData?.address || '',
    chainId: args.chainId,
    currencyAmount: price.toString(),
    withContractInfo: true
  })

  useEffect(() => {
    clearCachedQuotes()
    setSwapsInProgress([])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading: boolean = currencyIsLoading || tokenSaleDetailsDataIsLoading || allowanceIsLoading || swapQuotesIsLoading

  const onClickPurchase = async (swapQuote: SwapQuotesWithCurrencyInfo) => {
    if (!walletClient || !userAddress || !publicClient || !userAddress || !currencyData || !connector) {
      return
    }

    const swapQuoteAddress = swapQuote.info?.address || ''

    setSwapsInProgress([...swapsInProgress.filter(address => compareAddress(address, swapQuoteAddress)), swapQuoteAddress])

    try {
      const walletClientChainId = await walletClient.getChainId()
      if (walletClientChainId !== args.chainId) {
        await walletClient.switchChain({ id: args.chainId })
      }

      const approveTxData = encodeFunctionData({
        abi: ERC_20_CONTRACT_ABI,
        functionName: 'approve',
        args: [SALES_CONTRACT_ADDRESS, price]
      })

      const purchaseTransactionData = encodeFunctionData({
        abi: SALES_CONTRACT_ABI,
        functionName: 'mint',
        args: [userAddress, [BigInt(args.tokenId)], [BigInt(1)], toHex(0), currencyData?.address, price, [toHex(0, { size: 32 })]]
      })

      const transactions = [
        // Swap quote optional approve step
        ...(swapQuote.quote.approveData
          ? [
              {
                to: swapQuote.quote.currencyAddress,
                data: swapQuote.quote.approveData,
                chain: CHAIN_ID
              }
            ]
          : []),
        // Swap quote tx
        {
          to: swapQuote.quote.to,
          data: swapQuote.quote.transactionData,
          chain: CHAIN_ID
        },
        // Actual transaction optional approve step
        ...(isApproved
          ? []
          : [
              {
                to: currencyData.address || '',
                data: approveTxData as string,
                chainId: CHAIN_ID
              }
            ]),
        // transaction on the sales contract
        {
          to: SALES_CONTRACT_ADDRESS,
          data: purchaseTransactionData as string,
          chainId: CHAIN_ID
        }
      ]

      const sequenceWaaS = connector?.['sequenceWaas'] as SequenceWaaS | undefined

      let txnHash = ''
      if (sequenceWaaS) {
        // waas connector logic
        const resp = await sequenceWaaS.feeOptions({
          transactions: transactions,
          network: CHAIN_ID
        })

        const transactionsFeeOption = resp.data.feeOptions[0]
        const transactionsFeeQuote = resp.data.feeQuote

        const response = await sequenceWaaS.sendTransaction({
          transactions,
          transactionsFeeOption,
          transactionsFeeQuote
        })

        if (response.code === 'transactionFailed') {
          throw new Error(response.data.error)
        }

        txnHash = response.data.txHash

        // wait for at least two block confirmations
        // for changes to be reflected by the indexer
        await publicClient.waitForTransactionReceipt({
          hash: txnHash as Hex,
          confirmations: TRANSACTION_CONFIRMATIONS
        })
      } else {
        // We fire the transactions one at a time since the cannot be batched
        for (const transaction of transactions) {
          txnHash = await walletClient.sendTransaction({
            account: userAddress,
            to: transaction.to as Hex,
            data: transaction.data as Hex
          })
          // wait for a block confirmation otherwise metamask throws an error
          await publicClient.waitForTransactionReceipt({
            hash: txnHash as Hex,
            confirmations: TRANSACTION_CONFIRMATIONS
          })
        }
      }

      args.closeModal()
      refechAllowance()
      clearCachedBalances()
      clearCachedQuotes()
    } catch (e) {
      console.error('Failed to purchase...', e)
    }

    setSwapsInProgress([...swapsInProgress.filter(address => compareAddress(address, swapQuoteAddress))])
  }

  if (isLoading) {
    return (
      <Card
        width="full"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        style={{
          minHeight: '200px'
        }}
      >
        <Spinner />
      </Card>
    )
  }

  interface StatusMessageProps {
    purchaseInProgress: boolean
  }

  const StatusMessage = ({ purchaseInProgress }: StatusMessageProps) => {
    if (purchaseInProgress) {
      return (
        <Box flexDirection="row" gap="1" alignItems="center" justifyContent={isMobile ? 'center' : 'flex-start'}>
          <Text variant="small" color="text100">
            In progress...
          </Text>
          <Box justifyContent="center" alignItems="center" style={{ height: '22px', width: '22px' }}>
            <Spinner size="sm" />
          </Box>
        </Box>
      )
    }

    return null
  }

  return swapQuotes?.map((swapQuote, index) => {
    const swapQuotePriceFormatted = formatUnits(BigInt(swapQuote.quote.price), swapQuote.info?.decimals || 18)
    const balanceFormatted = formatUnits(BigInt(swapQuote.balance?.balance || 0), swapQuote.info?.decimals || 18)
    const swapQuoteAddress = swapQuote.info?.address || ''
    const purchaseInProgress = swapsInProgress.includes(swapQuoteAddress)

    return (
      <Card
        key={swapQuote.info?.address || index}
        width="full"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems="center"
        justifyContent="space-between"
        gap={isMobile ? '2' : '0'}
        style={{
          minHeight: '200px'
        }}
      >
        <Box
          flexDirection="column"
          gap="2"
          justifyContent={isMobile ? 'center' : 'flex-start'}
          style={{ ...(isMobile ? { width: '200px' } : {}) }}
        >
          <Box justifyContent={isMobile ? 'center' : 'flex-start'}>
            <Text color="text100">Buy With {swapQuote.info?.name}</Text>
          </Box>
          <Box flexDirection="row" gap="1" alignItems="center" justifyContent={isMobile ? 'center' : 'flex-start'}>
            <Text variant="small" color="text100">
              {`Price: ${swapQuotePriceFormatted} ${swapQuote.info?.symbol}`}
            </Text>
            <TokenImage size="xs" src={swapQuote.info?.logoURI} />
          </Box>
          <Box flexDirection="row" gap="1" alignItems="center" justifyContent={isMobile ? 'center' : 'flex-start'}>
            <Text variant="small" color="text100">
              {`Balance: ${balanceFormatted} ${swapQuote.info?.symbol}`}
            </Text>
            <TokenImage size="xs" src={swapQuote.info?.logoURI} />
          </Box>
          <StatusMessage purchaseInProgress={purchaseInProgress} />
        </Box>
        <Box
          flexDirection="column"
          gap="2"
          alignItems={isMobile ? 'center' : 'flex-start'}
          style={{ ...(isMobile ? { width: '200px' } : {}) }}
        >
          <Button
            label="Purchase"
            onClick={() => onClickPurchase(swapQuote)}
            disabled={purchaseInProgress}
            variant="primary"
            shape="square"
            pending={purchaseInProgress}
          />
        </Box>
      </Card>
    )
  })
}
