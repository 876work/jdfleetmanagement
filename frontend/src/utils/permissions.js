export const getUserRole = (auth) => auth?.user?.role;
export const isAdmin = (auth) => getUserRole(auth) === "admin";
export const isStaff = (auth) => getUserRole(auth) === "staff";

export const staffCanEditMaintenance = (record) =>
  ["scheduled", "in progress"].includes((record?.status || "completed").trim());

export const lockedInvoiceStatuses = ["paid", "cancelled", "archived", "completed"];

export const staffCanEditInvoice = (invoice) => {
  const status = invoice?.archived ? "archived" : (invoice?.paymentStatus || "unpaid").trim();
  return !lockedInvoiceStatuses.includes(status);
};
