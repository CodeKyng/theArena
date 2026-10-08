export type Listing = {
  title: string
  org: string
  logo: string
  kind: string
  description: string
  tags: string[]
  reward?: string
  color: string
  featured?: boolean
}

export const listings: Listing[] = [
  {
    title: 'Protocol Growth Lead', org: 'Optimism Collective', logo: 'O', kind: 'Opportunity',
    description: 'Help shape the next chapter of the Superchain. We’re looking for a growth-minded builder to lead ecosystem initiatives.',
    tags: ['Growth', 'Remote', 'Full-time'], reward: '$8,000 / mo', color: 'red', featured: true,
  },
  {
    title: 'Onchain identity for everyone', org: 'Base', logo: '◉', kind: 'Grant',
    description: 'Build tools that make onchain identity accessible, composable, and useful to the next billion users.',
    tags: ['Identity', 'Base', 'Open call'], reward: 'Up to $25,000', color: 'blue',
  },
  {
    title: 'Solidity Security Researcher', org: 'Sherlock', logo: 'S', kind: 'Bounty',
    description: 'Review a new lending protocol and uncover vulnerabilities before mainnet launch. Make DeFi safer.',
    tags: ['Security', 'Solidity', '2 weeks'], reward: '10,000 USDC', color: 'purple',
  },
  {
    title: 'ETHGlobal Bangkok', org: 'ETHGlobal', logo: '✳', kind: 'Hackathon',
    description: 'Three days. One city. Infinite possibilities. Meet your next teammates and ship something extraordinary.',
    tags: ['In person', 'Ethereum', 'Nov 15–17'], reward: '$500k+ prizes', color: 'pink',
  },
]

export const popularTopics = [
  { title: 'Zero-knowledge proofs', count: '2.4k builders', icon: '◈', color: 'violet' },
  { title: 'DeFi & open finance', count: '1.8k builders', icon: '◉', color: 'cyan' },
  { title: 'AI × Web3', count: '1.2k builders', icon: '✳', color: 'orange' },
]
