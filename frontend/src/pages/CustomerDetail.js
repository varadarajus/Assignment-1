// frontend/src/pages/CustomerDetail.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../api';

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [addr, setAddr] = useState({ address_details: '', city: '', state: '', pin_code: '' });

  const load = async () => {
    try {
      const { data } = await API.get(`/customers/${id}`);
      setData(data);
    } catch (e) {
      setData(null);
    }
  };

  useEffect(() => { load(); }, [id]);

  const addAddress = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await API.post(`/customers/${id}/addresses`, addr);
      setAddr({ address_details: '', city: '', state: '', pin_code: '' });
      await load();
      setMsg('Address added');
    } catch (err) {
      const e = err.response?.data; setMsg(e?.errors?.join(', ') || e?.error || 'Error');
    }
  };

  const removeCustomer = async () => {
    if (!window.confirm('Delete this customer permanently?')) return;
    await API.delete(`/customers/${id}`);
    nav('/customers');
  };

  const deleteAddress = async (aid) => {
    if (!window.confirm('Delete this address?')) return;
    await API.delete(`/addresses/${aid}`);
    await load();
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h2>Customer #{data.id}</h2>
      <p><b>Name:</b> {data.first_name} {data.last_name}</p>
      <p><b>Phone:</b> {data.phone_number}</p>
      <p><b>Address Count:</b> {data.address_count} {data.only_one_address && <span className="badge-soft">Only One Address</span>}</p>

      <div style={{ margin: '8px 0' }}>
        <Link to={`/customers/${data.id}/edit`}><button className="btn btn-sm btn-outline-primary me-2">Edit</button></Link>
        <button className="btn btn-sm btn-danger" onClick={removeCustomer}>Delete</button>
      </div>

      <h3>Addresses</h3>
      <ul className="list-group mb-3">
        {data.addresses.map(a => (
          <li key={a.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>{a.address_details}, {a.city}, {a.state} - {a.pin_code}</div>
            <div>
              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAddress(a.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <h4>Add Address</h4>
      <form onSubmit={addAddress} style={{ maxWidth: 520 }}>
        <div className="mb-2"><input className="form-control" placeholder="Address details" value={addr.address_details} onChange={e => setAddr({ ...addr, address_details: e.target.value })} required /></div>
        <div className="mb-2"><input className="form-control" placeholder="City" value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} required /></div>
        <div className="mb-2"><input className="form-control" placeholder="State" value={addr.state} onChange={e => setAddr({ ...addr, state: e.target.value })} required /></div>
        <div className="mb-2"><input className="form-control" placeholder="PIN (6 digits)" value={addr.pin_code} onChange={e => setAddr({ ...addr, pin_code: e.target.value })} required /></div>
        <button className="btn btn-primary" type="submit">Add Address</button>
      </form>

      {msg && <p className="mt-2">{msg}</p>}
    </div>
  );
}
