// backend/src/utils/validation.js
const PHONE_RE = /^[0-9]{10}$/;
const PIN_RE = /^[0-9]{6}$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;

function validateCustomer(body) {
  const errors = [];
  if (!body.first_name || !NAME_RE.test(body.first_name)) errors.push('Invalid first_name');
  if (!body.last_name || !NAME_RE.test(body.last_name)) errors.push('Invalid last_name');
  if (!body.phone_number || !PHONE_RE.test(body.phone_number)) errors.push('Invalid phone_number');
  return errors;
}

function validateAddress(body) {
  const errors = [];
  if (!body.address_details || body.address_details.length < 3) errors.push('Invalid address_details');
  if (!body.city || body.city.length < 2) errors.push('Invalid city');
  if (!body.state || body.state.length < 2) errors.push('Invalid state');
  if (!body.pin_code || !PIN_RE.test(body.pin_code)) errors.push('Invalid pin_code');
  return errors;
}

module.exports = { validateCustomer, validateAddress };
