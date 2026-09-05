import { authorize } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/record-store';
import { RequestError } from '@/lib/record-policy';
export async function GET(request:Request){try{await authorize();const params=new URL(request.url).searchParams,page=Number(params.get('page')||1),q=(params.get('q')||'').slice(0,200);if(!Number.isInteger(page)||page<1||page>100000)throw new RequestError('Invalid page');const where=q?{OR:['action','entity','actorName','entityId'].map(k=>({[k]:{contains:q,mode:'insensitive' as const}}))}:{};const[items,total]=await prisma.$transaction([prisma.auditLog.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],take:25,skip:(page-1)*25}),prisma.auditLog.count({where})]);return Response.json({items,total,page});}catch(e){return errorResponse(e);}}
