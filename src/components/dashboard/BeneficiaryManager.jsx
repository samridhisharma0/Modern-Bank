// src/components/dashboard/BeneficiaryManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { Trash2, UserPlus } from 'lucide-react';

export default function BeneficiaryManager({ onSelectBeneficiary }) {
  const { currentUser } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [newBeneficiary, setNewBeneficiary] = useState({
    accountNumber: '',
    name: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser.beneficiaries) {
      setBeneficiaries(currentUser.beneficiaries);
    }
  }, [currentUser]);

  const addBeneficiary = async () => {
    setError('');

    // Validate input
    if (!newBeneficiary.accountNumber || !newBeneficiary.name) {
      setError('Please enter both account number and name');
      return;
    }

    // Check for duplicates
    const isDuplicate = beneficiaries.some(
      b => b.accountNumber === newBeneficiary.accountNumber
    );

    if (isDuplicate) {
      setError('This beneficiary already exists');
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        beneficiaries: arrayUnion(newBeneficiary)
      });

      setBeneficiaries([...beneficiaries, newBeneficiary]);
      setNewBeneficiary({ accountNumber: '', name: '' });
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      setError('Failed to add beneficiary');
    }
  };

  const removeBeneficiary = async (beneficiary) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        beneficiaries: arrayRemove(beneficiary)
      });

      setBeneficiaries(beneficiaries.filter(b => 
        b.accountNumber !== beneficiary.accountNumber
      ));
    } catch (error) {
      console.error('Error removing beneficiary:', error);
      setError('Failed to remove beneficiary');
    }
  };

  const formatAccountNumber = (number) => {
    return number.replace(/(\d{4})/g, '$1-').slice(0, -1);
  };

  return (
    <div className="bg-background-lighter p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Beneficiaries</h2>
        <UserPlus className="text-primary" size={24} />
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="mb-4 space-y-3">
        <input
          type="text"
          value={newBeneficiary.accountNumber}
          onChange={(e) => setNewBeneficiary({
            ...newBeneficiary, 
            accountNumber: e.target.value.replace(/\D/g, '').slice(0, 16)
          })}
          placeholder="Account Number"
          className="w-full p-3 bg-background border border-gray-600 rounded-lg text-white"
        />
        <input
          type="text"
          value={newBeneficiary.name}
          onChange={(e) => setNewBeneficiary({
            ...newBeneficiary, 
            name: e.target.value
          })}
          placeholder="Beneficiary Name"
          className="w-full p-3 bg-background border border-gray-600 rounded-lg text-white"
        />
        <button
          onClick={addBeneficiary}
          className="w-full p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
        >
          <UserPlus className="mr-2" size={20} /> Add Beneficiary
        </button>
      </div>

      <div className="space-y-2">
        {beneficiaries.map((beneficiary, index) => (
          <div 
            key={index} 
            className="flex justify-between items-center bg-background p-3 rounded-lg hover:bg-background-lighter transition-colors"
          >
            <div>
              <p className="text-white font-medium">{beneficiary.name}</p>
              <p className="text-gray-400 text-sm">
                {formatAccountNumber(beneficiary.accountNumber)}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onSelectBeneficiary(beneficiary)}
                className="bg-primary text-white px-3 py-1 rounded-md hover:bg-primary-dark transition-colors"
              >
                Transfer
              </button>
              <button
                onClick={() => removeBeneficiary(beneficiary)}
                className="text-red-500 hover:bg-red-500/10 p-2 rounded-md transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {beneficiaries.length === 0 && (
          <p className="text-gray-400 text-center py-4">
            No beneficiaries added yet
          </p>
        )}
      </div>
    </div>
  );
}