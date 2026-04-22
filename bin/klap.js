#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const https = require('https');

const isWin = process.platform === 'win32';
const command = process.argv[2];

// -- Lógica de comprobación de actualizaciones --
let updateMessage = null;

function checkUpdates() {
    return new Promise((resolve) => {
        try {
            const localPkg = require('../package.json');
            const options = {
                hostname: 'raw.githubusercontent.com',
                port: 443,
                path: '/rodriguezyanez/eco-team-brain/master/package.json',
                method: 'GET',
                timeout: 2500
            };

            const req = https.request(options, (res) => {
                if (res.statusCode !== 200) return resolve();
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const remotePkg = JSON.parse(data);
                        if (remotePkg.version && remotePkg.version !== localPkg.version) {
                            updateMessage = `\n---------------------------------------------------------\n\x1b[33m💡 ¡Nueva versión del Ecosistema Klap disponible!\x1b[0m\nVersión actual: \x1b[31m${localPkg.version}\x1b[0m -> Nueva versión: \x1b[32m${remotePkg.version}\x1b[0m\nEjecuta: \x1b[36mnpm update -g @rodriguezyanez/eco-team-brain\x1b[0m para actualizar.\n---------------------------------------------------------\n`;
                        }
                    } catch(e) {}
                    resolve();
                });
            });

            req.on('error', () => { resolve(); });
            req.on('timeout', () => { req.destroy(); resolve(); });
            req.end();
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
    console.log('  init      Inicializa el entorno completo (DB + Estándares + Skills)');
    console.log('  sync      Sincroniza memorias locales pendientes con Neo4j');
    console.log('  update    Actualiza el Standard KLAP BYSF (incremental)');
    console.log('  export    Exporta el grafo de Neo4j a un archivo JSON');
    console.log('  import    Importa y mergea un archivo JSON en Neo4j');
    console.log('  obsidian  Exporta el grafo a formato Markdown para Obsidian');
    console.log('  backup    Gestión de backups de volúmenes Docker');
    console.log('  rollback  Revierte la instalación y restaura backups');
    console.log('\nGestión de Neo4j:');
    console.log('  up, down, restart, status, logs, browser');
    process.exit(0);
}

const commandMap = {
    'init': isWin ? 'scripts/windows/init-brain.ps1' : 'scripts/linux/init-brain.sh',
    'sync': isWin ? 'scripts/windows/brain-sync.ps1' : 'scripts/linux/brain-sync.sh',
    'update': isWin ? 'scripts/windows/brain-update.ps1' : 'scripts/linux/brain-update.sh',
    'rollback': isWin ? 'scripts/windows/rollback.ps1' : 'scripts/linux/rollback.sh',
    'export': isWin ? 'scripts/windows/brain-export.ps1' : 'scripts/linux/brain-export.sh',
    'import': isWin ? 'scripts/windows/brain-import.ps1' : 'scripts/linux/brain-import.sh',
    'obsidian': isWin ? 'scripts/windows/export-obsidian.ps1' : 'scripts/linux/export-obsidian.sh',
    'backup': isWin ? 'scripts/windows/backup.ps1' : 'scripts/linux/backup.sh',
    // Comandos de gestión delegan en brain.ps1/sh
    'up': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain-sync.sh', // Fallback
    'down': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain-sync.sh',
    'restart': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain-sync.sh',
    'status': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain-sync.sh',
    'logs': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain-sync.sh',
    'browser': isWin ? 'scripts/windows/brain.ps1' : 'scripts/linux/brain-sync.sh'
};

// Mapeo especial para comandos que van dentro de brain.ps1
const brainCommands = ['up', 'down', 'restart', 'status', 'logs', 'browser'];

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

