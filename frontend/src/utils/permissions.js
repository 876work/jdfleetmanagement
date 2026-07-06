export const getUserRole = (auth) => auth?.user?.role;

export const isAdmin = (auth) => getUserRole(auth) === "admin";

export const isStaff = (auth) => getUserRole(auth) === "staff";

export const staffCanEditMaintenance = (record) => {
  const status = (record?.status || "completed").trim();

  return ["scheduled", "in progress"].includes(status);
};

export const lockedInvoiceStatuses = [
  "paid",
  "cancelled",
  "archived",
  "completed",
];

export const staffCanEditInvoice = (invoice) => {
  const status = invoice?.archived
    ? "archived"
    : (invoice?.paymentStatus || "unpaid").trim();

  return !lockedInvoiceStatuses.includes(status);
};