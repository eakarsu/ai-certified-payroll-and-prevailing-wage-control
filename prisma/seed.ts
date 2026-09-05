import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import metadata from '../src/config/record-metadata.json';
import { appConfig } from '../src/config/app';
const db=new PrismaClient();
async function main(){
 const email=process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.INITIAL_ADMIN_PASSWORD;
 if(!email||!password||password.length<16||Buffer.byteLength(password)>72)throw new Error('Set INITIAL_ADMIN_EMAIL and a 16–72 byte INITIAL_ADMIN_PASSWORD');
 const user=await db.user.upsert({where:{email},create:{email,name:'Workspace administrator',role:'ADMIN',passwordHash:await bcrypt.hash(password,12)},update:{}});
 if(process.env.SEED_DEMO_DATA!=='true'){console.log('Administrator initialized. Demo data disabled.');return;}
 const meta=metadata as Record<string,{name:string;fields:{name:string;kind:string;relation?:string;required:boolean}[]}>;
 const root=Object.keys(meta)[0];
 type Delegate={count():Promise<number>;create(args:unknown):Promise<{id:string}>};
 if(await (db as unknown as Record<string,Delegate>)[root[0].toLowerCase()+root.slice(1)].count()){console.log('Records already exist; demo seed skipped.');return;}
 await db.$transaction(async tx=>{
  const ids:Record<string,string>={};
  for(const[name,model]of Object.entries(meta)){
   const data:Record<string,unknown>={};
   for(const f of model.fields){
    if(f.relation){if(!ids[f.relation])throw new Error('Seed relation order invalid');data[f.name]=ids[f.relation];}
    else if(f.kind==='date')data[f.name]=new Date(/end|expir|due|target|until/i.test(f.name)?'2026-10-30T12:00:00Z':'2026-10-01T12:00:00Z');
    else if(f.kind==='number')data[f.name]=/cents/i.test(f.name)?10000:/percent/i.test(f.name)?25:/year/i.test(f.name)?2026:10;
    else if(f.kind==='boolean')data[f.name]=false;
    else if(f.name==='status')data[f.name]='Draft';
    else if(f.name==='name'||f.name==='title')data[f.name]=`Example — ${name.replace(/([a-z])([A-Z])/g,'$1 $2')}`;
    else if(/owner|reviewer|coordinator|mentor|operator|surveyor|preparer|clerk|technician|custodian/i.test(f.name))data[f.name]='Jordan Lee (fictional)';
    else if(/currency/i.test(f.name))data[f.name]='USD';
    else if(/url/i.test(f.name))data[f.name]='https://example.invalid/reviewed-source';
    else if(/number|code|reference/i.test(f.name))data[f.name]='EXAMPLE-001';
    else if(/priority/i.test(f.name))data[f.name]='Normal';
    else if(/direction/i.test(f.name))data[f.name]='in';
    else if(/version/i.test(f.name))data[f.name]='Example v1';
    else data[f.name]=`Fictional ${f.name.replace(/([a-z])([A-Z])/g,'$1 $2')} for ${appConfig.title}. Replace with reviewed source evidence.`;
   }
   const row=await(tx as unknown as Record<string,Delegate>)[name[0].toLowerCase()+name.slice(1)].create({data});ids[name]=row.id;
  }
  await tx.auditLog.create({data:{actorId:user.id,actorName:user.name,action:'DEMO_DATA_INITIALIZED',entity:root,entityId:ids[root],detail:JSON.stringify({fictional:true,records:Object.keys(meta).length})}});
 });
 console.log('Administrator and 12 clearly labeled fictional domain records initialized.');
}
main().catch(()=>{console.error('Initialization failed. Check configuration and migration state.');process.exitCode=1;}).finally(()=>db.$disconnect());
