import { useState, useEffect } from 'react'
import { Box, Button, Card, Spinner, Text, TokenImage, useMediaQuery } from '@0xsequence/design-system'
import { SequenceWaaS } from '@0xsequence/waas'
import { formatUnits, zeroAddress, Hex, toHex, encodeFunctionData } from 'viem'
import { usePublicClient, useWalletClient, useReadContract, useAccount } from 'wagmi'

import { useBalance, useSwapQuotes, SwapQuotesWithCurrencyInfo } from '../../hooks/data'
import { useSalesCurrency } from '../../hooks/useSalesCurrency'
import { useClearCachedBalances } from '../../hooks/useClearCachedBalances'
import { useClearCachedQuotes } from '../../hooks/useClearCachedQuotes'

import { SALES_CONTRACT_ADDRESS, CHAIN_ID } from '../../constants'
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
  const [purchaseInProgress, setPurchaseInProgress] = useState(false)

  // const clearCachedQuotesCallback = useCallback(clearCachedQuotes, [clearCachedQuotes])

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

  const { data: currencyBalanceData, isLoading: currencyBalanceIsLoading } = useBalance({
    chainId: args.chainId,
    contractAddress: currencyData?.address || '',
    accountAddress: userAddress || '',
    // includeMetadata must be false to work around a bug
    includeMetadata: false
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const balance: bigint = BigInt(currencyBalanceData?.[0]?.balance || '0')

  const isNotEnoughFunds: boolean = price > balance

  const isLoading: boolean =
    currencyIsLoading || tokenSaleDetailsDataIsLoading || allowanceIsLoading || currencyBalanceIsLoading || swapQuotesIsLoading

  const onClickPurchase = async (swapQuote: SwapQuotesWithCurrencyInfo) => {
    if (!walletClient || !userAddress || !publicClient || !userAddress || !currencyData || !connector) {
      return
    }

    setPurchaseInProgress(true)

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

      /*   **
       * Mint tokens.
       * @param to Address to mint tokens to.
       * @param tokenIds Token IDs to mint.
       * @param amounts Amounts of tokens to mint.
       * @param data Data to pass if receiver is contract.
       * @param expectedPaymentToken ERC20 token address to accept payment in. address(0) indicates ETH.
       * @param maxTotal Maximum amount of payment tokens.
       * @param proof Merkle proof for allowlist minting.
       * @notice Sale must be active for all tokens.
       * @dev tokenIds must be sorted ascending without duplicates.
       * @dev An empty proof is supplied when no proof is required.
       */

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
        const response = await sequenceWaaS.sendTransaction({
          transactions
        })

        if (response.code === 'transactionFailed') {
          throw new Error(response.data.error)
        }

        txnHash = response.data.txHash
      } else {
        // We fire the transactions one at a time since the cannot be batched
        for (const transaction of transactions) {
          txnHash = await walletClient.sendTransaction({
            account: userAddress,
            to: transaction.to as Hex,
            data: transaction.data as Hex
          })
        }

        // wait for a block confirmation otherwise metamask throws an error
        await publicClient.waitForTransactionReceipt({
          hash: txnHash as Hex,
          confirmations: 1
        })
      }

      // wait for at least two block confirmations
      // for changes to be reflected by the indexer
      await publicClient.waitForTransactionReceipt({
        hash: txnHash as Hex,
        confirmations: 2
      })

      args.closeModal()
      refechAllowance()
      clearCachedBalances()
      clearCachedQuotes()
    } catch (e) {
      console.error('Failed to purchase...', e)
    }

    setPurchaseInProgress(false)
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

  const StatusMessage = () => {
    if (isNotEnoughFunds) {
      return (
        <Box flexDirection="row" gap="1" alignItems="center" justifyContent={isMobile ? 'center' : 'flex-start'}>
          <Text variant="small" color="negative">
            Not enough funds
          </Text>
          <Box style={{ height: '22px', width: '22px' }} />
        </Box>
      )
    }

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
          <StatusMessage />
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
            disabled={purchaseInProgress || isNotEnoughFunds}
            variant="primary"
            shape="square"
            pending={purchaseInProgress}
          />
        </Box>
      </Card>
    )
  })
}
