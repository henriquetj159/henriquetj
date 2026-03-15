#!/usr/bin/env node

/**
 * copy-project-config.js
 *
 * Helper para copiar templates .claude/ para projetos.
 * Usado internamente pelo /new-project skill.
 *
 * Usage:
 *   node tools/copy-project-config.js {destination} {type} {projectName} {mode}
 *
 * Exemplo:
 *   node tools/copy-project-config.js ~/CODE/Projects/my-app app "My App" HYBRID
 *   node tools/copy-project-config.js docs/projects/my-proj knowledge "My Knowledge" CENTRALIZED
 */

const fs = require('fs-extra');
const path = require('path');

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════

const TEMPLATES_DIR = path.join(__dirname, 'templates/project-configs');

const VALID_TYPES = ['app', 'squad', 'mind-clone', 'pipeline', 'knowledge', 'research'];
const VALID_MODES = ['HYBRID', 'CENTRALIZED'];

const MODE_DESCRIPTIONS = {
  HYBRID: 'Governança local — INDEX, stories e sessions vivem em `.aios/` dentro do projeto.',
  CENTRALIZED: 'Governança central — INDEX, stories e sessions vivem em `docs/projects/{nome}/` dentro do aios-core.'
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function replacePlaceholders(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  return result;
}

function computePaths(destination, mode, projectName) {
  const slug = projectName.toLowerCase().replace(/\s+/g, '-');

  if (mode === 'HYBRID') {
    return {
      INDEX_PATH: '.aios/INDEX.md',
      STORIES_PATH: '.aios/stories/active/',
      SESSIONS_PATH: '.aios/sessions/',
      SAVE_LOCATION: '.aios/',
      PROJECT_SLUG: slug
    };
  } else {
    return {
      INDEX_PATH: `docs/projects/${slug}/INDEX.md`,
      STORIES_PATH: `docs/projects/${slug}/stories/active/`,
      SESSIONS_PATH: `docs/projects/${slug}/sessions/`,
      SAVE_LOCATION: `docs/projects/${slug}/`,
      PROJECT_SLUG: slug
    };
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function copyProjectConfig(destination, type, projectName, mode) {
  const resolvedDest = path.resolve(destination);

  console.log(`\n📋 Copiando templates .claude/ para: ${resolvedDest}\n`);

  // Validar inputs
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Tipo inválido: ${type}. Válidos: ${VALID_TYPES.join(', ')}`);
  }

  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Modo inválido: ${mode}. Válidos: ${VALID_MODES.join(', ')}`);
  }

  // 1. Copiar base
  const baseSrc = path.join(TEMPLATES_DIR, 'base/.claude');
  const claudeDest = path.join(resolvedDest, '.claude');

  console.log(`✅ Copiando base template...`);
  await fs.copy(baseSrc, claudeDest);

  // 2. Sobrescrever com tipo específico (se existe)
  const typeSrc = path.join(TEMPLATES_DIR, type, '.claude/settings.json');
  if (await fs.pathExists(typeSrc)) {
    console.log(`✅ Aplicando override para tipo: ${type}`);
    await fs.copy(typeSrc, path.join(claudeDest, 'settings.json'));
  } else {
    console.log(`ℹ️  Tipo '${type}' usa settings.json base (sem override)`);
  }

  // 3. Substituir placeholders no CLAUDE.md
  const claudeMdPath = path.join(claudeDest, 'CLAUDE.md');
  let claudeMdContent = await fs.readFile(claudeMdPath, 'utf-8');

  const paths = computePaths(destination, mode, projectName);
  const vars = {
    PROJECT_NAME: projectName,
    MODE: mode,
    MODE_DESCRIPTION: MODE_DESCRIPTIONS[mode],
    ...paths
  };

  claudeMdContent = replacePlaceholders(claudeMdContent, vars);
  await fs.writeFile(claudeMdPath, claudeMdContent);

  console.log(`✅ Placeholders substituídos em CLAUDE.md`);

  // 4. Validar estrutura final
  const requiredFiles = [
    '.claude/settings.json',
    '.claude/CLAUDE.md',
    '.claude/rules/behavioral-rules.md',
    '.claude/rules/project-rules.md'
  ];

  console.log(`\n🔍 Validando estrutura criada...\n`);
  for (const file of requiredFiles) {
    const fullPath = path.join(resolvedDest, file);
    if (await fs.pathExists(fullPath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} — MISSING!`);
      throw new Error(`Arquivo obrigatório não foi criado: ${file}`);
    }
  }

  console.log(`\n🎉 Configuração .claude/ criada com sucesso!\n`);
  console.log(`📂 Destino: ${resolvedDest}/.claude/`);
  console.log(`📝 Tipo: ${type}`);
  console.log(`🔧 Modo: ${mode}\n`);
}

// ═══════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════

const [destination, type, projectName, mode] = process.argv.slice(2);

if (!destination || !type || !projectName || !mode) {
  console.error('❌ Uso: node copy-project-config.js {destination} {type} {projectName} {mode}');
  console.error('Exemplo: node copy-project-config.js ~/CODE/Projects/my-app app "My App" HYBRID');
  process.exit(1);
}

copyProjectConfig(destination, type, projectName, mode).catch((err) => {
  console.error('❌ Erro ao copiar configuração:', err.message);
  process.exit(1);
});
