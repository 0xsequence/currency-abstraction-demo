import { Box, Button, NumericInput, Text } from '@0xsequence/design-system'
import { utils as etherUtils } from 'ethers'
import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from 'wagmi'

import { useClearCachedBalances } from '../../hooks/useClearCachedBalances'
import { CHAIN_ID, FAUCET_URL, WETH_CONTRACT_ADDRESS } from '../../constants'
import { WETH_CONTRACT_ABI } from '../../constants/abis/weth'

interface WrapModalProps {
  ethBalance: bigint
  wethBalance: bigint
  closeModal: () => void
}

export const WrapModal = ({ ethBalance, closeModal }: WrapModalProps) => {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { address: userAddress } = useAccount()
  const { clearCachedBalances } = useClearCachedBalances()

  const [wrapInProgress, setWrapInProgress] = useState(false)
  const [buyAmount, setBuyAmount] = useState(1)

  const { writeContractAsync } = useWriteContract()

  const onClickWrap = async () => {
    if (!walletClient || !userAddress || !publicClient) {
      return
    }

    setWrapInProgress(true)

    try {
      const walletClientChainId = await walletClient.getChainId()
      if (walletClientChainId !== CHAIN_ID) {
        // Switch chain if required
        await walletClient.switchChain({ id: CHAIN_ID })
      }

      // Deposit ETH
      const value = etherUtils.parseEther(buyAmount.toString()).toBigInt()
      const wrapTxHash = await writeContractAsync({
        abi: WETH_CONTRACT_ABI,
        address: WETH_CONTRACT_ADDRESS,
        functionName: 'deposit',
        value
      })
      await publicClient.waitForTransactionReceipt({
        hash: wrapTxHash,
        confirmations: 1
      })
    } catch (e) {
      console.error('Failed to wrap...', e)
    }
    clearCachedBalances()
    setWrapInProgress(false)
    closeModal()
  }

  return (
    <Box padding={'4'} paddingTop="12" flexDirection="column" gap="5">
      <Box flexDirection="column" gap="4">
        <NumericInput
          type="number"
          value={buyAmount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyAmount(parseFloat(e.target?.value || '0'))}
          max={etherUtils.formatEther(ethBalance)}
        />
        <Text variant="small" color="text100">
          Hint: You will need ETH for wrapping. Get some&nbsp;
          <Text variant="normal" as="a" color="text100" href={FAUCET_URL} target="_blank" rel="noreferrer">
            here
          </Text>
        </Text>
        <Box flexDirection="row" width={'full'} justifyContent={'space-between'} alignItems="center" gap="1">
          <Button label="Wrap" onClick={() => onClickWrap()} variant="primary" disabled={wrapInProgress} />
        </Box>
      </Box>
    </Box>
  )
}
