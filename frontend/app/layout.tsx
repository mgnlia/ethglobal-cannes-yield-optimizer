import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YieldBridge — Cross-Chain Yield Optimizer',
  description: 'AI-powered cross-chain yield optimization with LayerZero V2. Maximize DeFi returns with Claude LLM reasoning.',
  keywords: ['DeFi', 'yield optimizer', 'LayerZero', 'cross-chain', 'Aave', 'Compound', 'ETHGlobal'],
  openGraph: {
    title: 'YieldBridge — Cross-Chain Yield Optimizer',
    description: 'AI-powered cross-chain yield optimization with LayerZero V2',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0f1e] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
