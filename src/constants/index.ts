// sales params
export const NFT_TOKEN_ADDRESS = '0xdeb398f41ccd290ee5114df7e498cf04fac916cb'
export const SALES_CONTRACT_ADDRESS = '0xe65b75eb7c58ffc0bf0e671d64d0e1c6cd0d3e5b'
export const CHAIN_ID = 137
export const ETHERSCAN_URL = 'https://polygonscan.com'
export const TRANSACTION_CONFIRMATIONS = 4

// Params for testing
// export const NFT_TOKEN_ADDRESS = '0xe330d543e9189450c36dc873aa3ab14106b1ee87'
// export const SALES_CONTRACT_ADDRESS = '0xfdd0d596350a78c3852a43d3b5910154b7c644db'
// export const CHAIN_ID = 11155111
// export const ETHERSCAN_URL = 'https://sepolia.etherscan.io'
export const SWAP_CURRENCY = {
  name: 'Wrapped Eth',
  url: 'https://sepolia.etherscan.io/token/0xfff9976782d46cc05630d1f6ebab18b2324d6b14#writeContract'
}

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
