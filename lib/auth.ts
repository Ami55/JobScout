import {createHash,timingSafeEqual} from 'node:crypto';
export function secretMatches(actual:string,expected:string){return timingSafeEqual(createHash('sha256').update(actual).digest(),createHash('sha256').update(expected).digest());}
