import { Box, Text, Spinner, useMediaQuery } from '@0xsequence/design-system'
import { useAccount } from 'wagmi'

import { CHAIN_ID, WETH_CONTRACT_ADDRESS } from '../../constants'
import { utils as etherUtils } from 'ethers'
import { WrapButton } from './WrapButton'
import { useBalance, useNativeBalance } from '../../hooks/data'

export const WETHBalance = () => {
  const isMobile = useMediaQuery('isMobile')
  const { address: userAddress } = useAccount()

  const { data: ethBalanceData, isLoading: ethBalanceIsLoading } = useNativeBalance({
    accountAddress: userAddress ?? '',
    chainId: CHAIN_ID
  })

  const { data: wethBalanceData, isLoading: wethBalanceIsLoading } = useBalance({
    accountAddress: userAddress || '',
    contractAddress: WETH_CONTRACT_ADDRESS,
    chainId: CHAIN_ID,
    includeMetadata: false,
    verifiedOnly: false
  })

  const isLoading = ethBalanceIsLoading || wethBalanceIsLoading

  if (isLoading) {
    return (
      <Box margin="2" color="text100" flexDirection="column" justifyContent="center" alignItems="center" gap="2">
        <Text color="text100">Loading...</Text>
        <Spinner />
      </Box>
    )
  }

  const ethBalance = etherUtils.formatEther(ethBalanceData?.value ?? '0')
  const wethBalanceInt = BigInt(wethBalanceData?.[0]?.balance ?? '0')
  const wethBalance = etherUtils.formatEther(wethBalanceInt)

  return (
    <Box margin="2" flexDirection="column" justifyContent="center" alignItems="center" gap="2">
      <Box gap="2" justifyContent="space-between" {...(isMobile ? { flexDirection: 'column' } : {})}>
        <Text variant="normal" color="text100" style={{ minWidth: 205 }}>
          ETH Balance: {ethBalance} ETH
        </Text>
        <Text variant="normal" color="text100" style={{ minWidth: 205, textAlign: 'right' }}>
          WETH Balance: {wethBalance} WETH
        </Text>
      </Box>
      {ethBalanceData && <WrapButton ethBalance={ethBalanceData.value} wethBalance={wethBalanceInt} />}
    </Box>
  )
}
