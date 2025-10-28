import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Mezo Testnet configuration
export const mezoTestnet = defineChain({
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Bitcoin',
    symbol: 'BTC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test.mezo.org'],
      webSocket: ['wss://rpc-ws.test.mezo.org'],
    },
    public: {
      http: ['https://rpc.test.mezo.org'],
      webSocket: ['wss://rpc-ws.test.mezo.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mezo Explorer',
      url: 'https://explorer.test.mezo.org',
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'DCA Protocol',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID from https://cloud.walletconnect.com
  chains: [mezoTestnet],
  ssr: false,
});
