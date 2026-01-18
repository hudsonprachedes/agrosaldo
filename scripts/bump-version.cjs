const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

function parse4(version) {
  const parts = String(version).trim().split('.');
  if (parts.length !== 4 || parts.some(p => p === '' || Number.isNaN(Number(p)))) {
    throw new Error(`Versão inválida (esperado A.B.C.D): ${version}`);
  }
  return parts.map(p => Number(p));
}

function format4([a, b, c, d]) {
  return [a, b, c, d].join('.');
}

function bumpPatch(version) {
  const [a, b, c, d] = parse4(version);
  return format4([a, b, c, d + 1]);
}

function bump(version, level) {
  const [a, b, c, d] = parse4(version);
  if (level === 'major') return format4([a + 1, 0, 0, 0]);
  if (level === 'minor') return format4([a, b + 1, 0, 0]);
  if (level === 'patch') return format4([a, b, c + 1, 0]);
  if (level === 'build') return format4([a, b, c, d + 1]);
  throw new Error(`Nível de bump inválido: ${level}`);
}

function tryExec(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim();
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const rangeIndex = args.findIndex(a => a === '--range');
  const range = rangeIndex >= 0 ? args[rangeIndex + 1] : null;
  return {
    help: flags.has('--help') || flags.has('-h'),
    forceMajor: flags.has('--major'),
    forceMinor: flags.has('--minor'),
    forcePatch: flags.has('--patch'),
    forceBuild: flags.has('--build'),
    sinceTag: flags.has('--since-tag'),
    range,
  };
}

function getGitMessages({ sinceTag, range }) {
  const gitDir = tryExec('git rev-parse --git-dir');
  if (!gitDir) return [];

  const resolvedRange = (() => {
    if (range) return range;
    if (sinceTag) {
      const lastTag = tryExec('git describe --tags --abbrev=0');
      if (lastTag) return `${lastTag}..HEAD`;
    }
    return 'HEAD~0..HEAD';
  })();

  const out = tryExec(`git log --pretty=%B --no-merges ${resolvedRange}`);
  if (!out) return [];
  return out
    .split(/\n{2,}/g)
    .map(s => s.trim())
    .filter(Boolean);
}

function detectBumpLevelFromMessages(messages) {
  const normalized = messages.join('\n\n');
  if (/BREAKING CHANGE:/i.test(normalized)) return 'major';

  const subjectLines = messages
    .map(m => m.split('\n')[0].trim())
    .filter(Boolean);

  if (subjectLines.some(s => /^[a-z]+(\([^)]*\))?!:/.test(s))) return 'major';
  if (subjectLines.some(s => /^feat(\([^)]*\))?:/.test(s))) return 'minor';
  if (subjectLines.some(s => /^(fix|perf|refactor)(\([^)]*\))?:/.test(s))) return 'patch';
  return 'build';
}

function resolveBumpLevel(argv) {
  const forced = [
    argv.forceMajor && 'major',
    argv.forceMinor && 'minor',
    argv.forcePatch && 'patch',
    argv.forceBuild && 'build',
  ].filter(Boolean);

  if (forced.length > 1) {
    throw new Error('Use apenas uma flag de override: --major, --minor, --patch ou --build.');
  }

  if (forced.length === 1) return forced[0];

  const messages = getGitMessages({ sinceTag: argv.sinceTag, range: argv.range });
  return detectBumpLevelFromMessages(messages);
}

function printHelp() {
  console.log('Uso: npm run version:bump -- [opções]');
  console.log('');
  console.log('Detecção automática (Conventional Commits):');
  console.log('  - **major**: contém "BREAKING CHANGE:" ou "type!:", ex.: "feat!: ..."');
  console.log('  - **minor**: "feat:"');
  console.log('  - **patch**: "fix:", "perf:", "refactor:"');
  console.log('  - **build**: qualquer outro caso (incrementa o 4º número)');
  console.log('');
  console.log('Opções:');
  console.log('  --since-tag   Analisa commits desde a última tag (fallback: último commit).');
  console.log('  --range X..Y  Analisa um range específico do git (ex.: v1.2.3..HEAD).');
  console.log('  --major|--minor|--patch|--build  Força o tipo de bump (override).');
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const current = pkg.version;

const argv = parseArgs(process.argv);
if (argv.help) {
  printHelp();
  process.exit(0);
}

const bumpLevel = resolveBumpLevel(argv);
const next = bump(current, bumpLevel);

pkg.version = next;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`Bump detectado: ${bumpLevel}`);
console.log(`Versão atualizada: ${current} -> ${next}`);
