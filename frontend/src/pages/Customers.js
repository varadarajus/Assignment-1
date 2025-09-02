// frontend/src/pages/Customers.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api';

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useSearchParams();

  const page = parseInt(params.get('page') || '1', 10);
  const limit = parseInt(params.get('limit') || '10', 10);
  const q = params.get('q') || '';
  const city = params.get('city') || '';
  const state = params.get('state') || '';
  const pin = params.get('pin') || '';
  const sortBy = params.get('sortBy') || 'created_at';
  const sortDir = params.get('sortDir') || 'DESC';
  const hasOneAddress = params.get('hasOneAddress') || '';

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value === '' || value === null) next.delete(key); else next.set(key, value);
    setParams(next);
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/customers', {
          params: { page, limit, q, city, state, pin, sortBy, sortDir, hasOneAddress }
        });
        setRows(data.data); setTotal(data.total);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [page, limit, q, city, state, pin, sortBy, sortDir, hasOneAddress, params]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div>
      <h2>Customers</h2>
      <div className="controls">
        <input className="form-control" placeholder="Search (name/phone/address)" value={q} onChange={e => updateParam('q', e.target.value)} />
        <input className="form-control" placeholder="City" value={city} onChange={e => updateParam('city', e.target.value)} />
        <input className="form-control" placeholder="State" value={state} onChange={e => updateParam('state', e.target.value)} />
        <input className="form-control" placeholder="PIN" value={pin} onChange={e => updateParam('pin', e.target.value)} />
        <select className="form-select" value={sortBy} onChange={e => updateParam('sortBy', e.target.value)}>
          <option value="created_at">Sort by Created</option>
          <option value="first_name">Sort by First Name</option>
          <option value="last_name">Sort by Last Name</option>
        </select>
        <select className="form-select" value={sortDir} onChange={e => updateParam('sortDir', e.target.value)}>
          <option value="DESC">Desc</option>
          <option value="ASC">Asc</option>
        </select>
        <select className="form-select" value={hasOneAddress} onChange={e => updateParam('hasOneAddress', e.target.value)}>
          <option value="">Any address count</option>
          <option value="true">Only one address</option>
          <option value="false">Multiple or zero</option>
        </select>
        <button className="btn btn-secondary" onClick={() => { ['q', 'city', 'state', 'pin', 'sortBy', 'sortDir', 'hasOneAddress', 'page'].forEach(k => params.delete(k)); setParams(params); }}>Clear Filters</button>
        <Link to="/customers/new"><button className="btn btn-primary">Create Customer</button></Link>
      </div>

      {loading ? <p>Loading...</p> : (
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Addresses</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.first_name} {r.last_name}</td>
                <td>{r.phone_number}</td>
                <td>{r.address_count}</td>
                <td>{r.only_one_address ? <span className="badge-soft">Only One Address</span> : null}</td>
                <td>
                  <Link to={`/customers/${r.id}`}><button className="btn btn-sm btn-outline-primary me-1">View</button></Link>
                  <Link to={`/customers/${r.id}/edit`}><button className="btn btn-sm btn-outline-secondary">Edit</button></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>Prev</button>
        <span>Page {page} / {pages}</span>
        <button className="btn btn-sm btn-secondary" disabled={page >= pages} onClick={() => updateParam('page', String(page + 1))}>Next</button>
        <select className="form-select form-select-sm" style={{ width: 80 }} value={String(limit)} onChange={e => updateParam('limit', e.target.value)}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      </div>
    </div>
  );
}
