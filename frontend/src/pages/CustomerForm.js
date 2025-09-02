// frontend/src/pages/CustomerForm.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api';

export default function CustomerForm({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      API.get(`/customers/${id}`).then(({ data }) => {
        setForm({ first_name: data.first_name, last_name: data.last_name, phone_number: data.phone_number });
      }).catch(()=>{});
    }
  }, [isEdit, id]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      if (isEdit) {
        await API.put(`/customers/${id}`, form);
        setMsg('Updated successfully');
      } else {
        await API.post('/customers', form);
        setMsg('Created successfully');
      }
      setTimeout(() => nav('/customers'), 700);
    } catch (err) {
      const e = err.response?.data;
      setMsg(e?.errors?.join(', ') || e?.error || 'Error');
    }
  };

  return (
    <div>
      <h2>{isEdit ? 'Edit Customer' : 'Create Customer'}</h2>
      <form onSubmit={submit} style={{ maxWidth: 520 }}>
        <div className="mb-2"><input className="form-control" placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required /></div>
        <div className="mb-2"><input className="form-control" placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required /></div>
        <div className="mb-2"><input className="form-control" placeholder="Phone (10 digits)" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} required /></div>
        <button className="btn btn-primary" type="submit">{isEdit ? 'Save Changes' : 'Create'}</button>
      </form>
      {msg && <p className="mt-2">{msg}</p>}
    </div>
  );
}
