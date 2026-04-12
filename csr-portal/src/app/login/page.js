'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        // Save token to localStorage to "stay logged in"
        localStorage.setItem('adminToken', data.idToken);
        router.push('/admin');
      } else {
        setError('Unauthorized: Invalid Credentials');
      }
    } catch (err) {
      setError('Backend server is offline');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96 space-y-4 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Admin Portal</h2>
        {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded">{error}</p>}
        <input 
          type="email" placeholder="Admin Email" required
          className="w-full p-3 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <input 
          type="password" placeholder="Password" required
          className="w-full p-3 border rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />
        <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition">
          Sign In
        </button>
      </form>
    </div>
  );
}