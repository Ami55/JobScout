export const maxDuration=60;
export const dynamic='force-dynamic';
import {authorize,failure} from '@/lib/server';
import {digestPreview,sendDigest} from '@/lib/digest';
export async function GET(req:Request){try{authorize(req);const p=await digestPreview();return Response.json({jobs:p.jobs.slice(0,50),warnings:p.warnings})}catch(e){return failure(e)}}
export async function POST(req:Request){try{authorize(req);return Response.json(await sendDigest(true))}catch(e){return failure(e)}}
