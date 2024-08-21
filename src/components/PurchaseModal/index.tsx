import { Box } from '@0xsequence/design-system'

import { BuyWithMainCurrency } from './BuyWithMainCurrency'
import { SwapAndBuy } from './SwapAndBuy'

interface PurchaseModalProps {
  tokenId: string
  collectionAddress: string
  chainId: number
  closeModal: () => void
}

export const PurchaseModal = ({ tokenId, collectionAddress, chainId, closeModal }: PurchaseModalProps) => {
  return (
    <Box padding={'4'} paddingTop="12" flexDirection="column" gap="5">
      <BuyWithMainCurrency tokenId={tokenId} collectionAddress={collectionAddress} chainId={chainId} closeModal={closeModal} />
      <SwapAndBuy tokenId={tokenId} collectionAddress={collectionAddress} chainId={chainId} closeModal={closeModal} />
    </Box>
  )
}
