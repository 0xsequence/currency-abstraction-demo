import { Box, Text, Image } from '@0xsequence/design-system'
import { findSupportedNetwork } from '@0xsequence/network'
import { useAccount } from 'wagmi'

import { CHAIN_ID, ETHERSCAN_URL } from '../constants'
import { truncateAddress } from '../utils'
import { useSalesCurrency } from '../hooks/useSalesCurrency'

export const Header = () => {
  const { isConnected, address: userAddress } = useAccount()
  const network = findSupportedNetwork(CHAIN_ID)
  const formattedUserAddress = truncateAddress(userAddress || '', 6, 4)
  const { data: salesCurrencyData, isLoading: salesCurrencyIsLoading } = useSalesCurrency()

  return (
    <>
      <Text as="h2" variant="lg" color="text100" marginBottom="0">
        Currency Abstraction Demo
      </Text>
      <Image src="sequence-icon-cropped.png" style={{ maxWidth: 100 }} />
      {isConnected && !salesCurrencyIsLoading && (
        <Box marginTop="5" marginBottom="4" style={{ maxWidth: 600 }}>
          <Text color="text100">
            This is a demo that showcases currency abstraction using Sequence services. Make sure there is some&nbsp;
            {network?.nativeToken.symbol} in your connected wallet (
            <Text color="text100" as="a" href={`${ETHERSCAN_URL}/address/${userAddress}`} target="_blank" rel="noreferrer">
              {formattedUserAddress}
            </Text>
            ), then purchase one of the listed tokens with&nbsp;
            <Text
              color="text100"
              as="a"
              href={`${ETHERSCAN_URL}/token/${salesCurrencyData?.address}`}
              target="_blank"
              rel="noreferrer"
            >
              {salesCurrencyData?.symbol}
            </Text>
            . With a single transaction, you will be able to swap and submit the purchase.
          </Text>
        </Box>
      )}
    </>
  )
}
