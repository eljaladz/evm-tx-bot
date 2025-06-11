export const networks = {
  sepolia: {
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    chainName: "Sepolia",
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "http://eth-sepolia.blockscout.com/",
  },
  tbnb: {
    rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    chainName: "BSC Testnet",
    nativeCurrency: {
      name: "Testnet BNB",
      symbol: "tBNB",
      decimals: 18,
    },
    blockExplorerUrl: "https://testnet.bsctrace.com/",
  },
  // Add other EVM network here
};