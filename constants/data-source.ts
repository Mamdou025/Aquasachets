export const DATA_BACKEND = process.env.EXPO_PUBLIC_DATA_BACKEND ?? "local";
export const USE_ODOO_BACKEND = DATA_BACKEND.toLowerCase() === "odoo";
