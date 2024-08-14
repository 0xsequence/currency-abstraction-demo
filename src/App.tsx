import { Box } from '@0xsequence/design-system'
import { useAccount } from 'wagmi'

import { Connected } from './components/Connected'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { NotConnected } from './components/NotConnected'

function App() {
  const { isConnected } = useAccount()

  const Content = () => {
    if (!isConnected) {
      return <NotConnected />
    }

    return <Connected />
  }

  return (
    <Box
      padding="4"
      justifyContent="center"
      alignItems="center"
      width="full"
      gap="2"
      flexDirection="column"
      background="backgroundPrimary"
      style={{ minHeight: '100vh' }}
    >
      <Header />
      <Content />
      <Footer />
    </Box>
  )
}

export default App
