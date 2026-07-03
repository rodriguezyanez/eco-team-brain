#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const klap = path.join(__dirname, 'klap.js');
spawn('node', [klap, 'sync'], { stdio: 'inherit' });
