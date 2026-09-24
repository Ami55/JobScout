export const maxDuration=60;
export const dynamic='force-dynamic';
import {authorize,failure,fetchJobs} from '@/lib/server';
export async function GET(req:Request){try{authorize(req);const {searchKey,...feed}=await fetchJobs();return Response.json(feed,{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
