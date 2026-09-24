import {searchPlan,searchJobs,type SearchFeed} from './jsearch';
import {neon} from '@neondatabase/serverless';
import {defaults,type Preferences,type Job,salaryInfo} from './matching';
export function runtime(){return process.env;}
export async function db(){const url=process.env.DATABASE_URL;if(!url)throw Error('Database is not connected. Add DATABASE_URL in Vercel and redeploy.');const sql=neon(url);await sql`CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;return sql;}
export async function read<T>(key:string,fallback:T):Promise<T>{const sql=await db();const rows=await sql`SELECT value FROM records WHERE key=${key}`;return rows[0]?JSON.parse(rows[0].value):fallback;}
export async function write(key:string,value:unknown){const sql=await db();await sql`INSERT INTO records(key,value) VALUES(${key},${JSON.stringify(value)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value`;}
export function authorize(req:Request){if(req.method!=='GET'){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw Error('Invalid request origin');}}
export function failure(e:unknown){const message=e instanceof Error?e.message:'Request failed.';const safe=/^(Unauthorized|Invalid |Enter |Maximum |Email |Database is not connected|Add your|Job not found|Job sources|JSearch |Unknown action|A job source)/.test(message)?message:'Request failed. Check your database and email configuration in Vercel.';return Response.json({error:safe},{status:message==='Unauthorized'?401:message==='Invalid request origin'?403:400});}
export async function prefs(){return read<Preferences>('preferences',defaults);}
export function emailStatus(){return {senderReady:!!(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),schedulerReady:!!(process.env.CRON_SECRET&&process.env.CRON_SECRET.length>=16&&process.env.VERCEL_ENV==='production')};}
export async function fetchJobs(){
 const p=await prefs();
 const plan=searchPlan(p,process.env);
 const cached=await read<SearchFeed|null>('feed',null);
 if(cached?.searchKey===plan.searchKey&&Date.now()-Date.parse(cached.updated)<6*3600000)return cached;
 const result=await searchJobs(p,process.env);
 await write('feed',result);
 return result;
}
