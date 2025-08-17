'use client';

import { useState, useEffect } from 'react';
import { PaymentService } from '../lib/services/paymentService';
import { PaymentMethod } from '../lib/services/paymentService';

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: 'pyusd' | 'paypal') => void;
  selectedMethod?: 'pyusd' | 'paypal';
  amount: number;
}

export function PaymentMethodSelector({ 
  onMethodSelect, 
  selectedMethod, 
  amount 
}: PaymentMethodSelectorProps) {
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (selectedMethod && amount > 0) {
      estimateFees();
    }
  }, [selectedMethod, amount]);

  const loadPaymentMethods = async () => {
    try {
      const paymentService = new PaymentService();
      const methods = await paymentService.getAvailablePaymentMethods();
      setAvailableMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateFees = async () => {
    if (!selectedMethod) return;
    
    try {
      const paymentService = new PaymentService();
      const estimatedFee = await paymentService.estimateFees(
        {
          fromUserEmail: '',
          fromWalletAddress: '',
          toUserEmail: '',
          toWalletAddress: '',
          amount,
          description: '',
          groupId: '',
        },
        selectedMethod
      );
      
      setFees(prev => ({ ...prev, [selectedMethod]: estimatedFee }));
    } catch (error) {
      console.error('Error estimating fees:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Choose Payment Method
      </h3>
      
      {availableMethods.map((method) => (
        <div
          key={method.type}
          onClick={() => method.enabled && onMethodSelect(method.type)}
          className={`
            p-4 border-2 rounded-lg cursor-pointer transition-all
            ${selectedMethod === method.type 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
            ${!method.enabled && 'opacity-50 cursor-not-allowed'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <h4 className="font-medium text-gray-900">
                  {method.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {method.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedMethod === method.type && fees[method.type] !== undefined && (
                <span className="text-xs text-gray-500">
                  Fee: ${fees[method.type].toFixed(2)}
                </span>
              )}
              
              {!method.enabled && (
                <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                  Unavailable
                </span>
              )}
              
              <div className={`
                w-4 h-4 rounded-full border-2
                ${selectedMethod === method.type 
                  ? 'border-primary-500 bg-primary-500' 
                  : 'border-gray-300'
                }
              `}>
                {selectedMethod === method.type && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
            </div>
          </div>
          
          {method.type === 'pyusd' && (
            <div className="mt-2 text-xs text-gray-500">
              • Blockchain-powered payments
              • Lower fees for large amounts
              • Instant settlement
            </div>
          )}
          
          {method.type === 'paypal' && (
            <div className="mt-2 text-xs text-gray-500">
              • Traditional PayPal payments
              • Works with any PayPal account
              • Buyer protection included
            </div>
          )}
        </div>
      ))}
      
      {availableMethods.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-gray-600">No payment methods available</p>
          <p className="text-sm text-gray-500 mt-1">
            Please check your configuration
          </p>
        </div>
      )}
      
      {selectedMethod && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800">
              {selectedMethod === 'pyusd' && (
                <>
                  <strong>PYUSD Payment:</strong> This will transfer PayPal USD tokens 
                  directly from your wallet. Make sure you have sufficient PYUSD balance 
                  and ETH for gas fees.
                </>
              )}
              {selectedMethod === 'paypal' && (
                <>
                  <strong>PayPal Payment:</strong> You'll be redirected to PayPal to 
                  complete the payment. The recipient will receive the payment in their 
                  PayPal account.
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}