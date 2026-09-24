import {NextResponse,type NextRequest} from 'next/server';
import {authenticated} from './lib/auth';
export function proxy(req:NextRequest){if(req.nextUrl.pathname==='/api/cron')return NextResponse.next();if(!process.env.APP_PASSWORD||process.env.APP_PASSWORD.length<16)return new NextResponse('Setup required: configure APP_PASSWORD with at least 16 characters in Vercel, then redeploy.',{status:503});if(!authenticated(req))return new NextResponse('Sign in with username ami and your APP_PASSWORD.',{status:401,headers:{'WWW-Authenticate':'Basic realm="JobScout", charset="UTF-8"','Cache-Control':'no-store'}});return NextResponse.next();}
export const config={matcher:['/((?!_next/static|_next/image|favicon.svg).*)']};
