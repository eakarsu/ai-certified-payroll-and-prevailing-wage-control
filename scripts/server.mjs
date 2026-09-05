import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { inspectPort } from './port-status.mjs';
const require = createRequire(import.meta.url);
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const mode = process.argv[2] === 'dev' ? 'dev' : 'start';
if (mode === 'start' && (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32)) throw new Error('Configure NEXTAUTH_SECRET with at least 32 random characters');
process.env.NODE_ENV = mode === 'start' ? 'production' : 'development';
const port = Number(process.env.PORT || 5700);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const host = process.env.HOST || (mode === 'dev' ? '127.0.0.1' : '0.0.0.0');
const {name: service} = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const status = await inspectPort({host, port, service});
if (status.state === 'running') {
  console.log(`Already running: ${status.url} — open this URL in your browser.`);
  console.log('The existing server was left running.');
} else if (status.state !== 'available') {
  console.error(status.state === 'unhealthy'
    ? `This app already occupies port ${port}, but its health check failed. Check its server log and database connection.`
    : `Port ${port} is occupied by another service or an unresponsive server. No process was stopped. Choose a free PORT or stop the conflicting service.`);
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), mode, '-p', String(port), '-H', host], {stdio:'inherit', env:process.env});
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('error', error => { console.error(`Unable to launch server: ${error.message}`); process.exitCode = 1; });
  child.on('exit', code => {process.exitCode = code ?? 1;});
}
