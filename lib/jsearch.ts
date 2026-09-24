import {createHash} from 'node:crypto';
import {salaryInfo,type Preferences,type Job} from './matching.ts';

type Env = Record<string,string|undefined>;
type Listing = Record<string,unknown>;
export type SearchFeed = {jobs:Job[];updated:string;warnings:string[];sourceLabel:string;searchKey:string};
const clean=(s:unknown)=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
function safeUrl(value:unknown){try{const u=new URL(String(value));return u.protocol==='https:'?u.href:''}catch{return ''}}
function amount(value:unknown){return typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;}

export function searchPlan(p:Preferences,env:Env){
 const key=env.JSEARCH_API_KEY?.trim();
 if(!key)throw Error('JSearch is not connected. Add JSEARCH_API_KEY in Vercel and redeploy.');
 const provider=env.JSEARCH_PROVIDER?.trim().toLowerCase()||'openwebninja';
 if(!['openwebninja','rapidapi'].includes(provider))throw Error('JSearch provider must be openwebninja or rapidapi.');
 const country=(env.JSEARCH_COUNTRY||'ca').trim().toLowerCase();
 if(!/^[a-z]{2}$/.test(country))throw Error('JSearch country must be a two-letter country code, such as ca.');
 const titles=[...new Set(p.titles.split(',').map(t=>t.trim()).filter(Boolean))];
 if(!titles.length)throw Error('Enter at least one job title before searching.');
 if(titles.length>5)throw Error('Enter up to five job titles, separated by commas.');
 const location=p.location.trim()||(country==='ca'?'Canada':country);
 const date=p.days===1?'today':p.days===3?'3days':p.days===7?'week':'month';
 const endpoint=provider==='rapidapi'?'https://jsearch.p.rapidapi.com/search-v2':'https://api.openwebninja.com/jsearch/search-v2';
 const headers:Record<string,string>=provider==='rapidapi'?{'x-rapidapi-key':key,'x-rapidapi-host':'jsearch.p.rapidapi.com'}:{'x-api-key':key};
 const urls=titles.map(title=>{const u=new URL(endpoint);u.search=new URLSearchParams({query:`${title} jobs in ${location}`,country,language:'en',date_posted:date,...(p.remoteOnly?{work_from_home:'true'}:{})}).toString();return u.href;});
 // Credentials influence the cache without ever being returned to the browser.
 const searchKey=createHash('sha256').update(JSON.stringify({version:2,urls,key})).digest('hex');
 return {urls,headers,searchKey,sourceLabel:`JSearch · ${country.toUpperCase()} · Google for Jobs and public listings`};
}

export function normalizeJob(j:Listing):Job|null{
 const url=safeUrl(j.job_apply_link)||safeUrl(j.job_google_link);
 const title=clean(j.job_title);
 if(!url||!title)return null;
 const country=clean(j.job_country).toUpperCase();
 const countryName=({CA:'Canada',US:'United States',GB:'United Kingdom'} as Record<string,string>)[country]||country;
 const location=[...new Set([clean(j.job_location),clean(j.job_city),clean(j.job_state),countryName].filter(Boolean))].join(', ');
 const salary=clean(j.job_salary_string||j.job_salary);
 const parsed=salaryInfo(salary);
 const currency=clean(j.job_salary_currency).toUpperCase()||parsed.currency;
 const period=({YEAR:'year',HOUR:'hour'} as Record<string,string>)[clean(j.job_salary_period).toUpperCase()]||parsed.period;
 const salaryMin=amount(j.job_min_salary)??parsed.salaryMin;
 const salaryMax=amount(j.job_max_salary)??parsed.salaryMax??salaryMin;
 const timestamp=typeof j.job_posted_at_timestamp==='number'?j.job_posted_at_timestamp*1000:NaN;
 const date=Date.parse(String(j.job_posted_at_datetime_utc||''));
 const published=Number.isFinite(date)?new Date(date).toISOString():Number.isFinite(timestamp)?new Date(timestamp).toISOString():'';
 return {id:'jsearch-'+(clean(j.job_id||j.job_uid)||createHash('sha256').update(url).digest('hex')),title,company:clean(j.employer_name)||'Company not specified',location,country,remote:j.job_is_remote===true,salary:salary||(salaryMin!==null?`${currency||''} ${salaryMin.toLocaleString('en-CA')}${salaryMax!==null&&salaryMax!==salaryMin?'–'+salaryMax.toLocaleString('en-CA'):''}${period?' / '+period:''}`.trim():''),currency,period,salaryMin,salaryMax,published,url,source:clean(j.job_publisher)?clean(j.job_publisher)+' via JSearch':'JSearch',description:clean(j.job_description).slice(0,2200),type:clean(j.job_employment_type)||'Not specified'};
}

function providerError(status:number){
 if(status===401||status===403)return 'JSearch rejected the API key or subscription. Check your key, provider setting and JSearch access in your provider dashboard, then redeploy.';
 if(status===429)return 'JSearch request limit reached. Check your provider quota and try again when it resets.';
 return `JSearch request failed (HTTP ${status}). Check your provider dashboard and try again.`;
}
export async function searchJobs(p:Preferences,env:Env,fetcher:typeof fetch=fetch):Promise<SearchFeed>{
 const plan=searchPlan(p,env);
 const groups=await Promise.all(plan.urls.map(async url=>{
  let response:Response;
  try{response=await fetcher(url,{headers:plan.headers,cache:'no-store',signal:AbortSignal.timeout(20000)});}catch{throw Error('JSearch could not be reached. Please try again shortly.');}
  if(!response.ok)throw Error(providerError(response.status));
  let body:{status?:string;data?:unknown};
  try{body=await response.json();}catch{throw Error('JSearch returned an unreadable response. Please try again.');}
  if((body.status&&body.status!=='OK')||!Array.isArray(body.data))throw Error('JSearch returned an unsuccessful response. Check JSearch access and quota in your provider dashboard.');
  return body.data.filter((j):j is Listing=>!!j&&typeof j==='object').map(normalizeJob).filter((j):j is Job=>j!==null);
 }));
 const seen=new Set<string>();
 const jobs=groups.flat().filter(j=>{const key=(j.company+'|'+j.title+'|'+j.location).toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>(Date.parse(b.published)||0)-(Date.parse(a.published)||0));
 const warnings=jobs.some(j=>!j.published)?['Some listings have no posting date and are excluded by your date filter.']:[];
 return {jobs,updated:new Date().toISOString(),warnings,sourceLabel:plan.sourceLabel,searchKey:plan.searchKey};
}
