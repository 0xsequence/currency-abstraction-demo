import { useState } from 'react'
import { Button, Modal } from '@0xsequence/design-system'

import { PurchaseModal } from '../PurchaseModal'

interface BuyMainCurrencyButtonProps {
  tokenId: string
  collectionAddress: string
  chainId: number
}

export const BuyMainCurrencyButton = ({ tokenId, collectionAddress, chainId }: BuyMainCurrencyButtonProps) => {
  const [purchaseModalIsOpen, setPurchaseModalIsOpen] = useState(false)

  const onClickBuy = () => {
    setPurchaseModalIsOpen(true)
  }

  return (
    <>
      <Button size="sm" variant="primary" label="Purchase" shape="square" width="full" onClick={onClickBuy} />
      {purchaseModalIsOpen && (
        <Modal
          onClose={() => {
            setPurchaseModalIsOpen(false)
          }}
        >
          <PurchaseModal
            tokenId={tokenId}
            collectionAddress={collectionAddress}
            chainId={chainId}
            closeModal={() => {
              setPurchaseModalIsOpen(false)
            }}
          />
        </Modal>
      )}
    </>
  )
}
