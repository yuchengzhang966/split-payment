# PayPal & PYUSD Integration Setup Guide

## Overview

This guide will help you set up real PayPal API and PYUSD blockchain payments in your PayHive application.

## 🔧 Prerequisites

1. **PayPal Developer Account**: Sign up at [developer.paypal.com](https://developer.paypal.com)
2. **Infura Account**: Sign up at [infura.io](https://infura.io) for Ethereum RPC access
3. **Dynamic Wallet**: Already configured in your application
4. **Ethereum Wallet**: For testing PYUSD transactions

## 📝 PayPal Setup

### 1. Create PayPal Application

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/developer/applications)
2. Click "Create App"
3. Fill in the details:
   - **App Name**: PayHive
   - **Merchant**: Your business account
   - **Features**: Check "Payment" and "Checkout"
   - **Capabilities**: Select all needed options

### 2. Get API Credentials

1. From your app dashboard, copy:
   - **Client ID** (public)
   - **Client Secret** (private - keep secure!)

### 3. Configure Environment Variables

Update your `.env.local` file:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_actual_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_actual_paypal_client_secret_here
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=sandbox  # Use 'live' for production
```

## 🔗 Blockchain Setup (PYUSD)

### 1. Get Infura Project ID

1. Sign up at [Infura.io](https://infura.io)
2. Create a new project
3. Copy your **Project ID**

### 2. PYUSD Contract Information

- **Mainnet Address**: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
- **Network**: Ethereum Mainnet
- **Decimals**: 6 (PYUSD has 6 decimal places)

### 3. Update Environment Variables

```env
# Blockchain Configuration  
NEXT_PUBLIC_ETHEREUM_NETWORK=mainnet
NEXT_PUBLIC_PYUSD_CONTRACT_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
NEXT_PUBLIC_INFURA_PROJECT_ID=your_actual_infura_project_id_here
```

## 🧪 Testing Setup

### For PayPal Testing

1. Use PayPal's sandbox environment
2. Create test accounts at [PayPal Sandbox](https://developer.paypal.com/tools/sandbox/accounts)
3. Use sandbox credentials in development

### For PYUSD Testing

1. **Option A: Mainnet Testing** (Real money - use small amounts)
   - Get PYUSD from PayPal or exchanges
   - Use real ETH for gas fees

2. **Option B: Testnet Testing** (Recommended for development)
   - Deploy PYUSD on Sepolia testnet
   - Use testnet ETH and test PYUSD

## 🚀 Implementation Features

### Current Payment Features

✅ **PayPal Integration**
- Order creation and capture
- Payment processing
- Error handling and retries
- Webhook support ready

✅ **PYUSD Integration**
- ERC-20 token transfers
- Balance checking
- Gas estimation
- Transaction monitoring

✅ **Unified Payment Service**
- Auto-fallback between methods
- Fee estimation
- Transaction history
- Error recovery

## 🔄 Payment Flow

### PYUSD Flow
1. User selects PYUSD payment
2. Check wallet balance
3. Estimate gas fees
4. User approves transaction
5. Execute PYUSD transfer
6. Monitor confirmation
7. Update transaction status

### PayPal Flow
1. User selects PayPal payment
2. Create PayPal order
3. Redirect to PayPal
4. User completes payment
5. Capture payment
6. Update transaction status

## 🛠️ Development Commands

```bash
# Install dependencies (already done)
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🔍 Testing the Integration

### 1. PayPal Test

1. Start the app: `npm run dev`
2. Create a group and add expenses
3. Go to Ledger tab
4. Click "Settle Up"
5. Select PayPal method
6. Complete test payment

### 2. PYUSD Test

1. Ensure you have ETH for gas
2. Get some PYUSD in your wallet
3. Follow same steps as PayPal
4. Select PYUSD method
5. Approve transaction in wallet

## 🐛 Troubleshooting

### PayPal Issues

**Invalid Credentials**
- Verify Client ID and Secret
- Check environment (sandbox vs live)
- Ensure proper scope permissions

**Payment Failures**
- Check PayPal account status
- Verify recipient email exists
- Check payment amount limits

### PYUSD Issues

**Insufficient Balance**
- Check PYUSD token balance
- Check ETH balance for gas
- Verify wallet connection

**Transaction Failed**
- Increase gas limit
- Check network congestion
- Verify recipient address

**Network Errors**
- Check Infura project status
- Verify network configuration
- Check internet connection

## 📊 Monitoring and Analytics

### Transaction Tracking

All transactions are logged with:
- Transaction ID/Hash
- Payment method used
- Amount and fees
- Success/failure status
- Error details (if any)

### Performance Monitoring

The app includes:
- Payment method availability checks
- Network health monitoring
- Error rate tracking
- User experience metrics

## 🔐 Security Considerations

### PayPal Security
- Keep Client Secret secure (server-side only)
- Use HTTPS in production
- Validate webhook signatures
- Implement rate limiting

### PYUSD Security
- Never expose private keys
- Use hardware wallets for large amounts
- Validate all addresses
- Monitor for unusual activity

## 🚀 Production Deployment

### Environment Setup
1. Switch to PayPal live environment
2. Use mainnet for PYUSD
3. Set up proper monitoring
4. Configure backup payment methods

### Scaling Considerations
- Implement payment queuing
- Add database for transaction history
- Set up monitoring and alerts
- Plan for high transaction volumes

## 📞 Support

For issues with this integration:
1. Check the troubleshooting section
2. Review PayPal and Ethereum documentation
3. Test in sandbox/testnet first
4. Contact respective API support if needed

---

**Next Steps**: After completing this setup, your PayHive application will support real PayPal and PYUSD payments, providing users with flexible, secure settlement options!