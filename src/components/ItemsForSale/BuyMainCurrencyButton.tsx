import { useQueryClient } from '@tanstack/react-query'
import { useCheckoutModal, CheckoutSettings } from '@0xsequence/kit-checkout'
import { encodeFunctionData, Hex, toHex } from 'viem'
import { Button } from '@0xsequence/design-system'
import { usePublicClient, useWalletClient, useAccount, useReadContract } from 'wagmi'

import { SALES_CONTRACT_ABI } from '../../constants/abi'
import {
  SALES_CONTRACT_ADDRESS,
  CHAIN_ID
} from '../../constants'
import { useSalesCurrency } from '../../hooks/useSalesCurrency'

interface BuyMainCurrencyButtonProps {
  tokenId: string
  collectionAddress: string
  chainId: number
}

export const BuyMainCurrencyButton = ({
  tokenId,
  collectionAddress,
  chainId,
}: BuyMainCurrencyButtonProps) => {
  const queryClient = useQueryClient()
  const { triggerCheckout } = useCheckoutModal()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { address: userAddress } = useAccount()
  const { data: currencyData, isLoading: currencyIsLoading } = useSalesCurrency()

  interface TokenSaleDetailData {
    cost: bigint
  }

  const { data: tokenSaleDetailsData, isLoading: tokenSaleDetailsDataIsLoading } = useReadContract({
    abi: SALES_CONTRACT_ABI,
    functionName: 'tokenSaleDetails',
    chainId: CHAIN_ID,
    address: SALES_CONTRACT_ADDRESS,
    args: [BigInt(tokenId)]
  })

  const currencyPrice = ((tokenSaleDetailsData as TokenSaleDetailData)?.cost || 0n).toString()

  const onClickBuy = () => {
    if (!publicClient || !walletClient || !userAddress || !currencyData) {
      return
    }

    /**
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

    const calldata = encodeFunctionData({
      abi: SALES_CONTRACT_ABI,
      functionName: 'mint',
      args: [
        userAddress,
        [BigInt(tokenId)],
        [BigInt(1)],
        toHex(0),
        currencyData.address,
        BigInt(currencyPrice),
        [toHex(0, { size: 32 })],
      ]
    })

    // https://dev.sequence.build/project/424/contracts/1088?view=read
    const checkoutSettings: CheckoutSettings = {
      creditCardCheckout: {
        chainId,
        contractAddress: SALES_CONTRACT_ADDRESS,
        recipientAddress: userAddress || '',
        currencyQuantity: currencyPrice,
        currencySymbol: currencyData.symbol,
        currencyAddress: currencyData.address,
        currencyDecimals: String(currencyData.decimals),
        nftId: String(tokenId),
        nftAddress: collectionAddress,
        nftQuantity: '1',
        nftDecimals: '0',
        approvedSpenderAddress: SALES_CONTRACT_ADDRESS,
        calldata,
        isDev: location.hostname === "localhost",
        onSuccess: async (txnHash) => {
          await publicClient?.waitForTransactionReceipt({
            hash: txnHash as Hex,
            confirmations: 5
          })
          // clear collection balance to show updated owned amount
          queryClient.invalidateQueries({
            queryKey: ['collectionBalance']
          })
        },
        onError: error => {
          console.error(error)
        }
      }
    }
    
    triggerCheckout(checkoutSettings)
  }

  return (
    <Button
      loading={currencyIsLoading || tokenSaleDetailsDataIsLoading}
      size="sm"
      variant="primary"
      label="Purchase"
      shape="square"
      width="full"
      onClick={onClickBuy}
    />
  )
}