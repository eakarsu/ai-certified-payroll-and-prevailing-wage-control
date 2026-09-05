import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
if(!fs.existsSync('.env'))throw new Error('Copy .env.example to .env and configure database, authentication and provider settings first.');
process.loadEnvFile('.env');
for(const args of [['run','db:generate'],['run','db:deploy'],['run','db:seed'],['run','build']]){const r=spawnSync('npm',args,{stdio:'inherit',env:{...process.env,NODE_ENV:'production'}});if(r.status!==0)process.exit(r.status||1);}
console.log('Setup complete. Start with npm start.');
