import { Box, Button, Card, Collapsible, Spinner, Text, useMediaQuery } from '@0xsequence/design-system'
import { Hex } from 'viem'
import { useAccount, useDisconnect } from 'wagmi'

import { ItemsForSale } from './ItemsForSale'
import { NFT_TOKEN_ADDRESS, SALES_CONTRACT_ADDRESS, CHAIN_ID, ETHERSCAN_URL } from '../constants'
import { useContractInfo } from '../hooks/data'
import { useSalesCurrency } from '../hooks/useSalesCurrency'
import { Balance } from './Balance'

export const Connected = () => {
  const { address: userAddress } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: contractInfoData, isLoading: contractInfoIsLoading } = useContractInfo(CHAIN_ID, NFT_TOKEN_ADDRESS)
  const { data: currencyData } = useSalesCurrency()

  const AddressDisplay = ({ label, address }: { label: string; address: string | Hex | undefined }) => {
    const isMobile = useMediaQuery('isMobile')

    return (
      <Box justifyContent="space-between" {...(isMobile ? { flexDirection: 'column' } : {})}>
        <Text variant="normal" color="text100" style={{ minWidth: 205 }}>
          {label}: &nbsp;
        </Text>
        <Text
          variant="normal"
          as="a"
          color="text100"
          href={`${ETHERSCAN_URL}/address/${address}`}
          target="_blank"
          rel="noreferrer"
          ellipsis
        >
          {address}
        </Text>
      </Box>
    )
  }

  const collectionName = contractInfoData?.name
  const collectionDescription = contractInfoData?.extensions?.description

  return (
    <Card
      justifyContent="center"
      alignItems="center"
      width="4"
      flexDirection="column"
      gap="3"
      style={{ width: '100%', maxWidth: 700 }}
    >
      <Balance />

      <Collapsible label="Collection Info">
        {contractInfoIsLoading ? (
          <Box justifyContent="center" alignItems="center">
            <Spinner />
          </Box>
        ) : (
          <Box gap="2" flexDirection="column">
            <Box gap="1" flexDirection="column">
              <Text variant="normal" color="text100" style={{ fontWeight: '700' }}>
                Name:
              </Text>
              <Text variant="normal" color="text100">
                {collectionName}
              </Text>
            </Box>
            <Box gap="1" flexDirection="column">
              <Text variant="normal" color="text100" style={{ fontWeight: '700' }}>
                Description:
              </Text>
              <Text variant="normal" color="text100">
                {collectionDescription}
              </Text>
            </Box>
          </Box>
        )}
      </Collapsible>

      <Collapsible label="Stuff for Nerds">
        <Box gap="1" flexDirection="column">
          <AddressDisplay label="User Address" address={userAddress} />
          <AddressDisplay label="Sales Contract" address={SALES_CONTRACT_ADDRESS} />
          <AddressDisplay label="NFT token Contract" address={NFT_TOKEN_ADDRESS} />
          <AddressDisplay label="Payment currency Address" address={currencyData?.address || ''} />
        </Box>
      </Collapsible>

      <ItemsForSale chainId={CHAIN_ID} collectionAddress={NFT_TOKEN_ADDRESS} />

      <Button label="Disconnect" onClick={disconnect} />
    </Card>
  )
}
