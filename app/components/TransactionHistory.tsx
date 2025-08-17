'use client';

import { useState, useEffect } from 'react';
import { PaymentHistory } from '../types';

interface TransactionHistoryProps {
  groupId: string;
}

export function TransactionHistory({ groupId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactionHistory();
  }, [groupId]);

  const loadTransactionHistory = async () => {
    try {
      // In a real app, this would fetch from your backend/database
      // For now, we'll simulate with localStorage
      const savedTransactions = localStorage.getItem(`payhive-transactions-${groupId}`);
      if (savedTransactions) {
        const parsed = JSON.parse(savedTransactions);
        setTransactions(parsed.map((tx: any) => ({
          ...tx,
          createdAt: new Date(tx.createdAt),
          completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined,
        })));
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success-600 bg-success-100';
      case 'pending': return 'text-warning-600 bg-warning-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'pyusd': return '🏦';
      case 'paypal': return '💳';
      default: return '💰';
    }
  };

  const formatTransactionId = (txId: string) => {
    if (txId.length > 20) {
      return `${txId.slice(0, 10)}...${txId.slice(-10)}`;
    }
    return txId;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Transaction History
      </h3>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600">No transactions yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Settlements will appear here once processed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getMethodIcon(transaction.method)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </span>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${getStatusColor(transaction.status)}
                      `}>
                        {getStatusIcon(transaction.status)} {transaction.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {transaction.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        {transaction.method === 'pyusd' ? 'PYUSD' : 'PayPal'}
                      </span>
                      <span>
                        TX: {formatTransactionId(transaction.transactionId)}
                      </span>
                      <span>
                        {transaction.createdAt.toLocaleDateString()} at{' '}
                        {transaction.createdAt.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    {transaction.fees && (
                      <div className="text-xs text-gray-500 mt-1">
                        Network fees: ${transaction.fees.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <button
                    onClick={() => {
                      // In a real app, this would open transaction details
                      if (transaction.method === 'pyusd') {
                        window.open(`https://etherscan.io/tx/${transaction.transactionId}`, '_blank');
                      } else {
                        // For PayPal, could open PayPal transaction details
                        alert('PayPal transaction details would open here');
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}
      
      {transactions.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Transactions:</span>
            <span className="font-medium">{transactions.length}</span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Total Volume:</span>
            <span className="font-medium">
              ${transactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Total Fees:</span>
            <span className="font-medium">
              ${transactions.reduce((sum, tx) => sum + (tx.fees || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}