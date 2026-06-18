const _backend = (process.env.EXPO_PUBLIC_DATA_BACKEND ?? "db").toLowerCase();

export const DATA_BACKEND = _backend;
export const USE_ODOO_BACKEND = _backend === "odoo";
// "db" is the default — uses the tRPC/SQLite backend
export const USE_DB_BACKEND = _backend === "db";
// "local" = legacy AsyncStorage prototype
export const USE_LOCAL_BACKEND = _backend === "local";
