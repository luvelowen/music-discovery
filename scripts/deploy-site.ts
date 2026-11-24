/**
 * Publishes the site/ folder to GitHub Pages (the gh-pages branch).
 *   npm.cmd run site:deploy
 * It refreshes the music lists and icons, checks for secrets, then pushes only the site/ files.
 */
import { execFileSync } from 'node:child_process';

const run = (command: string, args: string[]) => execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

run('node', ['scripts/build-site.ts']);
run('node', ['scripts/check-secrets.ts']);
if (run('git', ['status', '--porcelain', 'site'])) {
  console.error('site/ has changes that are not committed yet. Commit them first, then deploy.');
  process.exit(1);
}
const commit = run('git', ['subtree', 'split', '--prefix', 'site']);
run('git', ['push', '--force', 'origin', `${commit}:refs/heads/gh-pages`]);
console.log('Pushed to gh-pages. GitHub Pages updates in a minute or two: https://luvelowen.github.io/music-discovery/');
