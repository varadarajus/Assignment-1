// frontend/src/pages/Login.js
import React, { useState } from 'react';
import API from '../api';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [msg, setMsg] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const { data } = await API.post('/auth/login', { email, password });
      await login(data.token);
      nav('/customers');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-6">
        <div className="card p-4">
          <h4>Login</h4>
          <form onSubmit={submit}>
            <div className="mb-2">
              <input className="form-control" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-2">
              <input type="password" className="form-control" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary">Login</button>
            {msg && <div className="mt-2 text-danger">{msg}</div>}
            <div className="mt-3 text-muted">Use seeded admin: <strong>admin@example.com / admin123</strong></div>
          </form>
        </div>
      </div>
    </div>
  );
}
