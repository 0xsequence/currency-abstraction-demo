import React from 'react'

import { ThemeProvider } from '@0xsequence/design-system'
import { KitProvider } from '@0xsequence/kit'
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors'
import { KitCheckoutProvider } from '@0xsequence/kit-checkout'
import { ChainId } from '@0xsequence/network'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Transport } from 'viem'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { polygon, Chain } from 'wagmi/chains'

import { useProjectAccessKey } from '../hooks/useProjectAccessKey'

const queryClient = new QueryClient()

export const Providers = ({
  children
}: { children: React.ReactNode }) => {
  const projectAccessKey = useProjectAccessKey()
  const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c65a6cb1aa83c4e24500130f23a437d8'
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "970987756660-35a6tc48hvi8cev9cnknp0iugv9poa23.apps.googleusercontent.com";
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID || 'com.horizon.sequence.waas'
  const waasConfigKey = import.meta.env.VITE_WAAS_CONFIG_KEY || "eyJwcm9qZWN0SWQiOjEzNjM5LCJycGNTZXJ2ZXIiOiJodHRwczovL3dhYXMuc2VxdWVuY2UuYXBwIn0=";
  const appleRedirectURI = window.location.origin + window.location.pathname

  const connectors = getDefaultWaasConnectors({
    walletConnectProjectId,
    defaultChainId: ChainId.POLYGON,
    appName: 'demo app',
    projectAccessKey,
    waasConfigKey,
    googleClientId,
    appleClientId,
    appleRedirectURI,
  })

  const chains = [polygon] as [Chain, ...Chain[]]
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