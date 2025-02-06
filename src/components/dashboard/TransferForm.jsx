// src/components/dashboard/TransferForm.jsx
import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, runTransaction, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from 'lucide-react';

export default function TransferForm({ initialBeneficiary = null }) {
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();

  // Use effect to set initial beneficiary if provided
  useEffect(() => {
    if (initialBeneficiary) {
      setRecipient(initialBeneficiary.accountNumber || '');
      setRecipientName(initialBeneficiary.name || '');
    }
  }, [initialBeneficiary]);

  const formatAccountNumber = (number) => {
    return number.replace(/(\d{4})/g, '$1-').slice(0, -1);
  };

  async function handleTransfer(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Input validation
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      setLoading(false);
      return;
    }

    if (transferAmount > 10000) {
      setError('Maximum transfer amount is $10,000');
      setLoading(false);
      return;
    }

    if (recipient.length !== 16) {
      setError('Please enter a valid 16-digit account number');
      setLoading(false);
      return;
    }

    // Prevent self-transfer
    if (recipient === currentUser.accountNumber) {
      setError('Cannot transfer to your own account');
      setLoading(false);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        // Get recipient's document using account number AND name
        const recipientQuery = query(
          collection(db, 'users'), 
          where('accountNumber', '==', recipient),
          where('name', '==', recipientName)
        );
        const recipientDocs = await getDocs(recipientQuery);

        if (recipientDocs.empty) {
          throw new Error('Recipient account not found or name mismatch');
        }

        const recipientDoc = recipientDocs.docs[0];
        const recipientData = recipientDoc.data();

        // Get sender's document
        const senderQuery = query(
          collection(db, 'users'), 
          where('accountNumber', '==', currentUser.accountNumber)
        );
        const senderDocs = await getDocs(senderQuery);
        
        if (senderDocs.empty) {
          throw new Error('Sender account not found');
        }

        const senderDoc = senderDocs.docs[0];
        const senderData = senderDoc.data();

        // Validate account statuses and balance
        if (!recipientData.isActive) {
          throw new Error('Recipient account is inactive');
        }

        if (senderData.balance < transferAmount) {
          throw new Error('Insufficient funds');
        }

        // Perform the transfer
        transaction.update(senderDoc.ref, {
          balance: senderData.balance - transferAmount,
          lastTransactionDate: new Date().toISOString()
        });

        transaction.update(recipientDoc.ref, {
          balance: recipientData.balance + transferAmount,
          lastTransactionDate: new Date().toISOString()
        });

        // Create transaction record
        const transactionsRef = collection(db, 'transactions');
        transaction.set(doc(transactionsRef), {
          senderAccount: currentUser.accountNumber,
          recipientAccount: recipient,
          senderName: currentUser.name,
          recipientName: recipientName,
          amount: transferAmount,
          timestamp: new Date().toISOString(),
          type: 'TRANSFER',
          status: 'COMPLETED'
        });
      });

      setSuccess('Transfer completed successfully!');
      setAmount('');
      setRecipient('');
      setRecipientName('');
    } catch (err) {
      let errorMessage = 'Transfer failed. Please try again.';
      
      if (err.message.includes('account not found or name mismatch')) {
        errorMessage = 'Invalid account number or name. Please verify and try again.';
      } else if (err.message.includes('Insufficient funds')) {
        errorMessage = 'Insufficient funds for this transfer.';
      } else if (err.message.includes('inactive')) {
        errorMessage = 'Cannot transfer to an inactive account.';
      }
      
      setError(errorMessage);
      console.error('Transfer error:', err);
    } finally {
      setLoading(false);
    }
  }
  //<p className="text-sm text-gray-400">Your Account: {formatAccountNumber(currentUser.accountNumber)}</p>

  
  

  return (
    <div className="bg-background-lighter p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white">Transfer Money</h2>
         
        </div>
        <Send className="text-primary" size={24} />
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500">
          {success}
        </div>
      )}

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Recipient Account Number
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 16) {
                setRecipient(value);
              }
            }}
            className="w-full p-3 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white font-mono"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            maxLength="19"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            Enter the 16-digit account number
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Recipient Full Name
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full p-3 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white"
            placeholder="Enter recipient's full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Amount ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white"
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || recipient.length !== 16 || !recipientName}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Transfer'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-400">
        <p>Transfer limits:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Minimum: $0.01</li>
          <li>Maximum: $10,000 per transaction</li>
        </ul>
      </div>
    </div>
  );
}