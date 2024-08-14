import { Button, Modal } from '@0xsequence/design-system'
import type { ContractInfo } from '@0xsequence/indexer'
import { useState } from 'react'

import { SwapModal } from './SwapModal'

interface SwapButtonProps {
  currencyInfo: ContractInfo
}

export const SwapButton = ({ currencyInfo }: SwapButtonProps) => {
  const [swapModalIsOpen, setSwapModalIsOpen] = useState(false)

  const { address, chainId, name, type } = currencyInfo
  if (!address || !chainId || !name || type !== 'ERC20') {
    return null
  }

  const onClickBuy = () => {
    setSwapModalIsOpen(true)
  }

  return (
    <>
      <Button size="sm" variant="primary" label={`Get more ${name}`} shape="square" width="full" onClick={onClickBuy} />
      {swapModalIsOpen && (
        <Modal
          onClose={() => {
            setSwapModalIsOpen(false)
          }}
        >
          <SwapModal
            currencyInfo={currencyInfo}
            closeModal={() => {
              setSwapModalIsOpen(false)
            }}
          />
        </Modal>
      )}
    </>
  )
}
