import fs from 'fs/promises';

export async function storeDownloadedRunArtifacts(downloadedResult, runOutputDir) {
  await fs.mkdir(runOutputDir, { recursive: true });
  return downloadedResult;
}
