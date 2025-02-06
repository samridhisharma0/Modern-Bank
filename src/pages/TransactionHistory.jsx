// src/pages/TransactionHistory.jsx
import { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Search, ArrowUpRight, ArrowDownLeft, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionType, setTransactionType] = useState('all'); // 'all', 'sent', 'received'
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const observer = useRef();
  const BATCH_SIZE = 20;

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

  const lastTransactionElementRef = (node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreTransactions();
      }
    });
    if (node) observer.current.observe(node);
  };

  useEffect(() => {
    resetAndFetchTransactions();
  }, [currentUser.accountNumber, startDate, endDate, transactionType, searchTerm]);

  async function resetAndFetchTransactions() {
    setTransactions([]);
    setLastDoc(null);
    setHasMore(true);
    await fetchTransactions(true);
  }

  async function fetchTransactions(isReset = false) {
    try {
      setLoading(true);

      let queries = [];
      if (transactionType === 'all' || transactionType === 'sent') {
        const sentQuery = query(
          collection(db, 'transactions'),
          where('senderAccount', '==', currentUser.accountNumber),
          ...(startDate ? [where('timestamp', '>=', startDate.toISOString())] : []),
          ...(endDate ? [where('timestamp', '<=', endDate.toISOString())] : []),
          orderBy('timestamp', 'desc'),
          limit(BATCH_SIZE),
          ...(lastDoc && !isReset ? [startAfter(lastDoc)] : [])
        );
        queries.push(getDocs(sentQuery));
      }

      if (transactionType === 'all' || transactionType === 'received') {
        const receivedQuery = query(
          collection(db, 'transactions'),
          where('recipientAccount', '==', currentUser.accountNumber),
          ...(startDate ? [where('timestamp', '>=', startDate.toISOString())] : []),
          ...(endDate ? [where('timestamp', '<=', endDate.toISOString())] : []),
          orderBy('timestamp', 'desc'),
          limit(BATCH_SIZE),
          ...(lastDoc && !isReset ? [startAfter(lastDoc)] : [])
        );
        queries.push(getDocs(receivedQuery));
      }

      const snapshots = await Promise.all(queries);
      let newTransactions = [];

      snapshots.forEach((snapshot, index) => {
        const type = (transactionType === 'all' && index === 0) || transactionType === 'sent' 
          ? 'sent' 
          : 'received';
        
        newTransactions.push(
          ...snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type
          }))
        );
      });

      // Sort and filter
      newTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (searchTerm) {
        newTransactions = newTransactions.filter(transaction => 
          transaction.recipientAccount.includes(searchTerm) ||
          transaction.senderAccount.includes(searchTerm)
        );
      }

      setLastDoc(snapshots[0]?.docs[snapshots[0]?.docs.length - 1]);
      setHasMore(newTransactions.length === BATCH_SIZE);

      if (isReset) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchMoreTransactions = () => {
    if (!loading && hasMore) {
      fetchTransactions();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation header */}
      <nav className="bg-background-lighter border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-background-lighter border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white"
              />
            </div>
            <div className="flex gap-2">
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                placeholderText="Start Date"
                className="p-3 bg-background-lighter border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white"
              />
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                placeholderText="End Date"
                className="p-3 bg-background-lighter border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTransactionType('all')}
              className={`px-4 py-2 rounded-lg ${
                transactionType === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-background-lighter text-gray-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTransactionType('sent')}
              className={`px-4 py-2 rounded-lg ${
                transactionType === 'sent' 
                  ? 'bg-primary text-white' 
                  : 'bg-background-lighter text-gray-400'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setTransactionType('received')}
              className={`px-4 py-2 rounded-lg ${
                transactionType === 'received' 
                  ? 'bg-primary text-white' 
                  : 'bg-background-lighter text-gray-400'
              }`}
            >
              Received
            </button>
          </div>
        </div>

        {/* Transactions list */}
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div
              key={transaction.id}
              ref={index === transactions.length - 1 ? lastTransactionElementRef : null}
              className="flex items-center justify-between p-4 rounded-lg bg-background-lighter hover:bg-background transition-colors duration-200"
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
          
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
          
          {!loading && transactions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-500" />
              <p>No transactions found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}