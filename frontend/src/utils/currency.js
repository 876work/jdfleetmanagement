const xcdNumberFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const CURRENCY_CODE = "XCD";
export const CURRENCY_LABEL = "XCD $";

export const formatCurrency = (value) => {
    const amount = Number(value);
    return `${CURRENCY_LABEL}${xcdNumberFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
};
