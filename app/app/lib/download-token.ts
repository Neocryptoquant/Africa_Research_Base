// lib/download-tokens.ts

// In a real app, you'd store these in a database
const downloadTokens = new Map<string, { datasetId: string, expiresAt: number }>();

export function storeDownloadToken(token: string, datasetId: string, expirationMinutes = 60) {
  downloadTokens.set(token, {
    datasetId,
    expiresAt: Date.now() + (expirationMinutes * 60 * 1000)
  });
}

export function getDownloadToken(token: string) {
  return downloadTokens.get(token);
}

export function deleteDownloadToken(token: string) {
  downloadTokens.delete(token);
}
