import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,matches,salaryInfo,validatePreferences} from '../lib/matching.ts';
const now=Date.parse('2026-09-15T18:00:00Z');
const job={id:'test',title:'Senior SEO Strategist',company:'Example',location:'Canada',remote:true,salary:'CAD 80,000–100,000 annually',...salaryInfo('CAD 80,000–100,000 annually'),published:'2026-09-15T01:00:00Z',url:'https://example.com',source:'Test',description:'',type:'Full time'};
test('matches title alternatives, date, location and salary overlap',()=>assert.equal(matches(job,{...defaults,titles:'Designer, SEO',location:'Canada',minSalary:90000,maxSalary:110000,unknownSalary:false},now),true));
test('does not compare different currencies',()=>assert.equal(matches({...job,currency:'USD'},{...defaults,minSalary:50000},now),false));
test('does not compare hourly and annual pay',()=>assert.equal(matches({...job,period:'hour'},{...defaults,minSalary:50000},now),false));
test('unknown salary respects user choice',()=>{const j={...job,salary:'',...salaryInfo('')};assert.equal(matches(j,{...defaults,minSalary:50000,unknownSalary:false},now),false);assert.equal(matches(j,{...defaults,minSalary:50000,unknownSalary:true},now),true)});
test('bare dollar symbol is not assumed to mean USD',()=>assert.equal(salaryInfo('$80k - $100k').currency,null));
test('old jobs and ineligible locations excluded',()=>{assert.equal(matches({...job,published:'2026-08-01T01:00:00Z'},defaults,now),false);assert.equal(matches({...job,location:'Germany'},{...defaults,location:'Canada'},now),false)});
test('worldwide remote roles can match Canada',()=>assert.equal(matches({...job,location:'Worldwide'},{...defaults,location:'Canada'},now),true));
test('salary range and timezone validation',()=>{assert.throws(()=>validatePreferences({...defaults,minSalary:90000,maxSalary:50000}));assert.throws(()=>validatePreferences({...defaults,timezone:'Invalid/Zone'}));assert.throws(()=>validatePreferences({...defaults,enabled:true,email:''}))});

test('SEO also matches its expanded title',()=>assert.equal(matches({...job,title:'Search Engine Optimization Specialist'}, {...defaults,titles:'SEO'},now),true));
