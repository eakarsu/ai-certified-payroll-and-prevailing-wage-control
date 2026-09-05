import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localLoginAllowed } from '../src/lib/local-login';
const env = { LOCAL_LOGIN_HELPER: 'true', HOST: '127.0.0.1', NEXTAUTH_URL: 'http://localhost:5700', PORT: '5700' };
function request(host = 'localhost:5700', origin = `http://${host}`, method = 'POST') {
  return new Request(`http://${host}/api/local-login`, { method, headers: { host, origin, 'content-type': 'application/json', 'x-local-login': 'fill', 'sec-fetch-site': 'same-origin' } });
}
test('explicitly enabled loopback credential filling accepts same-origin requests', () => {
  assert(localLoginAllowed(request(), env));
  assert(localLoginAllowed(request('127.0.0.1:5700'), env));
});
test('helper is unavailable on public bindings, disabled flags or public origins', () => {
  for (const change of [{LOCAL_LOGIN_HELPER:'false'}, {HOST:'0.0.0.0'}, {NEXTAUTH_URL:'https://app.example.com'}, {PORT:'5701'}]) assert(!localLoginAllowed(request(), {...env,...change}));
  assert(!localLoginAllowed(request('app.example.com:5700'), env));
  assert(!localLoginAllowed(request('localhost:5700','https://evil.example'), env));
});
test('cross-site and headerless credential requests are rejected', () => {
  const r=request();r.headers.set('sec-fetch-site','cross-site');assert(!localLoginAllowed(r,env));
  const noIntent=request();noIntent.headers.delete('x-local-login');assert(!localLoginAllowed(noIntent,env));
  assert(!localLoginAllowed(new Request('http://localhost:5700/api/local-login',{method:'POST'}),env));
});
