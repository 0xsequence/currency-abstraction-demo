import { Button, Card, Text } from '@0xsequence/design-system'
import { useOpenConnectModal } from '@0xsequence/kit'

export const NotConnected = () => {
  const { setOpenConnectModal } = useOpenConnectModal()

  return (
    <Card justifyContent="center" alignItems="center" flexDirection="column" gap="3" style={{ maxWidth: 700 }}>
      <Text color="text100">Not Connected</Text>
      <Button label="Connect" onClick={() => setOpenConnectModal(true)} />
    </Card>
  )
}