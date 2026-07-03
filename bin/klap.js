#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const command = process.argv[2];

// -- Lógica de comprobación de actualizaciones --
let updateMessage = null;

function isNewerVersion(remote, local) {
    const remoteParts = remote.split('.').map(Number);
    const localParts = local.split('.').map(Number);
    for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
        const r = remoteParts[i] || 0;
        const l = localParts[i] || 0;
        if (r !== l) return r > l;
    }
    return false;
}

function checkUpdates() {
    return new Promise((resolve) => {
        try {
            const localPkg = require('../package.json');
            // Consulta la versión realmente publicada en el registry (no el package.json
            // de master, que puede quedar adelantado si el bump se pushea antes del npm publish).
            exec(`npm view ${localPkg.name} version`, { timeout: 4000 }, (err, stdout) => {
                if (err) return resolve();
                const remoteVersion = stdout.trim();
                if (remoteVersion && isNewerVersion(remoteVersion, localPkg.version)) {
                    updateMessage = `\n---------------------------------------------------------\n\x1b[33m💡 ¡Nueva versión del Ecosistema Klap disponible!\x1b[0m\nVersión actual: \x1b[31m${localPkg.version}\x1b[0m -> Nueva versión: \x1b[32m${remoteVersion}\x1b[0m\nEjecuta: \x1b[36mnpm update -g @rodriguezyanez/eco-team-brain\x1b[0m para actualizar.\n---------------------------------------------------------\n`;
                }
                resolve();
            });
        } catch (e) {
            resolve();
        }
    });
}

const updatePromise = command ? checkUpdates() : Promise.resolve();

if (!command) {
    console.log('Ecosistema Klap - CLI');
    console.log('Uso: klap <comando> [argumentos]');
    console.log('\nComandos disponibles:');
    console.log('  init      Inicializa el entorno completo (DB + Estándares + Skills + Commands)');
    console.log('  install   Instala commands y workflows en ~/.claude (sin reinicializar DB)');
    console.log('  sync      Sincroniza memorias locales pendientes con Neo4j');
    console.log('  update    Actualiza el Standard KLAP BYSF (incremental)');
    console.log('  export    Exporta el grafo de Neo4j a un archivo JSON');
    console.log('  import    Importa y mergea un archivo JSON en Neo4j');
    console.log('  obsidian  Exporta el grafo a formato Markdown para Obsidian');
    console.log('  backup    Gestión de backups de volúmenes Docker');
    console.log('  rollback  Revierte la instalación y restaura backups');
    console.log('  config    Ver/cambiar la conexión Neo4j (host, usuario, password)');
    console.log('\nHerramientas de seguridad (gates de /auditoria):');
    console.log('  trivy     Instala Trivy (scanner de vulnerabilidades)');
    console.log('  depcheck  Instala OWASP Dependency-Check CLI');
    console.log('\nGestión de Neo4j:');
    console.log('  up, down, restart, status, logs, browser');
    console.log('  mcp       Registra los MCP (team-brain + Context7) en Claude Code');
    console.log('\nEjemplos config:');
    console.log('  klap config show');
    console.log('  klap config set -Host 10.0.0.50 -Password nueva-pass');
    console.log('  klap config reset');
    process.exit(0);
}

const commandMap = {
    'init': isWin ? 'scripts/windows/init-brain.ps1' : 'scripts/linux/init-brain.sh',
    'install': isWin ? 'scripts/windows/install-commands.ps1' : 'scripts/linux/install-commands.sh',
    'sync': isWin ? 'scripts/windows/brain-sync.ps1' : 'scripts/linux/brain-sync.sh',
    'update': isWin ? 'scripts/windows/brain-update.ps1' : 'scripts/linux/brain-update.sh',
    'rollback': isWin ? 'scripts/windows/rollback.ps1' : 'scripts/linux/rollback.sh',
    'export': isWin ? 'scripts/windows/brain-export.ps1' : 'scripts/linux/brain-export.sh',
    'import': isWin ? 'scripts/windows/brain-import.ps1' : 'scripts/linux/brain-import.sh',
    'obsidian': isWin ? 'scripts/windows/export-obsidian.ps1' : 'scripts/linux/export-obsidian.sh',
    'backup': isWin ? 'scripts/windows/backup.ps1' : 'scripts/linux/backup.sh',
    'config': isWin ? 'scripts/windows/config-neo4j.ps1' : 'scripts/linux/config-neo4j.sh',
    // Instaladores de herramientas de seguridad (gates de /auditoria)
    'trivy': isWin ? 'scripts/windows/install-trivy.ps1' : 'scripts/linux/install-trivy.sh',
    'depcheck': isWin ? 'scripts/windows/install-depcheck.ps1' : 'scripts/linux/install-depcheck.sh',
    // Comandos de gestión delegan en brain.ps1/brain.sh
    'up': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain.sh',
    'down': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain.sh',
    'restart': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain.sh',
    'status': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain.sh',
    'logs': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain.sh',
    'browser': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain.sh',
    'mcp': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain.sh'
};

// Mapeo especial para comandos que van dentro de brain.ps1/brain.sh
const brainCommands = ['up', 'down', 'restart', 'status', 'logs', 'browser', 'mcp'];

const scriptPath = commandMap[command];

if (!scriptPath) {
    console.error(`Comando desconocido: ${command}`);
    process.exit(1);
}

const fullPath = path.join(__dirname, '..', scriptPath);
const args = process.argv.slice(3);

let child;
if (isWin) {
    let psArgs = ['-ExecutionPolicy', 'Bypass', '-File', fullPath];
    if (brainCommands.includes(command)) {
        psArgs.push('-Action', command);
    }
    psArgs = psArgs.concat(args);
    child = spawn('powershell.exe', psArgs, { stdio: 'inherit' });
} else {
    let bashArgs = [fullPath];
    if (brainCommands.includes(command)) {
        bashArgs.push(command);
    }
    bashArgs = bashArgs.concat(args);
    child = spawn('bash', bashArgs, { stdio: 'inherit' });
}

child.on('exit', async (code) => {
    // Esperar a que la comprobación de actualización termine (con timeout ya definido)
    await updatePromise;
    if (updateMessage) {
        console.log(updateMessage);
    }
    process.exit(code);
});

