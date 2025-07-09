// Initialize logging
export const logger = {
  info: (msg) => console.error(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.error(`[WARN] ${msg}`)
}; 