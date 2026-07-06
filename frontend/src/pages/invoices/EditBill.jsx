import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { getApiErrorMessage } from "../../utils/errorMessages";
import toast from "react-hot-toast";
import { useAuth } from "../../context/useAuth";
import {
    isAdmin as checkIsAdmin,
    staffCanEditInvoice,
} from "../../utils/permissions";

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
    const admin = checkIsAdmin(auth);
    const staffMode = !admin;
    const canEditInvoice = admin || staffCanEditInvoice(bill);

    const { register, control, handleSubmit, reset } = useForm({
        defaultValues: {
            customer: "",
            vehicle: "",
            maintenanceId: "",
            services: [],
            paymentStatus: "unpaid",
            notes: "",
            date: "",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "services",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [billRes, customersRes, vehiclesRes, partsRes] =
                    await Promise.all([
                        axiosInstance.get(`/api/bills/${id}`),
                        axiosInstance.get("/api/customers"),
                        axiosInstance.get("/api/vehicles"),
                        axiosInstance.get("/api/parts"),
                    ]);

                const loadedBill = billRes.data;

                setBill(loadedBill);

                reset({
                    customer: loadedBill.customer?._id || "",
                    vehicle: loadedBill.vehicle?._id || "",
                    services: loadedBill.services || [],
                    maintenanceId: loadedBill.maintenanceId?._id || "",
                    date: loadedBill.date ? loadedBill.date.split("T")[0] : "",
                    paymentStatus: loadedBill.paymentStatus || "unpaid",
                    notes: loadedBill.notes || "",
                });

                setCustomers(customersRes.data);
                setVehicles(vehiclesRes.data);
                setAvailableParts(partsRes.data);

                setForm({
                    partsUsed: (loadedBill.maintenanceId?.partsUsed || []).map(
                        (part) => part._id
                    ),
                });
            } catch (err) {
                toast.error(
                    getApiErrorMessage(
                        err,
                        "Failed to load invoice details. Please try again."
                    )
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, reset]);

    const onSubmit = async (data) => {
        if (!canEditInvoice) {
            toast.error(
                "Staff users cannot edit paid, cancelled, archived, or completed invoices."
            );
            return;
        }

        const cleanedServices = data.services.map((service) => ({
            description: service.description,
            price:
                parseFloat(service.price?.toString().replace(",", ".")) || 0,
        }));

        const totalPrice = cleanedServices.reduce(
            (sum, service) => sum + service.price,
            0
        );

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

            toast.success("Invoice updated successfully");
            navigate("/invoices");
        } catch (err) {
            toast.error(
                getApiErrorMessage(
                    err,
                    "Invoice could not be updated. Please check the form and try again."
                )
            );
        }
    };

    if (loading) {
        return <p className="p-6">Loading...</p>;
    }

    if (!canEditInvoice) {
        return (
            <p className="p-6 text-brand-error">
                Staff users cannot edit paid, cancelled, archived, or completed
                invoices.
            </p>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="mb-6 flex items-center justify-center gap-2 text-center text-2xl font-bold">
                ✏️ Edit Invoice
            </h1>

            {staffMode && (
                <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    Staff users can update invoice notes and allowed invoice
                    details, but cannot mark invoices as paid or cancelled and
                    cannot change invoice amounts.
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 rounded border bg-white p-6 shadow-sm"
            >
                <div>
                    <label className="mb-1 block font-medium">Customer</label>

                    <select
                        {...register("customer")}
                        className="w-full rounded border p-2"
                    >
                        <option value="">Select Customer</option>

                        {customers.map((customer) => (
                            <option key={customer._id} value={customer._id}>
                                {customer.firstName} {customer.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block font-medium">Vehicle</label>

                    <select
                        {...register("vehicle")}
                        className="w-full rounded border p-2"
                    >
                        <option value="">Select Vehicle</option>

                        {vehicles.map((vehicle) => (
                            <option key={vehicle._id} value={vehicle._id}>
                                {vehicle.name ||
                                    `${vehicle.brand || ""} ${
                                        vehicle.model || ""
                                    }`.trim() ||
                                    "Unnamed vehicle"}{" "}
                                {vehicle.plateNumber
                                    ? `- ${vehicle.plateNumber}`
                                    : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block font-medium">
                        Invoice Date
                    </label>

                    <input
                        type="date"
                        {...register("date")}
                        className="w-full rounded border p-2"
                    />
                </div>

                <div>
                    <label className="mb-1 block font-medium">
                        Payment Status
                    </label>

                    <select
                        {...register("paymentStatus")}
                        className="w-full rounded border p-2"
                    >
                        <option value="draft">Draft</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="overdue">Overdue</option>

                        {admin && <option value="paid">Paid</option>}
                        {admin && <option value="cancelled">Cancelled</option>}
                    </select>

                    {staffMode && (
                        <p className="mt-1 text-xs text-brand-slate">
                            Staff cannot mark invoices as paid or cancelled.
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-2 block font-medium">Services</label>

                    <div className="space-y-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Description"
                                    {...register(
                                        `services.${index}.description`
                                    )}
                                    className="flex-1 rounded border p-2"
                                />

                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    {...register(`services.${index}.price`)}
                                    disabled={staffMode}
                                    title={
                                        staffMode
                                            ? "Staff users cannot change invoice amounts after creation."
                                            : undefined
                                    }
                                    className="w-32 rounded border p-2 disabled:bg-gray-100"
                                />

                                {admin && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-brand-error"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}

                        {admin && (
                            <button
                                type="button"
                                onClick={() =>
                                    append({ description: "", price: "" })
                                }
                                className="text-sm text-brand-navy"
                            >
                                ➕ Add Service
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <label className="mb-2 block font-medium">
                        Parts Used
                    </label>

                    <div className="max-h-40 overflow-y-auto rounded border p-3">
                        {availableParts.map((part) => (
                            <label
                                key={part._id}
                                className="flex items-center gap-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    disabled={staffMode}
                                    checked={form.partsUsed.includes(part._id)}
                                    onChange={() => {
                                        const exists =
                                            form.partsUsed.includes(part._id);

                                        const updated = exists
                                            ? form.partsUsed.filter(
                                                  (partId) =>
                                                      partId !== part._id
                                              )
                                            : [...form.partsUsed, part._id];

                                        setForm((prev) => ({
                                            ...prev,
                                            partsUsed: updated,
                                        }));
                                    }}
                                />

                                <span>{part.name}</span>
                            </label>
                        ))}
                    </div>

                    {staffMode && (
                        <p className="mt-1 text-xs text-brand-slate">
                            Staff cannot change parts used or inventory related
                            values.
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block font-medium">Notes</label>

                    <textarea
                        {...register("notes")}
                        rows="3"
                        className="w-full rounded border p-2"
                        placeholder="Optional invoice notes"
                    />
                </div>

                <div className="mt-6 flex justify-between">
                    <button
                        type="button"
                        onClick={() => navigate("/invoices")}
                        className="rounded bg-gray-300 px-5 py-2 text-brand-text hover:bg-gray-400"
                    >
                        ❌ Cancel
                    </button>

                    <button
                        type="submit"
                        className="rounded bg-brand-navy px-6 py-2 text-white hover:bg-brand-deep"
                    >
                        💾 Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditBill;