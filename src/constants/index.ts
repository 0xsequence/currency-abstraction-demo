// sales params
export const NFT_TOKEN_ADDRESS = import.meta.env.VITE_NFT_TOKEN_ADDRESS
export const SALES_CONTRACT_ADDRESS = import.meta.env.VITE_SALES_CONTRACT_ADDRESS
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID)
export const ETHERSCAN_URL = import.meta.env.VITE_ETHERSCAN_URL
export const TRANSACTION_CONFIRMATIONS = Number(import.meta.env.VITE_TRANSACTION_CONFIRMATIONS)

interface SaleItem {
  tokenId: string
}

export const itemsForSales: SaleItem[] = [
  {
    tokenId: '1'
  },
  {
    tokenId: '2'
  },
  {
    tokenId: '3'
  },
  {
    tokenId: '4'
  },
  {
    tokenId: '5'
  },
  {
    tokenId: '6'
  }
]
