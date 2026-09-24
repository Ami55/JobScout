import test from 'node:test';
import assert from 'node:assert/strict';
import {secretMatches} from '../lib/auth.ts';
test('cron secret comparison requires an exact match',()=>{assert.equal(secretMatches('Bearer abc','Bearer abc'),true);assert.equal(secretMatches('Bearer ab','Bearer abc'),false)});
