// sales params
export const NFT_TOKEN_ADDRESS = '0xe330d543e9189450c36dc873aa3ab14106b1ee87'
export const SALES_CONTRACT_ADDRESS = '0xfdd0d596350a78c3852a43d3b5910154b7c644db'
export const CHAIN_ID = 11155111

// Assumption that all tokens have the same price...
export const UNITARY_PRICE_RAW = '100000'

interface SaleItem {
  priceRaw: string,
  tokenId: string,
}

export const itemsForSales: SaleItem[] = [
  {
    tokenId: '1',
    priceRaw: '100000',
  },
  {
    tokenId: '2',
    priceRaw: '100000'
  },
  {
    tokenId: '3',
    priceRaw: '100000'
  },
  {
    tokenId: '4',
    priceRaw: '100000'
  },
  {
    tokenId: '5',
    priceRaw: '100000'
  },
  {
    tokenId: '6',
    priceRaw: '100000'
  }
] 