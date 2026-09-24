import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticated,secretMatches} from '../lib/auth.ts';
test('authentication fails closed without a strong password',()=>{delete process.env.APP_PASSWORD;assert.equal(authenticated(new Request('https://example.com')),false);process.env.APP_PASSWORD='short';assert.equal(authenticated(new Request('https://example.com')),false)});
test('only correct owner credentials accepted; identity headers are untrusted',()=>{process.env.APP_PASSWORD='test-password-long-enough';const req=(pass)=>new Request('https://example.com',{headers:{authorization:'Basic '+Buffer.from('ami:'+pass).toString('base64')}});assert.equal(authenticated(req('test-password-long-enough')),true);assert.equal(authenticated(req('wrong')),false);assert.equal(authenticated(new Request('https://example.com',{headers:{'oai-authenticated-user-id':'forged'}})),false);delete process.env.APP_PASSWORD;});
test('secret comparisons require an exact match',()=>{assert.equal(secretMatches('Bearer abc','Bearer abc'),true);assert.equal(secretMatches('Bearer ab','Bearer abc'),false)});
