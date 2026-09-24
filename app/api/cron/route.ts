import {secretMatches} from '@/lib/auth';
import {sendDigest} from '@/lib/digest';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(req:Request){const secret=process.env.CRON_SECRET;if(!secret||secret.length<16||!secretMatches(req.headers.get('authorization')??'','Bearer '+secret))return Response.json({error:'Unauthorized'},{status:401});try{return Response.json(await sendDigest(false))}catch{console.error('Daily digest failed. Check database, feed and sender configuration.');return Response.json({error:'Digest failed. Check configuration and retry from the app.'},{status:500})}}
