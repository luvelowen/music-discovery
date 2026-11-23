/**
 * Looks for passwords, API keys and private files before they reach GitHub (the repository is public).
 *   node scripts/check-secrets.ts           every file in the repository
 *   node scripts/check-secrets.ts --staged  only what is about to be committed (the pre-commit hook)
 * It prints the file and line, never the secret itself.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const staged = process.argv.includes('--staged');
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const files = (staged ? git('diff', '--cached', '--name-only', '--diff-filter=ACMR') : git('ls-files'))
  .split('\n')
  .filter(Boolean);

// Files that must never be in the repository at all.
const FORBIDDEN = [
  /(^|\/)\.env(\.(?!example$)[^/]*)?$/, // .env, .env.local, .env.production (only .env.example is allowed)
  /^data\//, // The real accounts. Only the top-level folder: app/account/data is a page.
  /^private\//,
  /\.(db|sqlite|db-journal|pem|key|p12|pfx)$/,
  /(^|\/)id_rsa/,
  /(^|\/)(credentials|service-account)[^/]*\.json$/,
];

// Shapes of real keys. Each is specific enough not to fire on ordinary code.
const PATTERNS: [string, RegExp][] = [
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['OpenAI or Anthropic key', /\bsk-(ant-|proj-)?[A-Za-z0-9_-]{24,}\b/],
  ['Stripe key', /\b(sk|rk)_live_[A-Za-z0-9]{20,}\b/],
  ['Slack token', /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/],
  ['Spotify or other client secret', /client[_-]?secret\s*[:=]\s*['"]?[A-Za-z0-9]{24,}/i],
  // A filled-in password line, like the ones in .env.local. Empty values (SMTP_PASS=) are fine.
  ['password in a settings line', /^[ \t]*(SMTP_PASS|[A-Z_]*(PASSWORD|SECRET|API_KEY|TOKEN))[ \t]*=[ \t]*\S{4,}/],
];

const found: string[] = [];
for (const file of files) {
  if (FORBIDDEN.some((rule) => rule.test(file))) {
    found.push(`${file}: this file must never be committed`);
    continue;
  }
  if (file === 'package-lock.json' || file.endsWith('.jpg') || file.endsWith('.png') || file === 'scripts/check-secrets.ts') continue;
  let text: string;
  try {
    text = staged ? git('show', `:${file}`) : readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (text.includes('\0')) continue; // Binary.
  const lines = text.split('\n');
  for (const [name, pattern] of PATTERNS) {
    const line = lines.findIndex((row) => pattern.test(row));
    if (line !== -1) found.push(`${file}:${line + 1}: looks like a ${name}`);
  }
}

if (found.length) {
  console.error('Stopped: something secret may be about to go public.\n');
  for (const item of found) console.error(`  ${item}`);
  console.error('\nMove secrets into .env.local (it is never uploaded) and try again.');
  process.exit(1);
}
console.log(`No secrets found in ${files.length} file${files.length === 1 ? '' : 's'}.`);
