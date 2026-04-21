#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const command = process.argv[2];

if (!command) {
    console.log('Ecosistema Klap - CLI');
    console.log('Uso: klap <comando>');
    console.log('\nComandos disponibles:');
    console.log('  sync      Sincroniza el cerebro');
    console.log('  init      Inicializa el entorno');
    console.log('  update    Actualiza el ecosistema');
    console.log('  rollback  Revierte la instalación y restaura backups');
    process.exit(0);
}

const commandMap = {
    'sync': isWin ? 'scripts/windows/brain-sync.ps1' : 'scripts/linux/brain-sync.sh',
    'init': isWin ? 'scripts/windows/init-brain.ps1' : 'scripts/linux/init-brain.sh',
    'update': isWin ? 'scripts/windows/brain-update.ps1' : 'scripts/linux/brain-update.sh',
    'rollback': isWin ? 'scripts/windows/rollback.ps1' : 'scripts/linux/rollback.sh'
};

const scriptPath = commandMap[command];

if (!scriptPath) {
    console.error(`Comando desconocido: ${command}`);
    process.exit(1);
}

const fullPath = path.join(__dirname, '..', scriptPath);

let child;
if (isWin) {
    child = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', fullPath], { stdio: 'inherit' });
} else {
    child = spawn('bash', [fullPath], { stdio: 'inherit' });
}

child.on('exit', (code) => {
    process.exit(code);
});
