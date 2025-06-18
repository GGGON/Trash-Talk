import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'History Platform',
  projectId: 'd3b352d61763ae30f507a6d41ba13544',
  chains: [sepolia],
  ssr: true,
  
}); 