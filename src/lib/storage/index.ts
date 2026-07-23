import { CsvStorageProvider } from "./csv-provider";
import { PostgresStorageProvider } from "./postgres-provider";
import type { StorageProvider } from "./types";

const csvStorageProvider = new CsvStorageProvider();
const postgresStorageProvider = new PostgresStorageProvider();

export async function getStorageProvider(): Promise<StorageProvider> {
  const envProvider = (
    process.env.STORAGE_PROVIDER || process.env.DB_PROVIDER || ""
  )
    .trim()
    .toLowerCase();

  if (envProvider === "postgres") {
    const isConnected = await postgresStorageProvider.isConnected();
    if (isConnected) {
      return postgresStorageProvider;
    }
  } else if (envProvider === "csv") {
    return csvStorageProvider;
  }

  // Fallback to app settings if not fixed in .env
  const settings = await csvStorageProvider.getSettings();

  if (settings.storageProvider === "postgres" || settings.postgresConfigured) {
    const isConnected = await postgresStorageProvider.isConnected();
    if (isConnected) {
      return postgresStorageProvider;
    }
  }

  return csvStorageProvider;
}

export { csvStorageProvider, postgresStorageProvider };
