import {authorize,failure,fetchJobs} from '@/lib/server';
export async function GET(req:Request){try{authorize(req);return Response.json(await fetchJobs(),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
