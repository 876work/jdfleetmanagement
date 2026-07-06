import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { getApiErrorMessage } from '../../utils/errorMessages';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/useAuth';
import { isStaffUser, canStaffEditInvoice } from '../../utils/permissions';


const EditBill = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);
    const [form, setForm] = useState({ partsUsed: [] });
    const [bill, setBill] = useState(null);
    const { auth } = useAuth();
    const isStaff = isStaffUser(auth);

    const { register, control, handleSubmit, reset } = useForm({
        defaultValues: {
            customer: '',
            vehicle: '',
            maintenanceId: '',
            services: [],
            paymentStatus: 'unpaid',
            notes: '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'services',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [billRes, customersRes, vehiclesRes, partsRes] = await Promise.all([
                    axiosInstance.get(`/api/bills/${id}`),
                    axiosInstance.get('/api/customers'),
                    axiosInstance.get('/api/vehicles'),
                    axiosInstance.get('/api/parts'),
                ]);

                setBill(billRes.data);

                reset({
                    customer: billRes.data.customer._id,
                    vehicle: billRes.data.vehicle._id,
                    services: billRes.data.services,
                    maintenanceId: billRes.data.maintenanceId?._id || '',
                    date: billRes.data.date ? billRes.data.date.split('T')[0] : '',
                    paymentStatus: billRes.data.paymentStatus || 'unpaid',
                    notes: billRes.data.notes || '',
                });

                setCustomers(customersRes.data);
                setVehicles(vehiclesRes.data);
                setAvailableParts(partsRes.data);
                setForm({ partsUsed: (billRes.data.maintenanceId?.partsUsed || []).map(p => p._id) });
            } catch (err) {
                toast.error(getApiErrorMessage(err, 'Failed to load invoice details. Please try again.'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, reset]);

    const onSubmit = async (data) => {
        const cleanedServices = data.services.map((s) => ({
            description: s.description,
            price: parseFloat(s.price.toString().replace(',', '.')) || 0,

        }));

        const totalPrice = cleanedServices.reduce((sum, s) => sum + s.price, 0);

        try {
            await axiosInstance.put(`/api/bills/${id}`, {
                customer: data.customer,
                vehicle: data.vehicle,
                maintenanceId: data.maintenanceId,
                services: cleanedServices,
                totalPrice,
                partsUsed: form.partsUsed,
                date: data.date,
                paymentStatus: data.paymentStatus,
                notes: data.notes,
            });

            toast.success('Invoice updated successfully');
            navigate('/invoices');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Invoice could not be updated. Please check the form and try again.'));
        }
    };

    if (loading) return <p className="p-6">Loading...</p>;

    const staffLocked = isStaff && !canStaffEditInvoice(bill);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2 text-center">
                ✏️ Edit Invoice
            </h1>

            {staffLocked && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Staff users cannot edit paid, cancelled, or archived invoices.
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white border rounded p-6 shadow-sm">
                {/* Customer */}
                <div>
                    <label className="block font-medium mb-1">Customer</label>
                    <select {...register('customer')} className="border p-2 rounded w-full">
                        <option value="">Select Customer</option>
                        {customers.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.firstName} {c.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Vehicle */}
                <div>
                    <label className="block font-medium mb-1">Vehicle</label>
                    <select {...register('vehicle')} className="border p-2 rounded w-full">
                        <option value="">Select Vehicle</option>
                        {vehicles.map((v) => (
                            <option key={v._id} value={v._id}>
                                {v.model} - {v.plateNumber}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date */}
                <div>
                    <label className="block font-medium mb-1">Invoice Date</label>
                    <input type="date" {...register('date')} className="border p-2 rounded w-full" />
                </div>

                {/* Payment Status */}
                <div>
                    <label className="block font-medium mb-1">Payment Status</label>
                    <select {...register('paymentStatus')} disabled={staffLocked} className="border p-2 rounded w-full disabled:bg-gray-100">
                        <option value="unpaid">Unpaid</option>
                        <option value="overdue">Overdue</option>
                        {!isStaff && <option value="paid">Paid</option>}
                        {!isStaff && <option value="cancelled">Cancelled</option>}
                    </select>
                    {isStaff && <p className="mt-1 text-xs text-brand-slate">Staff cannot mark invoices as paid or cancelled.</p>}
                </div>

                {/* Services */}
                <div>
                    <label className="block font-medium mb-2">Services</label>
                    <div className="space-y-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Description"
                                    {...register(`services.${index}.description`)}
                                    className="border p-2 rounded flex-1"
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    {...register(`services.${index}.price`)}
                                    disabled={isStaff || staffLocked}
                                    className="border p-2 rounded w-32 disabled:bg-gray-100"
                                />
                                {!isStaff && (
                                    <button type="button" onClick={() => remove(index)} className="text-brand-error">
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                        {!isStaff && (
                            <button
                                type="button"
                                onClick={() => append({ description: '', price: '' })}
                                className="text-sm text-brand-navy"
                            >
                                ➕ Add Service
                            </button>
                        )}
                    </div>
                </div>
                {/* Parts Section */}
                <div>
                    <label className="block font-medium mb-2">Parts Used</label>
                    <div className="border p-3 rounded max-h-40 overflow-y-auto">
                        {availableParts.map((part) => (
                            <label key={part._id} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    disabled={staffLocked}
                                    checked={form.partsUsed.includes(part._id)}
                                    onChange={() => {
                                        const exists = form.partsUsed.includes(part._id);
                                        const updated = exists
                                            ? form.partsUsed.filter(id => id !== part._id)
                                            : [...form.partsUsed, part._id];
                                        setForm(prev => ({ ...prev, partsUsed: updated }));
                                    }}
                                />
                                <span>{part.name}</span>
                            </label>
                        ))}
                    </div>
                </div>


                {/* Notes */}
                <div>
                    <label className="block font-medium mb-1">Notes</label>
                    <textarea {...register('notes')} rows="3" className="border p-2 rounded w-full" placeholder="Optional invoice notes" />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/invoices')}
                        className="bg-gray-300 text-brand-text px-5 py-2 rounded hover:bg-gray-400"
                    >
                        ❌ Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={staffLocked}
                        className="bg-brand-navy text-white px-6 py-2 rounded hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        💾 Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditBill;
