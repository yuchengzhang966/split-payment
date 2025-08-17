import { ethers } from 'ethers'
import { PYUSD_ABI, PyusdContract, TransactionDetails, PaymentRequest } from '../contracts/pyusd'
import { BLOCKCHAIN_CONFIG, PYUSD_CONFIG, TRANSACTION_CONFIG } from '../constants'

export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider | null = null
  private contract: PyusdContract | null = null

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    try {
      if (BLOCKCHAIN_CONFIG.infuraProjectId) {
        const rpcUrl = `https://${BLOCKCHAIN_CONFIG.network}.infura.io/v3/${BLOCKCHAIN_CONFIG.infuraProjectId}`
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      } else {
        // Fallback to public RPC (less reliable)
        const publicRpcUrls = {
          mainnet: 'https://eth.public-rpc.com',
          sepolia: 'https://rpc.sepolia.org',
        }
        this.provider = new ethers.providers.JsonRpcProvider(
          publicRpcUrls[BLOCKCHAIN_CONFIG.network as keyof typeof publicRpcUrls] || publicRpcUrls.mainnet
        )
      }

      // Initialize contract
      this.contract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.pyusdContractAddress,
        PYUSD_ABI,
        this.provider
      ) as PyusdContract
    } catch (error) {
      console.error('Failed to initialize blockchain provider:', error)
    }
  }

  // Convert USD amount to PYUSD units (considering 6 decimals)
  private usdToPyusdUnits(usdAmount: number): ethers.BigNumber {
    return ethers.utils.parseUnits(usdAmount.toFixed(6), PYUSD_CONFIG.decimals)
  }

  // Convert PYUSD units to USD amount
  private pyusdUnitsToUsd(pyusdUnits: ethers.BigNumber): number {
    return parseFloat(ethers.utils.formatUnits(pyusdUnits, PYUSD_CONFIG.decimals))
  }

  // Get PYUSD balance for an address
  async getBalance(address: string): Promise<number> {
    try {
      if (!this.contract) throw new Error('Contract not initialized')
      
      const balance = await this.contract.balanceOf(address)
      return this.pyusdUnitsToUsd(balance)
    } catch (error) {
      console.error('Error fetching PYUSD balance:', error)
      throw new Error('Failed to fetch balance')
    }
  }

  // Check if an address has sufficient balance
  async hasSufficientBalance(address: string, requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(address)
      return balance >= requiredAmount
    } catch (error) {
      console.error('Error checking balance:', error)
      return false
    }
  }

  // Approve PYUSD spending (needed before transfers)
  async approveSpending(
    signer: ethers.Signer, 
    spenderAddress: string, 
    amount: number
  ): Promise<TransactionDetails> {
    try {
      if (!this.contract) throw new Error('Contract not initialized')
      
      const contractWithSigner = this.contract.connect(signer)
      const pyusdAmount = this.usdToPyusdUnits(amount)
      
      const tx = await contractWithSigner.approve(spenderAddress, pyusdAmount, {
        gasLimit: TRANSACTION_CONFIG.gasLimit,
        gasPrice: TRANSACTION_CONFIG.gasPrice,
      })

      return {
        hash: tx.hash,
        from: await signer.getAddress(),
        to: spenderAddress,
        amount: amount.toString(),
        status: 'pending',
      }
    } catch (error) {
      console.error('Error approving PYUSD spending:', error)
      throw new Error('Failed to approve spending')
    }
  }

  // Transfer PYUSD tokens
  async transferPyusd(
    signer: ethers.Signer,
    paymentRequest: PaymentRequest
  ): Promise<TransactionDetails> {
    try {
      if (!this.contract) throw new Error('Contract not initialized')
      
      const contractWithSigner = this.contract.connect(signer)
      const pyusdAmount = this.usdToPyusdUnits(paymentRequest.amount)
      
      // Check balance before transfer
      const senderAddress = await signer.getAddress()
      const hasBalance = await this.hasSufficientBalance(senderAddress, paymentRequest.amount)
      
      if (!hasBalance) {
        throw new Error('Insufficient PYUSD balance')
      }

      const tx = await contractWithSigner.transfer(paymentRequest.toAddress, pyusdAmount, {
        gasLimit: TRANSACTION_CONFIG.gasLimit,
        gasPrice: TRANSACTION_CONFIG.gasPrice,
      })

      return {
        hash: tx.hash,
        from: senderAddress,
        to: paymentRequest.toAddress,
        amount: paymentRequest.amount.toString(),
        status: 'pending',
      }
    } catch (error) {
      console.error('Error transferring PYUSD:', error)
      throw new Error('Failed to transfer PYUSD')
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(txHash: string): Promise<TransactionDetails> {
    try {
      if (!this.provider) throw new Error('Provider not initialized')
      
      const receipt = await this.provider.waitForTransaction(
        txHash, 
        TRANSACTION_CONFIG.confirmations
      )

      return {
        hash: receipt.transactionHash,
        from: receipt.from,
        to: receipt.to || '',
        amount: '0', // Would need to parse logs to get exact amount
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
      }
    } catch (error) {
      console.error('Error waiting for transaction:', error)
      throw new Error('Failed to confirm transaction')
    }
  }

  // Get transaction details
  async getTransaction(txHash: string): Promise<TransactionDetails | null> {
    try {
      if (!this.provider) throw new Error('Provider not initialized')
      
      const tx = await this.provider.getTransaction(txHash)
      const receipt = await this.provider.getTransactionReceipt(txHash)
      
      if (!tx) return null

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        amount: '0', // Would need to parse logs for PYUSD amount
        gasUsed: receipt?.gasUsed?.toString(),
        gasPrice: tx.gasPrice?.toString(),
        blockNumber: receipt?.blockNumber,
        confirmations: receipt?.confirmations,
        status: receipt?.status === 1 ? 'confirmed' : receipt?.status === 0 ? 'failed' : 'pending',
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return null
    }
  }

  // Estimate gas for PYUSD transfer
  async estimateTransferGas(
    signer: ethers.Signer,
    toAddress: string,
    amount: number
  ): Promise<ethers.BigNumber> {
    try {
      if (!this.contract) throw new Error('Contract not initialized')
      
      const contractWithSigner = this.contract.connect(signer)
      const pyusdAmount = this.usdToPyusdUnits(amount)
      
      return await contractWithSigner.estimateGas.transfer(toAddress, pyusdAmount)
    } catch (error) {
      console.error('Error estimating gas:', error)
      return ethers.BigNumber.from(TRANSACTION_CONFIG.gasLimit)
    }
  }

  // Get current gas price
  async getGasPrice(): Promise<ethers.BigNumber> {
    try {
      if (!this.provider) throw new Error('Provider not initialized')
      
      return await this.provider.getGasPrice()
    } catch (error) {
      console.error('Error fetching gas price:', error)
      return ethers.BigNumber.from(TRANSACTION_CONFIG.gasPrice)
    }
  }

  // Health check for the service
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.provider || !this.contract) return false
      
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()
      
      return network.chainId > 0 && blockNumber > 0
    } catch (error) {
      console.error('Blockchain service health check failed:', error)
      return false
    }
  }
}