"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseSepolia } from "viem/chains";
import { http } from "viem";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "Lucra App",
  projectId: "773755cc8d60c42417a9024fe65d88dc",
  chains: [baseSepolia],
  transports: {
    // [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
    // [base.id]: http("https://mainnet.base.org"), 
    // [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"), 
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
  ssr: true,
});

// Custom theme with purple accent color
const customTheme = {
  lightMode: lightTheme({
    accentColor: '#6B48FF',
    accentColorForeground: 'white',
    borderRadius: 'large',
    fontStack: 'system',
  }),
  darkMode: darkTheme({
    accentColor: '#6B48FF',
    accentColorForeground: 'white',
    borderRadius: 'large',
    fontStack: 'system',
  }),
};

interface WagmiProviderWrapperProps {
  children: ReactNode;
}

export default function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={customTheme}
          appInfo={{
            appName: 'Lucra App',
            disclaimer: ({ Text, Link }) => (
              <Text>
                By connecting your wallet, you agree to the{' '}
                <Link href="https://termsofservice.xyz">Terms of Service</Link> and
                acknowledge you have read and understand the protocol{' '}
                <Link href="https://disclaimer.xyz">Disclaimer</Link>
              </Text>
            ),
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}