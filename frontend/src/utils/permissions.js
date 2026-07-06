export const isAdminUser = (auth) => auth?.user?.role === 'admin';
export const isStaffUser = (auth) => auth?.user?.role === 'staff';
export const canStaffEditInvoice = (bill) => {
  const status = bill?.paymentStatus || 'unpaid';
  return !bill?.archived && !['paid', 'cancelled'].includes(status);
};
export const canStaffEditMaintenance = (record) => ['scheduled', 'in progress'].includes(record?.status || 'completed');
