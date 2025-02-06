// src/components/admin/UsersList.jsx
import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Edit2, Save, X } from 'lucide-react';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateBalance(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        balance: parseFloat(newBalance)
      });
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, balance: parseFloat(newBalance) }
          : user
      ));
      
      setEditingUser(null);
      setNewBalance('');
    } catch (error) {
      console.error('Error updating balance:', error);
      setError('Failed to update balance');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-lighter rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">User Management</h2>
      
      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="py-3 px-4">Account Number</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Balance</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-700/50">
                <td className="py-3 px-4 font-mono">{user.accountNumber}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  {editingUser === user.id ? (
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="w-32 p-1 bg-background border border-gray-600 rounded"
                    />
                  ) : (
                    `$${user.balance.toLocaleString()}`
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {editingUser === user.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateBalance(user.id)}
                        className="p-1 text-green-500 hover:text-green-400"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(null);
                          setNewBalance('');
                        }}
                        className="p-1 text-red-500 hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingUser(user.id);
                        setNewBalance(user.balance.toString());
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}