export enum PaymentErrorType {
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  NETWORK_ERROR = 'network_error',
  INVALID_ADDRESS = 'invalid_address',
  TRANSACTION_FAILED = 'transaction_failed',
  PAYPAL_ERROR = 'paypal_error',
  WALLET_ERROR = 'wallet_error',
  USER_REJECTED = 'user_rejected',
  UNKNOWN_ERROR = 'unknown_error',
}

export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  details?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export class PaymentErrorHandler {
  static parseError(error: any): PaymentError {
    // Handle ethers/blockchain errors
    if (error?.code) {
      switch (error.code) {
        case 'INSUFFICIENT_FUNDS':
          return {
            type: PaymentErrorType.INSUFFICIENT_BALANCE,
            message: 'Insufficient funds in wallet',
            details: 'Not enough ETH for gas fees or PYUSD tokens for transfer',
            recoverable: true,
            suggestedAction: 'Add more funds to your wallet or try PayPal instead',
          };
        case 'USER_REJECTED':
        case 4001:
          return {
            type: PaymentErrorType.USER_REJECTED,
            message: 'Transaction cancelled',
            details: 'User rejected the transaction in their wallet',
            recoverable: true,
            suggestedAction: 'Please approve the transaction to continue',
          };
        case 'NETWORK_ERROR':
        case -32002:
          return {
            type: PaymentErrorType.NETWORK_ERROR,
            message: 'Network connection error',
            details: 'Unable to connect to the blockchain network',
            recoverable: true,
            suggestedAction: 'Check your internet connection and try again',
          };
        case 'INVALID_ARGUMENT':
          return {
            type: PaymentErrorType.INVALID_ADDRESS,
            message: 'Invalid wallet address',
            details: 'The recipient wallet address is not valid',
            recoverable: false,
            suggestedAction: 'Please contact support',
          };
        default:
          break;
      }
    }

    // Handle PayPal errors
    if (error?.response?.data) {
      const paypalError = error.response.data;
      return {
        type: PaymentErrorType.PAYPAL_ERROR,
        message: 'PayPal payment failed',
        details: paypalError.message || paypalError.error_description || 'Unknown PayPal error',
        recoverable: true,
        suggestedAction: 'Try again or use PYUSD payment instead',
      };
    }

    // Handle wallet connection errors
    if (error?.message?.includes('wallet') || error?.message?.includes('MetaMask')) {
      return {
        type: PaymentErrorType.WALLET_ERROR,
        message: 'Wallet connection error',
        details: error.message,
        recoverable: true,
        suggestedAction: 'Please ensure your wallet is connected and try again',
      };
    }

    // Handle insufficient balance
    if (error?.message?.toLowerCase().includes('insufficient')) {
      return {
        type: PaymentErrorType.INSUFFICIENT_BALANCE,
        message: 'Insufficient balance',
        details: error.message,
        recoverable: true,
        suggestedAction: 'Add more funds to your account',
      };
    }

    // Handle network errors
    if (error?.message?.toLowerCase().includes('network') || 
        error?.message?.toLowerCase().includes('connection') ||
        error?.code === 'NETWORK_ERROR') {
      return {
        type: PaymentErrorType.NETWORK_ERROR,
        message: 'Network error',
        details: error.message || 'Connection to payment network failed',
        recoverable: true,
        suggestedAction: 'Check your internet connection and try again',
      };
    }

    // Handle transaction failures
    if (error?.message?.toLowerCase().includes('transaction') ||
        error?.message?.toLowerCase().includes('reverted')) {
      return {
        type: PaymentErrorType.TRANSACTION_FAILED,
        message: 'Transaction failed',
        details: error.message,
        recoverable: true,
        suggestedAction: 'Try again with higher gas fees or check contract state',
      };
    }

    // Default unknown error
    return {
      type: PaymentErrorType.UNKNOWN_ERROR,
      message: 'Payment failed',
      details: error?.message || 'An unknown error occurred',
      recoverable: true,
      suggestedAction: 'Please try again or contact support',
    };
  }

  static getRetryStrategy(errorType: PaymentErrorType): {
    shouldRetry: boolean;
    maxRetries: number;
    backoffMs: number;
  } {
    switch (errorType) {
      case PaymentErrorType.NETWORK_ERROR:
        return { shouldRetry: true, maxRetries: 3, backoffMs: 2000 };
      case PaymentErrorType.TRANSACTION_FAILED:
        return { shouldRetry: true, maxRetries: 2, backoffMs: 5000 };
      case PaymentErrorType.PAYPAL_ERROR:
        return { shouldRetry: true, maxRetries: 2, backoffMs: 3000 };
      case PaymentErrorType.USER_REJECTED:
      case PaymentErrorType.INSUFFICIENT_BALANCE:
      case PaymentErrorType.INVALID_ADDRESS:
        return { shouldRetry: false, maxRetries: 0, backoffMs: 0 };
      default:
        return { shouldRetry: true, maxRetries: 1, backoffMs: 1000 };
    }
  }

  static formatErrorForUser(error: PaymentError): string {
    const emoji = this.getErrorEmoji(error.type);
    return `${emoji} ${error.message}\n\n${error.suggestedAction || 'Please try again.'}`;
  }

  static getErrorEmoji(errorType: PaymentErrorType): string {
    switch (errorType) {
      case PaymentErrorType.INSUFFICIENT_BALANCE: return '💰';
      case PaymentErrorType.NETWORK_ERROR: return '🌐';
      case PaymentErrorType.USER_REJECTED: return '🚫';
      case PaymentErrorType.WALLET_ERROR: return '👛';
      case PaymentErrorType.PAYPAL_ERROR: return '💳';
      case PaymentErrorType.TRANSACTION_FAILED: return '⚠️';
      case PaymentErrorType.INVALID_ADDRESS: return '🔍';
      default: return '❌';
    }
  }
}

// Utility function for retrying operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  errorType: PaymentErrorType,
  context?: string
): Promise<T> {
  const strategy = PaymentErrorHandler.getRetryStrategy(errorType);
  
  if (!strategy.shouldRetry) {
    return await operation();
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying ${context || 'operation'}, attempt ${attempt}/${strategy.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, strategy.backoffMs * attempt));
      }
      
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`${context || 'Operation'} failed, attempt ${attempt + 1}/${strategy.maxRetries + 1}:`, error);
      
      // If this is the last attempt, don't wait
      if (attempt === strategy.maxRetries) {
        break;
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

// Development helper for testing error scenarios
export const DEV_ERROR_SIMULATION = {
  SIMULATE_INSUFFICIENT_FUNDS: false,
  SIMULATE_NETWORK_ERROR: false,
  SIMULATE_USER_REJECTION: false,
  SIMULATE_PAYPAL_ERROR: false,
};

export function simulateError(): PaymentError | null {
  if (process.env.NODE_ENV !== 'development') return null;
  
  if (DEV_ERROR_SIMULATION.SIMULATE_INSUFFICIENT_FUNDS) {
    return {
      type: PaymentErrorType.INSUFFICIENT_BALANCE,
      message: 'Insufficient PYUSD balance (simulated)',
      recoverable: true,
      suggestedAction: 'This is a simulated error for testing',
    };
  }
  
  if (DEV_ERROR_SIMULATION.SIMULATE_NETWORK_ERROR) {
    return {
      type: PaymentErrorType.NETWORK_ERROR,
      message: 'Network connection failed (simulated)',
      recoverable: true,
      suggestedAction: 'This is a simulated error for testing',
    };
  }
  
  return null;
}