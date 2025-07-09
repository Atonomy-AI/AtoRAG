import fs from "fs";
import path from "path";
import os from "os";
import { logger } from "./logger.js";

// Initialize AtoRAG knowledge base directory
export const atoragPath = path.join(os.homedir(), ".atorag", "knowledge_base");
if (!fs.existsSync(atoragPath)) {
  fs.mkdirSync(atoragPath, { recursive: true });
}

// Initialize backup directory - use custom path if provided, otherwise default
export const getBackupPath = () => {
  const customBackupPath = process.env.ATORAG_BACKUP_PATH;
  // Check if it's a valid path and not a template string
  if (customBackupPath && 
      customBackupPath.trim() && 
      !customBackupPath.includes('${') && 
      customBackupPath !== 'undefined') {
    const resolvedPath = path.resolve(customBackupPath.trim());
    logger.info(`Using custom backup path: ${resolvedPath}`);
    return resolvedPath;
  }
  const defaultPath = path.join(atoragPath, 'backups');
  logger.info(`Using default backup path: ${defaultPath}`);
  return defaultPath;
}; 