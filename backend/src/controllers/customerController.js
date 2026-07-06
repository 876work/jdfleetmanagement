import Customer from '../models/Customer.js';
import { isNonEmptyString, isValidEmail, sendValidationError, publicErrorMessage } from '../utils/validation.js';

const validateCustomer = (body) => {
  const fields = {};
  if (!isNonEmptyString(body.firstName)) fields.firstName = 'First name is required.';
  if (!isNonEmptyString(body.lastName)) fields.lastName = 'Last name is required.';
  if (!isNonEmptyString(body.phone)) fields.phone = 'Phone number is required.';
  if (!isValidEmail(body.email)) fields.email = 'Enter a valid email address.';
  if (!isNonEmptyString(body.address)) fields.address = 'Address is required.';
  return fields;
};

const cleanCustomerPayload = (body) => ({
  firstName: body.firstName?.trim(),
  lastName: body.lastName?.trim(),
  phone: body.phone?.trim(),
  email: body.email?.trim().toLowerCase(),
  address: body.address?.trim()
});

export const createCustomer = async (req, res) => {
  try {
    const fields = validateCustomer(req.body);
    if (Object.keys(fields).length) return sendValidationError(res, 'Please fix the highlighted customer fields.', fields);
    const saved = await new Customer(cleanCustomerPayload(req.body)).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: publicErrorMessage(err, 'Customer could not be saved. Please check the form and try again.') });
  }
};

export const getAllCustomers = async (req, res) => {
  try { res.status(200).json(await Customer.find()); }
  catch { res.status(500).json({ message: 'Unable to load customers. Please try again.' }); }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.status(200).json(customer);
  } catch { res.status(400).json({ message: 'Invalid customer identifier.' }); }
};

export const updateCustomer = async (req, res) => {
  try {
    const fields = validateCustomer(req.body);
    if (Object.keys(fields).length) return sendValidationError(res, 'Please fix the highlighted customer fields.', fields);
    const updated = await Customer.findByIdAndUpdate(req.params.id, cleanCustomerPayload(req.body), { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Customer not found.' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: publicErrorMessage(err, 'Customer could not be updated. Please check the form and try again.') });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Customer not found.' });
    res.status(200).json({ message: 'Customer deleted.' });
  } catch { res.status(400).json({ message: 'Invalid customer identifier.' }); }
};
