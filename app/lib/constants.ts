// PYUSD Contract Configuration
export const PYUSD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PYUSD_CONTRACT_ADDRESS || '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8'

// PayPal Configuration
export const PAYPAL_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: 'USD',
  environment: process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox',
}

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  network: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK || 'mainnet',
  infuraProjectId: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || '',
  pyusdContractAddress: PYUSD_CONTRACT_ADDRESS,
}

// PYUSD Token Configuration
export const PYUSD_CONFIG = {
  name: 'PayPal USD',
  symbol: 'PYUSD',
  decimals: 6,
  contractAddress: PYUSD_CONTRACT_ADDRESS,
}

// Transaction Configuration
export const TRANSACTION_CONFIG = {
  gasLimit: 100000,
  gasPrice: '20000000000', // 20 gwei
  confirmations: 1,
}

// App Configuration
export const APP_CONFIG = {
  name: 'PayHive',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}