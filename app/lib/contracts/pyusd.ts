import { ethers } from 'ethers'

// PYUSD Token Contract ABI (ERC20 + specific PYUSD functions)
export const PYUSD_ABI = [
  // Standard ERC20 functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  
  // PYUSD specific functions (if any)
  'function pause() returns (bool)',
  'function unpause() returns (bool)',
  'function paused() view returns (bool)',
]

export interface PyusdContract extends ethers.Contract {
  name(): Promise<string>
  symbol(): Promise<string>
  decimals(): Promise<number>
  totalSupply(): Promise<ethers.BigNumber>
  balanceOf(owner: string): Promise<ethers.BigNumber>
  transfer(to: string, amount: ethers.BigNumber): Promise<ethers.ContractTransaction>
  transferFrom(from: string, to: string, amount: ethers.BigNumber): Promise<ethers.ContractTransaction>
  approve(spender: string, amount: ethers.BigNumber): Promise<ethers.ContractTransaction>
  allowance(owner: string, spender: string): Promise<ethers.BigNumber>
}

export interface TransactionDetails {
  hash: string
  from: string
  to: string
  amount: string
  gasUsed?: string
  gasPrice?: string
  blockNumber?: number
  timestamp?: number
  confirmations?: number
  status?: 'pending' | 'confirmed' | 'failed'
}

export interface PaymentRequest {
  fromAddress: string
  toAddress: string
  amount: number // Amount in USD (will be converted to PYUSD units)
  description?: string
  groupId?: string
  expenseId?: string
}