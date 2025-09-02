// frontend/src/App.js
import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './pages/Login';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import CustomerDetail from './pages/CustomerDetail';

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="container">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
        <div className="container">
          <Link className="navbar-brand" to="/">CRM</Link>
          <div>
            <Link className="me-2" to="/customers">Customers</Link>
            {user ? (
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { logout(); nav('/login'); }}>Logout</button>
            ) : (
              <Link className="btn btn-primary btn-sm" to="/login">Login</Link>
            )}
          </div>
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/customers" element={<Protected><Customers /></Protected>} />
          <Route path="/customers/new" element={<Protected><CustomerForm mode="create" /></Protected>} />
          <Route path="/customers/:id" element={<Protected><CustomerDetail /></Protected>} />
          <Route path="/customers/:id/edit" element={<Protected><CustomerForm mode="edit" /></Protected>} />
          <Route path="/" element={<Navigate to="/customers" />} />
        </Routes>
      </main>
    </>
  );
}
