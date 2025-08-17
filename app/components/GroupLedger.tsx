'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Group, Settlement } from '../types';
import { PaymentService } from '../lib/services/paymentService';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface GroupLedgerProps {
  group: Group;
}

export function GroupLedger({ group }: GroupLedgerProps) {
  const { user } = useApp();
  const { primaryWallet } = useDynamicContext();
  const [isSettling, setIsSettling] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pyusd' | 'paypal'>('pyusd');
  const [showPaymentSelector, setShowPaymentSelector] = useState<string | null>(null);
  const [paymentService] = useState(() => new PaymentService());

  // Calculate settlements
  const calculateSettlements = (): Settlement[] => {
    const authorizedExpenses = group.expenses.filter(expense => expense.isAuthorized);
    const balances: { [userId: string]: number } = {};

    // Initialize balances for all members
    group.members.forEach(member => {
      balances[member.userId] = 0;
    });

    // Calculate what each person owes/is owed
    authorizedExpenses.forEach(expense => {
      const splitAmount = expense.amount / expense.participants.length;
      
      // The payer is owed money
      balances[expense.paidBy] += expense.amount;
      
      // Each participant owes their share
      expense.participants.forEach(participantId => {
        balances[participantId] -= splitAmount;
      });
    });

    // Create settlements to balance out the debts
    const settlements: Settlement[] = [];
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0.01)
      .sort(([_, a], [__, b]) => b - a);
    
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < -0.01)
      .sort(([_, a], [__, b]) => a - b);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const [creditorId, creditorBalance] = creditors[creditorIndex];
      const [debtorId, debtorBalance] = debtors[debtorIndex];

      const settlementAmount = Math.min(creditorBalance, Math.abs(debtorBalance));

      if (settlementAmount > 0.01) {
        settlements.push({
          fromUserId: debtorId,
          toUserId: creditorId,
          amount: settlementAmount,
          isSettled: false
        });
      }

      creditors[creditorIndex][1] -= settlementAmount;
      debtors[debtorIndex][1] += settlementAmount;

      if (Math.abs(creditors[creditorIndex][1]) < 0.01) creditorIndex++;
      if (Math.abs(debtors[debtorIndex][1]) < 0.01) debtorIndex++;
    }

    return settlements;
  };

  const settlements = calculateSettlements();
  const userSettlements = settlements.filter(settlement => 
    settlement.fromUserId === user?.id || settlement.toUserId === user?.id
  );

  const handleSettleUp = async (settlement: Settlement) => {
    const settlementKey = `${settlement.fromUserId}-${settlement.toUserId}`;
    setShowPaymentSelector(settlementKey);
  };

  const processPayment = async (settlement: Settlement) => {
    const settlementKey = `${settlement.fromUserId}-${settlement.toUserId}`;
    setIsSettling(settlementKey);
    setShowPaymentSelector(null);

    try {
      // Get member information
      const fromMember = group.members.find(m => m.userId === settlement.fromUserId);
      const toMember = group.members.find(m => m.userId === settlement.toUserId);

      if (!fromMember || !toMember || !user) {
        throw new Error('Invalid member information');
      }

      // Prepare settlement request
      const settlementRequest = {
        fromUserEmail: fromMember.email,
        fromWalletAddress: user.walletAddress || '',
        toUserEmail: toMember.email,
        toWalletAddress: '', // Would need to get from Dynamic or user data
        amount: settlement.amount,
        description: `PayHive settlement for ${group.name}`,
        groupId: group.id,
        preferredMethod: selectedPaymentMethod,
      };

      let result;

      if (selectedPaymentMethod === 'pyusd' && primaryWallet) {
        // Use PYUSD blockchain payment
        const signer = await primaryWallet.connector?.getSigner?.();
        if (!signer) throw new Error('Unable to get wallet signer');
        
        result = await paymentService.settlePyusd(signer, settlementRequest);
      } else {
        // Use PayPal payment
        result = await paymentService.settlePayPal(settlementRequest);
      }

      if (result.success) {
        // Show success message with transaction details
        const methodName = selectedPaymentMethod === 'pyusd' ? 'PYUSD' : 'PayPal';
        alert(
          `✅ Payment sent successfully!\n\n` +
          `Amount: $${settlement.amount.toFixed(2)} USD\n` +
          `Method: ${methodName}\n` +
          `Transaction ID: ${result.transactionId.slice(0, 20)}...\n` +
          `Status: ${result.status}\n\n` +
          `${selectedPaymentMethod === 'pyusd' 
            ? 'PYUSD tokens have been transferred on the blockchain.' 
            : 'Payment has been processed through PayPal.'
          }`
        );

        // In a real app, you'd update the settlement status in your database
        console.log('Payment result:', result);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(
        `❌ Payment failed\n\n` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `Please try again or contact support.`
      );
    } finally {
      setIsSettling(null);
    }
  };

  const getMemberName = (userId: string) => {
    const member = group.members.find(m => m.userId === userId);
    return member?.name || member?.email || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Your Balance Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Balance</h3>
        
        {userSettlements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-600">You're all settled up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userSettlements.map((settlement, index) => {
              const isOwed = settlement.toUserId === user?.id;
              const otherUserId = isOwed ? settlement.fromUserId : settlement.toUserId;
              const otherUserName = getMemberName(otherUserId);
              const settlementKey = `${settlement.fromUserId}-${settlement.toUserId}`;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    isOwed ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      {isOwed ? (
                        <p className="text-success-800 font-medium">
                          {otherUserName} owes you ${settlement.amount.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-warning-800 font-medium">
                          You owe {otherUserName} ${settlement.amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    {!isOwed && (
                      <button
                        onClick={() => handleSettleUp(settlement)}
                        disabled={isSettling === settlementKey || showPaymentSelector === settlementKey}
                        className="btn-primary text-sm"
                      >
                        {isSettling === settlementKey ? 'Processing...' : 'Settle Up'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Group Settlements */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Settlement Summary</h3>
        
        {settlements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-gray-600">Everyone is settled up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-medium">{getMemberName(settlement.fromUserId)}</span>
                    <span className="text-gray-600"> owes </span>
                    <span className="font-medium">{getMemberName(settlement.toUserId)}</span>
                  </div>
                </div>
                <div className="font-semibold text-gray-900">
                  ${settlement.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PYUSD Info */}
      <div className="card bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💰</div>
          <div>
            <h4 className="font-semibold text-primary-900 mb-1">Powered by PYUSD & PayPal</h4>
            <p className="text-sm text-primary-700">
              Choose between PYUSD blockchain payments or traditional PayPal transfers. 
              Both options provide secure, fast settlements for your group expenses.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Select Payment Method</h2>
              <button
                onClick={() => setShowPaymentSelector(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              {userSettlements
                .filter(s => `${s.fromUserId}-${s.toUserId}` === showPaymentSelector)
                .map((settlement, index) => {
                  const otherUserId = settlement.toUserId === user?.id ? settlement.fromUserId : settlement.toUserId;
                  const otherUserName = getMemberName(otherUserId);
                  const isOwed = settlement.toUserId === user?.id;
                  
                  return (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="text-center">
                        <div className="text-2xl mb-2">💸</div>
                        <p className="text-lg font-semibold">
                          Send ${settlement.amount.toFixed(2)} to {otherUserName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Settlement for {group.name}
                        </p>
                      </div>
                    </div>
                  );
                })
              }
              
              <PaymentMethodSelector
                onMethodSelect={setSelectedPaymentMethod}
                selectedMethod={selectedPaymentMethod}
                amount={userSettlements.find(s => `${s.fromUserId}-${s.toUserId}` === showPaymentSelector)?.amount || 0}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentSelector(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const settlement = userSettlements.find(s => `${s.fromUserId}-${s.toUserId}` === showPaymentSelector);
                  if (settlement) processPayment(settlement);
                }}
                className="btn-primary flex-1"
                disabled={!selectedPaymentMethod}
              >
                Continue Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
