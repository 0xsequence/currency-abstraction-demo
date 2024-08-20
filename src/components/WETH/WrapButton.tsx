import { Button, Modal } from '@0xsequence/design-system'
import { useState } from 'react'
import { WrapModal } from './WrapModal'

interface WrapButtonProps {
  ethBalance: bigint
  wethBalance: bigint
}

export const WrapButton = (props: WrapButtonProps) => {
  const [wrapModalIsOpen, setWrapModalIsOpen] = useState(false)

  const onClickButton = () => {
    setWrapModalIsOpen(true)
  }

  return (
    <>
      <Button size="sm" variant="primary" label={`Wrap your ETH`} shape="square" width="full" onClick={onClickButton} />
      {wrapModalIsOpen && (
        <Modal
          onClose={() => {
            setWrapModalIsOpen(false)
          }}
        >
          <WrapModal
            {...props}
            closeModal={() => {
              setWrapModalIsOpen(false)
            }}
          />
        </Modal>
      )}
    </>
  )
}
