#!/usr/bin/env node

/**
 * Script para automatizar o versionamento do AgroSaldo
 * - Incrementa a versão no package.json
 * - Atualiza o version-history.json
 * - Configura variáveis de ambiente de build
 * npm run version:auto
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const VERSION_HISTORY_PATH = path.join(ROOT_DIR, 'version-history.json');

/**
 * Obtém informações do Git
 */
function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    // Verifica se há mudanças não commitadas
    const hasChanges = execSync('git status --porcelain', { encoding: 'utf8' }).trim() !== '';
    
    return { commit, shortCommit, branch, hasChanges };
  } catch (error) {
    return { 
      commit: 'unknown', 
      shortCommit: 'unknown', 
      branch: 'unknown', 
      hasChanges: false 
    };
  }
}

/**
 * Incrementa versão semântica (suporta 4 números: major.minor.patch.build)
 */
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  // Garante que sempre tenha 4 partes (preenche com 0 se necessário)
  while (parts.length < 4) {
    parts.push(0);
  }
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      parts[3] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      parts[3] = 0;
      break;
    case 'patch':
      parts[2]++;
      parts[3] = 0;
      break;
    case 'build':
    default:
      parts[3]++;
      break;
  }
  
  return parts.join('.');
}

/**
 * Atualiza package.json com nova versão
 */
function updatePackageVersion(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.version = newVersion;
  
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
  return packageJson;
}

/**
 * Gera lista de mudanças baseada nos commits recentes
 */
function generateChangesList() {
  try {
    // Pega os últimos commits desde a última tag ou últimos 10 commits
    let commits;
    try {
      const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      commits = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, { encoding: 'utf8' });
    } catch {
      // Se não há tags, pega os últimos 5 commits
      commits = execSync('git log -5 --oneline --no-merges', { encoding: 'utf8' });
    }
    
    if (!commits.trim()) {
      return ['Melhorias e correções gerais'];
    }
    
    return commits
      .trim()
      .split('\n')
      .map(line => {
        // Remove o hash do commit e limpa a mensagem
        const message = line.replace(/^[a-f0-9]+\s/, '').trim();
        
        // Adiciona emojis baseados no tipo de commit
        if (message.toLowerCase().includes('feat') || message.toLowerCase().includes('feature')) {
          return `✨ ${message}`;
        } else if (message.toLowerCase().includes('fix') || message.toLowerCase().includes('bug')) {
          return `🐛 ${message}`;
        } else if (message.toLowerCase().includes('docs')) {
          return `📚 ${message}`;
        } else if (message.toLowerCase().includes('style') || message.toLowerCase().includes('ui')) {
          return `💅 ${message}`;
        } else if (message.toLowerCase().includes('refactor')) {
          return `♻️  ${message}`;
        } else if (message.toLowerCase().includes('perf')) {
          return `⚡ ${message}`;
        } else if (message.toLowerCase().includes('test')) {
          return `🧪 ${message}`;
        } else {
          return `🔧 ${message}`;
        }
      })
      .filter(Boolean);
  } catch (error) {
    return ['Melhorias e correções gerais'];
  }
}

/**
 * Determina tipo de versão baseado nas mudanças
 */
function determineVersionType(changes) {
  const allChanges = changes.join(' ').toLowerCase();
  
  if (allChanges.includes('breaking') || allChanges.includes('major')) {
    return 'major';
  } else if (allChanges.includes('feat') || allChanges.includes('feature') || allChanges.includes('minor')) {
    return 'minor';
  } else {
    return 'patch';
  }
}

/**
 * Atualiza histórico de versões
 */
function updateVersionHistory(version, type, changes) {
  let history = [];
  
  // Lê histórico existente
  if (fs.existsSync(VERSION_HISTORY_PATH)) {
    try {
      history = JSON.parse(fs.readFileSync(VERSION_HISTORY_PATH, 'utf8'));
    } catch (error) {
      history = [];
    }
  }
  
  // Adiciona nova entrada no início
  const newEntry = {
    version,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    changes,
    type
  };
  
  history.unshift(newEntry);
  
  // Mantém apenas os últimos 50 registros
  if (history.length > 50) {
    history = history.slice(0, 50);
  }
  
  fs.writeFileSync(VERSION_HISTORY_PATH, JSON.stringify(history, null, 2) + '\n');
}

/**
 * Atualiza arquivo .env com informações de build
 */
function updateEnvFile() {
  // Atualiza o .env do backend (onde as variáveis são realmente usadas)
  const backendEnvPath = path.join(ROOT_DIR, 'backend', '.env');
  const { commit, shortCommit, branch } = getGitInfo();
  const buildDate = new Date().toISOString();
  const buildNumber = Date.now().toString();

  let envContent = '';
  
  // Lê arquivo .env existente se houver
  if (fs.existsSync(backendEnvPath)) {
    envContent = fs.readFileSync(backendEnvPath, 'utf8');
  }

  // Remove variáveis de versão e comentários antigos
  envContent = envContent
    .split('\n')
    .filter(line =>
      !line.startsWith('# Informações de versão (geradas automaticamente)') &&
      !line.startsWith('BUILD_DATE=') &&
      !line.startsWith('BUILD_NUMBER=') &&
      !line.startsWith('GIT_COMMIT=') &&
      !line.startsWith('GIT_BRANCH=') &&
      !line.startsWith('GIT_SHORT_COMMIT=')
    )
    .join('\n');

  // Adiciona novas variáveis de versão
  const versionVars = [
    `BUILD_DATE=${buildDate}`,
    `BUILD_NUMBER=${buildNumber}`,
    `GIT_COMMIT=${commit}`,
    `GIT_SHORT_COMMIT=${shortCommit}`,
    `GIT_BRANCH=${branch}` 
  ];

  if (envContent && !envContent.endsWith('\n')) {
    envContent += '\n';
  }
  
  envContent += '\n# Informações de versão (geradas automaticamente)\n';
  envContent += versionVars.join('\n') + '\n';

  fs.writeFileSync(backendEnvPath, envContent);
}

/**
 * Cria tag Git para a nova versão
 */
function createGitTag(version) {
  try {
    const { hasChanges } = getGitInfo();
    
    if (hasChanges) {
      return false;
    }
    
    execSync(`git tag -a v${version} -m "Release version ${version}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Função principal
 */
function main() {
  // Verifica se package.json existe
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error('❌ package.json não encontrado');
    process.exit(1);
  }
  
  // Lê versão atual
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const currentVersion = packageJson.version;
  
  // Gera lista de mudanças
  const changes = generateChangesList();
  const versionType = determineVersionType(changes);
  
  // Calcula nova versão
  const newVersion = incrementVersion(currentVersion, versionType);
  
  console.log(`\n🚀 Atualizando versão de ${currentVersion} para ${newVersion} (${versionType})\n`);
  
  // Atualiza arquivos de versão
  updatePackageVersion(newVersion);
  updateVersionHistory(newVersion, versionType, changes);
  updateEnvFile();

  // Cria tag Git (opcional)
  const tagCreated = createGitTag(newVersion);
  if (tagCreated) {
    console.log(`✅ Tag Git v${newVersion} criada com sucesso!`);
  }

  console.log('\n📋 Mudanças desta versão:');
  changes.forEach(change => console.log(`  ${change}`));
  console.log('');
}

// Executar apenas quando chamado diretamente
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule || import.meta.url.endsWith('auto-version.js')) {
  main();

  // Automatiza commit e push dos arquivos de versão
  try {
    console.log('📝 Commitando alterações...');
    // Adiciona todos os arquivos alterados (silenciosamente)
    execSync('git add .', { stdio: 'pipe' });
    
    // Faz commit automático (silenciosamente)
    execSync('git commit -m "chore: atualiza versionamento automático [skip ci]"', { stdio: 'pipe' });
    console.log('✅ Commit realizado com sucesso');
    
    // Faz push automático
    console.log('🚀 Enviando para repositório remoto...');
    execSync('git push', { stdio: 'inherit' });
    console.log('✅ Push realizado com sucesso\n');
  } catch (err) {
    if (err.message.includes('nothing to commit')) {
      console.log('ℹ️  Nenhuma alteração para commitar\n');
    } else {
      console.error('⚠️  Erro ao commitar/push:', err.message);
    }
  }
}

export {
  getGitInfo,
  incrementVersion,
  updatePackageVersion,
  updateVersionHistory,
  updateEnvFile,
  createGitTag
};
