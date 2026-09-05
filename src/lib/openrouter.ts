import { prisma } from './prisma';
export interface OpenRouterMessage { role: 'system'|'user'|'assistant'; content:string }
export const DEFAULT_OPENROUTER_MODEL=process.env.OPENROUTER_MODEL||'openai/gpt-4o-mini';
export const OPENROUTER_MODELS=[{id:DEFAULT_OPENROUTER_MODEL,label:DEFAULT_OPENROUTER_MODEL}];
const numeric:Record<string,[number,number,boolean?]>={temperature:[0,2],top_p:[0,1],top_k:[0,100000,true],min_p:[0,1],top_a:[0,1],frequency_penalty:[-2,2],presence_penalty:[-2,2],repetition_penalty:[0,10],seed:[0,2147483647,true],max_tokens:[128,32768,true],max_completion_tokens:[128,32768,true],top_logprobs:[0,20,true]};
const structured=new Set(['provider','reasoning','logit_bias','stop','models','plugins','metadata']);
const strings=new Set(['reasoning_effort','route','service_tier','user','session_id']);
const booleans=new Set(['logprobs']);
export function validateOptions(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(value).length>20000)throw new Error('Invalid OpenRouter parameters object');
 const out:Record<string,unknown>={};
 for(const [k,v]of Object.entries(value)){
  if(numeric[k]){const [min,max,whole]=numeric[k];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(whole&&!Number.isInteger(v)))throw new Error(`Invalid OpenRouter parameter: ${k}`);}
  else if(strings.has(k)){if(typeof v!=='string'||!v.trim()||v.length>256)throw new Error(`Invalid OpenRouter parameter: ${k}`);}
  else if(booleans.has(k)){if(typeof v!=='boolean')throw new Error(`Invalid OpenRouter parameter: ${k}`);}
  else if(structured.has(k)){if(k==='stop'||k==='models'){if(!Array.isArray(v)||v.length>8||!v.every(x=>typeof x==='string'&&x.length>0&&x.length<256))throw new Error(`Invalid OpenRouter parameter: ${k}`);}else if(!v||typeof v!=='object'||(k!=='plugins'&&Array.isArray(v)))throw new Error(`Invalid OpenRouter parameter: ${k}`);}
  else throw new Error(`Unsupported draft parameter: ${k}`);
  out[k]=v;
 }
 return out;
}
function envOptions(){const out:Record<string,unknown>={temperature:0.2,max_tokens:4000};for(const name of Object.keys(numeric)){const v=process.env[`OPENROUTER_${name.toUpperCase()}`];if(v?.trim())out[name]=Number(v);}for(const name of [...structured,...strings,...booleans]){const v=process.env[`OPENROUTER_${name.toUpperCase()}${structured.has(name)?'_JSON':''}`];if(v?.trim())out[name]=structured.has(name)||booleans.has(name)?JSON.parse(v):v;}const extra=process.env.OPENROUTER_EXTRA_PARAMETERS_JSON;if(extra)Object.assign(out,JSON.parse(extra));return validateOptions(out);}
export async function providerSettings(){
 const stored=await prisma.appSetting.findUnique({where:{id:'openrouter'}});const v=(stored?.value??{})as{model?:string;parameters?:Record<string,unknown>};
 return{model:v.model||DEFAULT_OPENROUTER_MODEL,parameters:validateOptions({...envOptions(),...v.parameters})};
}
export function validateModel(model:unknown):string {if(typeof model!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_./:+-]{1,199}$/.test(model))throw new Error('Invalid model identifier');const allowed=process.env.OPENROUTER_ALLOWED_MODELS?.split(',').map(s=>s.trim()).filter(Boolean);if(allowed?.length&&!allowed.includes(model))throw new Error('Model is outside OPENROUTER_ALLOWED_MODELS');return model;}
export async function callOpenRouter(messages:OpenRouterMessage[],opts?:{model?:string;parameters?:Record<string,unknown>}){
 const key=process.env.OPENROUTER_API_KEY;if(!key)throw new Error('AI_UNAVAILABLE');
 const base=(process.env.OPENROUTER_BASE_URL||'https://openrouter.ai/api/v1').replace(/\/+$/,'');if(base!=='https://openrouter.ai/api/v1')throw new Error('INVALID_PROVIDER_URL');
 const saved=await providerSettings(),model=validateModel(opts?.model||saved.model),parameters=validateOptions({...saved.parameters,...opts?.parameters});
 const timeout=Number(process.env.OPENROUTER_TIMEOUT_MS||60000);if(!Number.isInteger(timeout)||timeout<1000||timeout>180000)throw new Error('Invalid provider timeout');
 const headers:Record<string,string>={'Content-Type':'application/json',Authorization:`Bearer ${key}`};if(process.env.OPENROUTER_HTTP_REFERER)headers['HTTP-Referer']=process.env.OPENROUTER_HTTP_REFERER;if(process.env.OPENROUTER_APP_TITLE)headers['X-OpenRouter-Title']=process.env.OPENROUTER_APP_TITLE;
 const response=await fetch(`${base}/chat/completions`,{method:'POST',headers,body:JSON.stringify({...parameters,model,messages,stream:false,response_format:{type:'json_object'}}),signal:AbortSignal.timeout(timeout)});
 if(!response.ok)throw new Error(`AI_HTTP_${response.status}`);
 const reader=response.body?.getReader();if(!reader)throw new Error('AI_INVALID_RESPONSE');let raw='',size=0;const decoder=new TextDecoder();try{while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2000000){await reader.cancel();throw new Error('AI_RESPONSE_TOO_LARGE');}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}finally{reader.releaseLock();}
 const payload=JSON.parse(raw),choice=payload?.choices?.[0],content=choice?.message?.content;if(payload.error||typeof content!=='string'||!content.trim()||choice?.message?.refusal||!['stop','tool_calls'].includes(choice?.finish_reason)||choice?.message?.tool_calls)throw new Error('AI_INVALID_RESPONSE');
 return{content,model:typeof payload.model==='string'?payload.model:model,receipt:typeof payload.id==='string'?payload.id:null,usage:payload.usage??null};
}
