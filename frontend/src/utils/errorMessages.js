export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const data = error?.response?.data;
  if (data?.fields && typeof data.fields === "object") {
    return Object.values(data.fields).filter(Boolean).join(" ") || data.message || fallback;
  }
  return data?.message || fallback;
};
