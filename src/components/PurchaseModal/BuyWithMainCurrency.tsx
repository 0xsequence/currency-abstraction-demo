import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Spinner,
  Text,
  TokenImage,
  CheckmarkIcon,
  CloseIcon
} from '@0xsequence/design-system'
import { formatUnits, zeroAddress, Hex } from 'viem'
import { usePublicClient, useWalletClient, useReadContract, useAccount } from 'wagmi'

import { useSalesCurrency } from '../../hooks/useSalesCurrency'
import { useClearCachedBalances } from '../../hooks/useClearCachedBalances'

import {  
  SALES_CONTRACT_ADDRESS,
  CHAIN_ID
} from '../../constants'
import {
  SALES_CONTRACT_ABI,
  ERC_20_CONTRACT_ABI
} from '../../constants/abi'

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

export const BuyWithMainCurrency = (args: BuyWithMainCurrencyProps) => {
  const { data: currencyData, isLoading: currencyIsLoading } = useSalesCurrency()
  const { address: userAddress } = useAccount()
  const { clearCachedBalances } = useClearCachedBalances()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [approvalInProgress, setApprovalInProgress] = useState(false)
  const [purchaseInProgress, setPurchaseInProgress] = useState(false)

  const { data: tokenSaleDetailsData, isLoading: tokenSaleDetailsDataIsLoading } = useReadContract({
    abi: SALES_CONTRACT_ABI,
    functionName: 'tokenSaleDetails',
    chainId: CHAIN_ID,
    address: SALES_CONTRACT_ADDRESS,
    args: [BigInt(args.tokenId)]
  })

  const { data: allowanceData, isLoading: allowanceIsLoading, refetch: refechAllowance } = useReadContract({
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
  const priceFormatted = formatUnits(BigInt(price), currencyData?.decimals || 0)

  const isApproved: boolean = (allowanceData as bigint) >= BigInt(price) 

  const isLoading: boolean = currencyIsLoading || tokenSaleDetailsDataIsLoading || allowanceIsLoading

  const onClickApprove = async () => {
    if (!walletClient || !userAddress || !publicClient) {
      return
    }
    
    setApprovalInProgress(true)

    try {
      const walletClientChainId = await walletClient.getChainId()
      if (walletClientChainId !== args.chainId) {
        await walletClient.switchChain({ id: args.chainId })
      }

      const txnHash = await walletClient?.writeContract({
        account: userAddress,
        abi: ERC_20_CONTRACT_ABI,
        address: currencyData!.address as Hex,
        functionName: 'approve',
        args: [SALES_CONTRACT_ADDRESS, price],
      })
      await publicClient.waitForTransactionReceipt({
        hash: txnHash as Hex,
        confirmations: 5
      })
      await refechAllowance()
    } catch (e) {
      console.error('an error occurred...', e)
    }

    setApprovalInProgress(false)
  }

  const onClickPurchase = async () => {
    if (!walletClient || !userAddress || !publicClient) {
      return
    }

    setPurchaseInProgress(true)

    //.... call mint function

    args.closeModal()
    // after enough confirmations...
    clearCachedBalances()
    setPurchaseInProgress(false)
  }


  const SuccessIcon = () => (
    <CheckmarkIcon
      color="positive"
    />
  )

  const ErrorIcon = () => (
    <CloseIcon color="negative" />
  )

  const LoadingIcon = () => (
    <Spinner size="sm" />
  )

  if (isLoading) {
    return (
      <Card
        width="full"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        style={{
          height: '200px'
        }}
      >
        <Spinner />
      </Card>
    )
  }

  const ApprovalStatusIcon = () => {
    if (approvalInProgress) {
      return (
        <LoadingIcon />
      )
    } else if (isApproved) {
      return (
        <SuccessIcon />
      )
    } else {
      return (
        <ErrorIcon />
      )
    }
  } 

  return (
    <Card
      width="full"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      style={{
        height: '200px'
      }}
    >
      <Box flexDirection="column" gap="2" justifyContent="flex-start">
        <Box>
          <Text color="text100">Buy With {currencyData?.name}</Text>
        </Box>
        <Box flexDirection="row" gap="1" alignItems="center">
          <Text variant="small" color="text100">
            {`Price: ${priceFormatted} ${currencyData?.symbol}`}
          </Text>
          <TokenImage size="xs" src={currencyData?.logoURI} />
        </Box>
      </Box>
      <Box flexDirection="column" gap="2">
        <Box flexDirection="row" justifyContent="center" alignItems="center" gap="1">
          <Text variant="normal" color="text100">Step 1: Approve Currency</Text>
          <Box justifyContent="center" alignItems="center" style={{ width: '24px', height: '24px' }}>
            <ApprovalStatusIcon />
          </Box>
        </Box>
        <Button
          label="Approve"
          onClick={onClickApprove}
          disabled={isApproved}
          variant="primary"
          shape="square"
          pending={approvalInProgress}
        />
      </Box>
      <Box flexDirection="column" gap="2">
        <Box flexDirection="row" justifyContent="center" alignItems="center" gap="1">
          <Text variant="normal" color="text100">Step 2: Purchase</Text>
          <Box justifyContent="center" alignItems="center" style={{ width: '24px', height: '24px' }}>
            {
              purchaseInProgress && <Spinner size="sm" />
            }            
          </Box>
        </Box>
        <Button
          label="Purchase"
          onClick={onClickPurchase}
          disabled={!isApproved || approvalInProgress}
          variant="primary"
          shape="square"
          pending={purchaseInProgress}
        />
      </Box>
    </Card>
  )
}