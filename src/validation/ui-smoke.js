import fs from 'fs/promises';
import path from 'path';

export async function validateUiRun(runDir, caseConfig) {
  const checks = [];
  const artifactDir = path.join(runDir, 'artifacts');
  const requiredArtifacts = caseConfig.expectedArtifacts || ['index.html'];

  for (const artifact of requiredArtifacts) {
    const artifactPath = path.join(artifactDir, artifact);
    const exists = await fileExists(artifactPath);
    checks.push({
      id: `required-${artifact.replace(/[^a-z0-9]+/gi, '-')}`,
      passed: exists,
    });
  }

  const htmlPath = path.join(artifactDir, 'index.html');
  const htmlContent = (await fileExists(htmlPath)) ? await fs.readFile(htmlPath, 'utf-8') : '';
  const hasHtmlTag = /<html[\s>]/i.test(htmlContent) || /<!DOCTYPE html>/i.test(htmlContent);

  checks.push({
    id: 'html-structure',
    passed: hasHtmlTag,
  });

  checks.push({
    id: 'screenshot',
    passed: false,
    skipped: true,
    details: {
      reason: 'Screenshot capture is not implemented in the MVP scaffold yet.',
    },
  });

  checks.push({
    id: 'console-errors',
    passed: true,
    skipped: true,
    details: {
      reason: 'Console collection is not implemented in the MVP scaffold yet.',
    },
  });

  return {
    mode: caseConfig.validation?.mode || 'ui-smoke',
    passed: checks.every((check) => check.passed || check.skipped),
    checks,
  };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
