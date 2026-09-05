import { authorize } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { readJson } from '@/lib/request-body';
import { errorResponse,jsonValue } from '@/lib/record-store';
import { objectBody,RequestError } from '@/lib/record-policy';
import { providerSettings,validateOptions,validateModel } from '@/lib/openrouter';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await authorize();const settings=await providerSettings();return Response.json({...settings,configured:Boolean(process.env.OPENROUTER_API_KEY),canEdit:user.role==='ADMIN',timeoutMs:Number(process.env.OPENROUTER_TIMEOUT_MS||60000),hourlyLimit:20});}catch(e){return errorResponse(e);}}
export async function PUT(request:Request){try{const user=await authorize('admin'),body=objectBody(await readJson(request));let value;try{value={model:validateModel(body.model),parameters:validateOptions(body.parameters)};}catch(e){throw new RequestError(e instanceof Error?e.message:'Invalid settings');}await prisma.$transaction(async tx=>{await tx.appSetting.upsert({where:{id:'openrouter'},create:{id:'openrouter',value:jsonValue(value)},update:{value:jsonValue(value)}});await tx.auditLog.create({data:{actorId:user.id,actorName:user.name,action:'AI_SETTINGS_CHANGED',entity:'AppSetting',entityId:'openrouter',detail:JSON.stringify({model:value.model,parameterNames:Object.keys(value.parameters)})}});});return Response.json({saved:true});}catch(e){return errorResponse(e);}}
