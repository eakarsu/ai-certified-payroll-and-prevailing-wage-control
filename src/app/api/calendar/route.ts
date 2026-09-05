import { authorize } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/record-store';
import { RequestError } from '@/lib/record-policy';
export async function GET(request:Request){try{await authorize();const value=new URL(request.url).searchParams.get('month')||new Date().toISOString().slice(0,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))throw new RequestError('Invalid calendar month');const start=new Date(`${value}-01T00:00:00Z`),end=new Date(start);end.setUTCMonth(end.getUTCMonth()+1);const where={dueAt:{gte:start,lt:end}};const[tasks,total]=await prisma.$transaction([prisma.operationalTask.findMany({where,orderBy:{dueAt:'asc'},take:1000}),prisma.operationalTask.count({where})]);return Response.json({tasks,total,month:value,limit:1000});}catch(e){return errorResponse(e);}}
