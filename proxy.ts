import {NextResponse} from 'next/server';
// Public app: no username or password is required.
export function proxy(){return NextResponse.next();}
