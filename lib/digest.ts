import {db,read,write,prefs,fetchJobs,runtime} from './server';
import {matches,type Job} from './matching';
function esc(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export async function digestPreview(){const p=await prefs();const feed=await fetchJobs();const sent=await read<string[]>('sentJobs',[]);return {p,jobs:feed.jobs.filter(j=>matches(j,p)&&!sent.includes(j.id)),warnings:feed.warnings};}
type Delivery={status:string;lease:number;ids:string[];payload:{from:string;to:string[];subject:string;html:string}};
export async function sendDigest(force=false){
 const r=runtime(),p=await prefs();
 if(!force&&!p.enabled)return {skipped:'Daily digest is paused'};
 if(!r.RESEND_API_KEY||!r.EMAIL_FROM)throw Error('Email sender is not connected.');
 if(!p.email)throw Error('Add your recipient email in Daily digest.');
 const day=new Date().toISOString().slice(0,10),key='digest-'+day,sql=await db();
 let delivery=await read<Delivery|null>(key,null);
 if(!delivery){
  const {jobs}=await digestPreview();
  if(!jobs.length){await write('lastDigest',{at:new Date().toISOString(),count:0,status:'No new matches'});return {skipped:'No new matches to email'};}
  const chosen=jobs.slice(0,50);
  const html='<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#151b2c"><h1 style="color:#5237ff">Your JobScout shortlist</h1><p>'+chosen.length+' new matches for your next chapter.</p>'+chosen.map((j:Job)=>'<div style="border-bottom:1px solid #dfe4ef;padding:20px 0"><h2 style="font-size:20px">'+esc(j.title)+'</h2><p>'+esc(j.company)+' · '+esc(j.location)+'</p><p>'+esc(j.salary||'Salary not disclosed')+'</p><a href="'+esc(j.url)+'">View job on '+esc(j.source)+'</a></div>').join('')+'<p>Listings retrieved via JSearch; coverage varies by publisher. Check eligibility and salary on the original listing. Pause emails in JobScout’s Daily digest settings.</p></div>';
  delivery={status:'pending',lease:0,ids:chosen.map(j=>j.id),payload:{from:r.EMAIL_FROM,to:[p.email],subject:'JobScout: '+chosen.length+' new job matches',html}};
  await sql`INSERT INTO records(key,value) VALUES(${key},${JSON.stringify(delivery)}) ON CONFLICT(key) DO NOTHING`;
 }
 // Atomically claim an expired lease; the original email body survives retries.
 const claimed=await sql`UPDATE records SET value=jsonb_set(value::jsonb,'{lease}',to_jsonb(${Date.now()+600000}::bigint))::text WHERE key=${key} AND value::jsonb->>'status' <> 'sent' AND (value::jsonb->>'lease')::bigint < ${Date.now()} RETURNING value`;
 if(!claimed.length)return {skipped:'Today’s digest is already sent or in progress'};
 delivery=JSON.parse(claimed[0].value) as Delivery;
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+r.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'jobscout-'+day},body:JSON.stringify(delivery.payload),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Email provider rejected delivery ('+response.status+'). Check sender configuration.');
  const sent=await read<string[]>('sentJobs',[]),stamp={at:new Date().toISOString(),count:delivery.ids.length,status:'Sent'};
  await sql.transaction([
   sql`INSERT INTO records(key,value) VALUES('sentJobs',${JSON.stringify([...new Set([...sent,...delivery.ids])])}) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
   sql`UPDATE records SET value=${JSON.stringify({...delivery,status:'sent',lease:0})} WHERE key=${key}`,
   sql`INSERT INTO records(key,value) VALUES('lastDigest',${JSON.stringify(stamp)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  ]);
  return {sent:delivery.ids.length};
 }catch(e){await sql`UPDATE records SET value=jsonb_set(value::jsonb,'{lease}','0'::jsonb)::text WHERE key=${key}`;throw e;}
}
