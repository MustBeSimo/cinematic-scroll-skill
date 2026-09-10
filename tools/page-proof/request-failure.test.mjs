import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyRequestFailure as classify} from './request-failure.mjs';
test('only deliberate script blocking in no-JS mode is advisory',()=>{
  assert.equal(classify({javaScriptEnabled:false,resourceType:'script',errorText:'csp'}),'disabled-script');
  for(const item of [
    {javaScriptEnabled:true,resourceType:'script',errorText:'csp'},
    {javaScriptEnabled:false,resourceType:'stylesheet',errorText:'csp'},
    {javaScriptEnabled:false,resourceType:'script',errorText:'net::ERR_CONNECTION_REFUSED'},
    {javaScriptEnabled:false,resourceType:'image',errorText:'net::ERR_FAILED'},
  ]) assert.equal(classify(item),'request');
});
