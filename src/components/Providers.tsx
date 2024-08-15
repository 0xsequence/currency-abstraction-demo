import React from 'react'

import { ThemeProvider } from '@0xsequence/design-system'
import { KitProvider } from '@0xsequence/kit'
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors'
import { KitCheckoutProvider } from '@0xsequence/kit-checkout'
import { ChainId } from '@0xsequence/network'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Transport } from 'viem'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { sepolia, Chain } from 'wagmi/chains'

import { useProjectAccessKey } from '../hooks/useProjectAccessKey'

const queryClient = new QueryClient()

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const projectAccessKey = useProjectAccessKey()
  const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID
  const waasConfigKey = import.meta.env.VITE_WAAS_CONFIG_KEY
  const appleRedirectURI = window.location.origin + window.location.pathname

  const connectors = getDefaultWaasConnectors({
    walletConnectProjectId,
    defaultChainId: ChainId.SEPOLIA,
    appName: 'demo app',
    projectAccessKey,
    waasConfigKey,
    googleClientId,
    appleClientId,
    appleRedirectURI
  })

  const chains = [sepolia] as [Chain, ...Chain[]]
  const transports = chains.reduce<Record<number, Transport>>((acc, chain) => {
    acc[chain.id] = http()
    return acc
  }, {})

  const wagmiConfig = createConfig({
    transports,
    chains,
    connectors
  })

  const kitConfig = {
    projectAccessKey,
    signIn: {
      projectName: 'Demo'
    }
  }

  return (
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <KitProvider config={kitConfig}>
            <KitCheckoutProvider>{children}</KitCheckoutProvider>
          </KitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
