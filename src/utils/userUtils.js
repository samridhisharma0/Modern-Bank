// src/utils/userUtils.js
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export function generateBaseAccountNumber() {
  // Start with a prefix and add random digits
  let accountNumber = '2024'; // Bank identifier
  for (let i = 0; i < 12; i++) {
    accountNumber += Math.floor(Math.random() * 10);
  }
  return accountNumber;
}

export async function generateUniqueAccountNumber() {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const accountNumber = generateBaseAccountNumber();
    
    // Check if this account number already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('accountNumber', '==', accountNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return accountNumber; // Unique number found
    }
  }
  
  throw new Error('Could not generate a unique account number');
}

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

// Updated to include name and more comprehensive user data
export async function createInitialUserData(email, name, role = USER_ROLES.USER) {
    const accountNumber = await generateUniqueAccountNumber();
    
    return {
      email,
      name,
      role,
      accountNumber,
      balance: role === USER_ROLES.ADMIN ? 1000000 : 1000,
      createdAt: new Date().toISOString(),
      isActive: true,
      transactions: [], // Initialize empty transactions array
      beneficiaries: [], // Add empty beneficiaries array
      profile: {
        fullName: name,
        joinedDate: new Date().toISOString()
      }
    };
  }

// New utility to validate account number
export async function validateAccountNumber(accountNumber) {
  if (typeof accountNumber !== 'string' || accountNumber.length !== 16) {
    return false;
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('accountNumber', '==', accountNumber));
  const querySnapshot = await getDocs(q);
  
  return !querySnapshot.empty;
}

// New utility to generate a unique transaction ID
export function generateTransactionId() {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Utility to format account number for display
export function formatAccountNumber(accountNumber) {
  if (!accountNumber) return '';
  return accountNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
}