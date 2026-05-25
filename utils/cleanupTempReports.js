// utils/cleanupTempReports.js

import fs from 'fs/promises';
import path from 'path';

export async function cleanupTempReports({
  reportsDir,
  maxAgeMinutes = 60
}) {
  try {
    await fs.mkdir(reportsDir, { recursive: true });

    const files = await fs.readdir(reportsDir);
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    for (const fileName of files) {
      const filePath = path.join(reportsDir, fileName);

      try {
        const stat = await fs.stat(filePath);

        if (!stat.isFile()) continue;

        const ageMs = now - stat.mtimeMs;

        if (ageMs > maxAgeMs) {
          await fs.unlink(filePath);
          console.log('[REPORT CLEANUP] Deleted old temp file:', filePath);
        }
      } catch (fileError) {
        console.warn(
          '[REPORT CLEANUP] Cannot process file:',
          filePath,
          fileError.message
        );
      }
    }
  } catch (error) {
    console.warn('[REPORT CLEANUP] Cleanup failed:', error.message);
  }
}

export function startTempReportsCleanup({
  reportsDir,
  maxAgeMinutes = 60,
  intervalMinutes = 30
}) {
  cleanupTempReports({
    reportsDir,
    maxAgeMinutes
  });

  const intervalMs = intervalMinutes * 60 * 1000;

  setInterval(() => {
    cleanupTempReports({
      reportsDir,
      maxAgeMinutes
    });
  }, intervalMs);
}