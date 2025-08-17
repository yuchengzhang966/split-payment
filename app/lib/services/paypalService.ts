import { PAYPAL_CONFIG } from '../constants'

export interface PayPalPayment {
  id: string
  amount: number
  currency: string
  description: string
  fromUser: string
  toUser: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created: Date
  updated: Date
}

export interface PayPalPaymentRequest {
  amount: number
  currency: string
  description: string
  fromUserEmail: string
  toUserEmail: string
  groupId?: string
  expenseId?: string
}

export interface PayPalOrder {
  id: string
  status: string
  purchase_units: Array<{
    amount: {
      currency_code: string
      value: string
    }
    description: string
  }>
  create_time: string
  update_time: string
}

export class PayPalService {
  private clientId: string
  private clientSecret: string
  private baseUrl: string

  constructor() {
    this.clientId = PAYPAL_CONFIG.clientId
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
    this.baseUrl = PAYPAL_CONFIG.environment === 'sandbox' 
      ? 'https://api.sandbox.paypal.com'
      : 'https://api.paypal.com'
  }

  // Get PayPal access token
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
      
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })

      if (!response.ok) {
        throw new Error('Failed to get PayPal access token')
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Error getting PayPal access token:', error)
      throw new Error('PayPal authentication failed')
    }
  }

  // Create a PayPal order for payment
  async createOrder(paymentRequest: PayPalPaymentRequest): Promise<PayPalOrder> {
    try {
      const accessToken = await this.getAccessToken()
      
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: paymentRequest.currency,
            value: paymentRequest.amount.toFixed(2),
          },
          description: paymentRequest.description,
          payee: {
            email_address: paymentRequest.toUserEmail,
          },
        }],
        application_context: {
          brand_name: 'PayHive',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        },
      }

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('PayPal order creation failed:', errorData)
        throw new Error('Failed to create PayPal order')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating PayPal order:', error)
      throw new Error('Failed to create payment order')
    }
  }

  // Capture a PayPal order (complete the payment)
  async captureOrder(orderId: string): Promise<PayPalOrder> {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('PayPal order capture failed:', errorData)
        throw new Error('Failed to capture PayPal order')
      }

      return await response.json()
    } catch (error) {
      console.error('Error capturing PayPal order:', error)
      throw new Error('Failed to complete payment')
    }
  }

  // Get order details
  async getOrderDetails(orderId: string): Promise<PayPalOrder> {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get PayPal order details')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting PayPal order details:', error)
      throw new Error('Failed to fetch order details')
    }
  }

  // Create a payout (send money to someone)
  async createPayout(paymentRequest: PayPalPaymentRequest): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      
      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `PayHive_${Date.now()}`,
          email_subject: 'PayHive Payment',
          email_message: paymentRequest.description,
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: {
            value: paymentRequest.amount.toFixed(2),
            currency: paymentRequest.currency,
          },
          receiver: paymentRequest.toUserEmail,
          note: paymentRequest.description,
          sender_item_id: `item_${Date.now()}`,
        }],
      }

      const response = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payoutData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('PayPal payout creation failed:', errorData)
        throw new Error('Failed to create PayPal payout')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating PayPal payout:', error)
      throw new Error('Failed to create payout')
    }
  }

  // Send payment request via PayPal
  async sendPaymentRequest(paymentRequest: PayPalPaymentRequest): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      
      const invoiceData = {
        detail: {
          currency_code: paymentRequest.currency,
          note: paymentRequest.description,
        },
        amount: {
          breakdown: {
            item_total: {
              currency_code: paymentRequest.currency,
              value: paymentRequest.amount.toFixed(2),
            },
          },
        },
        primary_recipients: [{
          billing_info: {
            email_address: paymentRequest.fromUserEmail,
          },
        }],
        invoicer: {
          email_address: paymentRequest.toUserEmail,
        },
        items: [{
          name: 'PayHive Expense Settlement',
          description: paymentRequest.description,
          quantity: '1',
          unit_amount: {
            currency_code: paymentRequest.currency,
            value: paymentRequest.amount.toFixed(2),
          },
        }],
      }

      const response = await fetch(`${this.baseUrl}/v2/invoicing/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('PayPal payment request failed:', errorData)
        throw new Error('Failed to send payment request')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending PayPal payment request:', error)
      throw new Error('Failed to send payment request')
    }
  }

  // Validate PayPal configuration
  async validateConfiguration(): Promise<boolean> {
    try {
      if (!this.clientId || !this.clientSecret) {
        console.error('PayPal credentials not configured')
        return false
      }

      // Try to get access token to validate credentials
      await this.getAccessToken()
      return true
    } catch (error) {
      console.error('PayPal configuration validation failed:', error)
      return false
    }
  }

  // Health check for PayPal service
  async isHealthy(): Promise<boolean> {
    try {
      return await this.validateConfiguration()
    } catch (error) {
      console.error('PayPal service health check failed:', error)
      return false
    }
  }
}