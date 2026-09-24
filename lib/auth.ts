import {createHash,timingSafeEqual} from 'node:crypto';
export function secretMatches(actual:string,expected:string){return timingSafeEqual(createHash('sha256').update(actual).digest(),createHash('sha256').update(expected).digest());}
export function authenticated(req:Request){const password=process.env.APP_PASSWORD;if(!password||password.length<16)return false;return secretMatches(req.headers.get('authorization')??'','Basic '+Buffer.from('ami:'+password).toString('base64'));}
