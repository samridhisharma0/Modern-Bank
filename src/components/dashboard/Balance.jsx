// src/components/dashboard/Balance.jsx
import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, DollarSign } from 'lucide-react';

export default function Balance() {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance || 0);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return (
    <div className="bg-background-lighter p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Your Balance</h2>
        <CreditCard className="text-primary" size={24} />
      </div>
      <div className="flex items-center space-x-2">
        <DollarSign className="text-green-500" size={32} />
        <span className="text-3xl font-bold text-white">
          {balance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}