// src/components/dashboard/TransactionHistoryPanel.jsx
import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Clock, Calendar } from 'lucide-react';

export default function TransactionHistoryPanel() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.accountNumber) return;

    const sentQuery = query(
      collection(db, 'transactions'),
      where('senderAccount', '==', currentUser.accountNumber),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const receivedQuery = query(
      collection(db, 'transactions'),
      where('recipientAccount', '==', currentUser.accountNumber),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      const sentTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'sent' }));
      updateTransactions(sentTransactions);
    });

    const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
      const receivedTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'received' }));
      updateTransactions(receivedTransactions);
    });

    setLoading(false);

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [currentUser?.accountNumber]);

  function updateTransactions(newTransactions) {
    setTransactions(prevTransactions => {
      const combinedTransactions = [...prevTransactions, ...newTransactions];
      const uniqueTransactions = Array.from(
        new Map(combinedTransactions.map(item => [item.id, item])).values()
      );
      
      return uniqueTransactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    });
  }

  const formatAccountNumber = (number) => {
    return `${number.slice(0, 4)}-****-****-${number.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-background-lighter p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
          <p className="text-sm text-gray-400">Last 5 transactions</p>
        </div>
        <button
          onClick={() => navigate('/transactions')}
          className="px-4 py-2 text-sm text-primary hover:text-white hover:bg-primary rounded-lg transition-colors duration-200"
        >
          View All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Clock className="animate-spin h-6 w-6 text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-500" />
          <p>No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg bg-background hover:bg-background-lighter transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'sent' 
                    ? 'bg-red-500/10 text-red-500' 
                    : 'bg-green-500/10 text-green-500'
                }`}>
                  {transaction.type === 'sent' 
                    ? <ArrowUpRight className="h-5 w-5" />
                    : <ArrowDownLeft className="h-5 w-5" />
                  }
                </div>
                <div>
                  <p className="text-white font-medium">
                    {transaction.type === 'sent' ? 'Sent to' : 'Received from'}
                  </p>
                  <p className="text-sm text-gray-400 font-mono">
                    {formatAccountNumber(
                      transaction.type === 'sent' 
                        ? transaction.recipientAccount 
                        : transaction.senderAccount
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  transaction.type === 'sent' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {transaction.type === 'sent' ? '-' : '+'}
                  ${transaction.amount.toLocaleString('en-US', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
                <p className="text-sm text-gray-400">
                  {formatDate(transaction.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}