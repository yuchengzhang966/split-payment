import { ethers } from 'ethers'
import { BlockchainService } from './blockchainService'
import { PayPalService, PayPalPaymentRequest } from './paypalService'
import { PaymentRequest, TransactionDetails } from '../contracts/pyusd'
import { PaymentErrorHandler, retryOperation, simulateError } from '../utils/errorHandler'

export interface PaymentMethod {
  type: 'pyusd' | 'paypal'
  name: string
  description: string
  icon: string
  enabled: boolean
}

export interface PaymentResult {
  success: boolean
  transactionId: string
  method: 'pyusd' | 'paypal'
  amount: number
  fromAddress: string
  toAddress: string
  status: 'pending' | 'completed' | 'failed'
  timestamp: Date
  gasUsed?: string
  fees?: number
  error?: string
}

export interface SettlementRequest {
  fromUserEmail: string
  fromWalletAddress: string
  toUserEmail: string
  toWalletAddress: string
  amount: number
  description: string
  groupId: string
  expenseId?: string
  preferredMethod?: 'pyusd' | 'paypal'
}

export class PaymentService {
  private blockchainService: BlockchainService
  private paypalService: PayPalService

  constructor() {
    this.blockchainService = new BlockchainService()
    this.paypalService = new PayPalService()
  }

  // Get available payment methods
  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    const methods: PaymentMethod[] = []

    // Check PYUSD availability
    const pyusdEnabled = await this.blockchainService.isHealthy()
    methods.push({
      type: 'pyusd',
      name: 'PayPal USD (PYUSD)',
      description: 'Blockchain-powered stablecoin payments',
      icon: '🏦',
      enabled: pyusdEnabled,
    })

    // Check PayPal availability
    const paypalEnabled = await this.paypalService.isHealthy()
    methods.push({
      type: 'paypal',
      name: 'PayPal',
      description: 'Traditional PayPal payments',
      icon: '💳',
      enabled: paypalEnabled,
    })

    return methods
  }

  // Process settlement using PYUSD
  async settlePyusd(
    signer: ethers.Signer, 
    settlementRequest: SettlementRequest
  ): Promise<PaymentResult> {
    try {
      // Check for dev error simulation
      const simulatedError = simulateError();
      if (simulatedError) {
        throw new Error(simulatedError.message);
      }

      const paymentRequest: PaymentRequest = {
        fromAddress: settlementRequest.fromWalletAddress,
        toAddress: settlementRequest.toWalletAddress,
        amount: settlementRequest.amount,
        description: settlementRequest.description,
        groupId: settlementRequest.groupId,
        expenseId: settlementRequest.expenseId,
      }

      // Check balance first with retry
      const hasBalance = await retryOperation(
        () => this.blockchainService.hasSufficientBalance(
          settlementRequest.fromWalletAddress,
          settlementRequest.amount
        ),
        PaymentErrorHandler.parseError(new Error('Network error')).type,
        'Balance check'
      );

      if (!hasBalance) {
        const balanceError = PaymentErrorHandler.parseError(new Error('Insufficient PYUSD balance'));
        return {
          success: false,
          transactionId: '',
          method: 'pyusd',
          amount: settlementRequest.amount,
          fromAddress: settlementRequest.fromWalletAddress,
          toAddress: settlementRequest.toWalletAddress,
          status: 'failed',
          timestamp: new Date(),
          error: PaymentErrorHandler.formatErrorForUser(balanceError),
        }
      }

      // Execute the transfer with retry
      const txDetails = await retryOperation(
        () => this.blockchainService.transferPyusd(signer, paymentRequest),
        PaymentErrorHandler.parseError(new Error('Transaction failed')).type,
        'PYUSD transfer'
      );

      return {
        success: true,
        transactionId: txDetails.hash,
        method: 'pyusd',
        amount: settlementRequest.amount,
        fromAddress: txDetails.from,
        toAddress: txDetails.to,
        status: 'pending',
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('PYUSD settlement failed:', error)
      const parsedError = PaymentErrorHandler.parseError(error);
      
      return {
        success: false,
        transactionId: '',
        method: 'pyusd',
        amount: settlementRequest.amount,
        fromAddress: settlementRequest.fromWalletAddress,
        toAddress: settlementRequest.toWalletAddress,
        status: 'failed',
        timestamp: new Date(),
        error: PaymentErrorHandler.formatErrorForUser(parsedError),
      }
    }
  }

  // Process settlement using PayPal
  async settlePayPal(settlementRequest: SettlementRequest): Promise<PaymentResult> {
    try {
      const paypalRequest: PayPalPaymentRequest = {
        amount: settlementRequest.amount,
        currency: 'USD',
        description: settlementRequest.description,
        fromUserEmail: settlementRequest.fromUserEmail,
        toUserEmail: settlementRequest.toUserEmail,
        groupId: settlementRequest.groupId,
        expenseId: settlementRequest.expenseId,
      }

      // Create PayPal order
      const order = await this.paypalService.createOrder(paypalRequest)

      return {
        success: true,
        transactionId: order.id,
        method: 'paypal',
        amount: settlementRequest.amount,
        fromAddress: settlementRequest.fromUserEmail,
        toAddress: settlementRequest.toUserEmail,
        status: 'pending',
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('PayPal settlement failed:', error)
      return {
        success: false,
        transactionId: '',
        method: 'paypal',
        amount: settlementRequest.amount,
        fromAddress: settlementRequest.fromUserEmail,
        toAddress: settlementRequest.toUserEmail,
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Auto-select best payment method and process settlement
  async autoSettle(
    signer: ethers.Signer | null,
    settlementRequest: SettlementRequest
  ): Promise<PaymentResult> {
    const methods = await this.getAvailablePaymentMethods()
    const preferredMethod = settlementRequest.preferredMethod

    // Try preferred method first if specified and available
    if (preferredMethod) {
      const method = methods.find(m => m.type === preferredMethod && m.enabled)
      if (method) {
        if (preferredMethod === 'pyusd' && signer) {
          return await this.settlePyusd(signer, settlementRequest)
        } else if (preferredMethod === 'paypal') {
          return await this.settlePayPal(settlementRequest)
        }
      }
    }

    // Try PYUSD first (if available and signer provided)
    const pyusdMethod = methods.find(m => m.type === 'pyusd' && m.enabled)
    if (pyusdMethod && signer) {
      try {
        const result = await this.settlePyusd(signer, settlementRequest)
        if (result.success) return result
      } catch (error) {
        console.log('PYUSD failed, trying PayPal fallback:', error)
      }
    }

    // Fallback to PayPal
    const paypalMethod = methods.find(m => m.type === 'paypal' && m.enabled)
    if (paypalMethod) {
      return await this.settlePayPal(settlementRequest)
    }

    // No payment methods available
    return {
      success: false,
      transactionId: '',
      method: 'paypal',
      amount: settlementRequest.amount,
      fromAddress: settlementRequest.fromUserEmail,
      toAddress: settlementRequest.toUserEmail,
      status: 'failed',
      timestamp: new Date(),
      error: 'No payment methods available',
    }
  }

  // Wait for transaction confirmation
  async waitForConfirmation(
    transactionId: string, 
    method: 'pyusd' | 'paypal'
  ): Promise<PaymentResult> {
    try {
      if (method === 'pyusd') {
        const txDetails = await this.blockchainService.waitForTransaction(transactionId)
        return {
          success: txDetails.status === 'confirmed',
          transactionId: txDetails.hash,
          method: 'pyusd',
          amount: parseFloat(txDetails.amount),
          fromAddress: txDetails.from,
          toAddress: txDetails.to,
          status: txDetails.status === 'confirmed' ? 'completed' : (txDetails.status || 'failed'),
          timestamp: new Date(),
          gasUsed: txDetails.gasUsed,
        }
      } else {
        // For PayPal, we would need to check order status
        const orderDetails = await this.paypalService.getOrderDetails(transactionId)
        return {
          success: orderDetails.status === 'COMPLETED',
          transactionId: orderDetails.id,
          method: 'paypal',
          amount: parseFloat(orderDetails.purchase_units[0]?.amount?.value || '0'),
          fromAddress: '', // PayPal doesn't expose payer info easily
          toAddress: '', // PayPal doesn't expose payee info easily
          status: orderDetails.status === 'COMPLETED' ? 'completed' : 'pending',
          timestamp: new Date(orderDetails.update_time),
        }
      }
    } catch (error) {
      console.error('Error waiting for confirmation:', error)
      throw new Error('Failed to confirm transaction')
    }
  }

  // Get transaction status
  async getTransactionStatus(
    transactionId: string, 
    method: 'pyusd' | 'paypal'
  ): Promise<'pending' | 'completed' | 'failed'> {
    try {
      if (method === 'pyusd') {
        const txDetails = await this.blockchainService.getTransaction(transactionId)
        const status = txDetails?.status;
      return status === 'confirmed' ? 'completed' : (status || 'pending')
      } else {
        const orderDetails = await this.paypalService.getOrderDetails(transactionId)
        switch (orderDetails.status) {
          case 'COMPLETED': return 'completed'
          case 'APPROVED': return 'pending'
          case 'CREATED': return 'pending'
          default: return 'failed'
        }
      }
    } catch (error) {
      console.error('Error getting transaction status:', error)
      return 'failed'
    }
  }

  // Estimate transaction fees
  async estimateFees(
    settlementRequest: SettlementRequest, 
    method: 'pyusd' | 'paypal'
  ): Promise<number> {
    try {
      if (method === 'pyusd') {
        // For blockchain, estimate gas fees
        // This is a simplified estimation
        const gasPrice = await this.blockchainService.getGasPrice()
        const gasLimit = ethers.getBigInt(100000) // Estimated gas limit
        const gasCostWei = gasPrice * gasLimit
        const gasCostEth = parseFloat(ethers.formatEther(gasCostWei))
        
        // Convert ETH to USD (simplified - in production, use real price feeds)
        const ethToUsd = 2000 // Approximate ETH price
        return gasCostEth * ethToUsd
      } else {
        // PayPal fees are typically 2.9% + $0.30 for domestic payments
        return Math.max(settlementRequest.amount * 0.029 + 0.30, 0.30)
      }
    } catch (error) {
      console.error('Error estimating fees:', error)
      return 0
    }
  }
}