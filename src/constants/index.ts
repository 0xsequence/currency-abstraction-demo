// sales params
export const NFT_TOKEN_ADDRESS = "0xe330d543e9189450c36dc873aa3ab14106b1ee87";
export const SALES_CONTRACT_ADDRESS =
  "0xfdd0d596350a78c3852a43d3b5910154b7c644db";
export const CHAIN_ID = 11155111;
export const ETHERSCAN_URL = "https://sepolia.etherscan.io";

interface SaleItem {
  tokenId: string;
}

export const itemsForSales: SaleItem[] = [
  {
    tokenId: "1",
  },
  {
    tokenId: "2",
  },
  {
    tokenId: "3",
  },
  {
    tokenId: "4",
  },
  {
    tokenId: "5",
  },
  {
    tokenId: "6",
  },
];
