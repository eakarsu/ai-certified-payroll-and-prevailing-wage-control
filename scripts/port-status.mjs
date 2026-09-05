import net from 'node:net';

export async function inspectPort({host, port, service}) {
  const occupied = await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', error => error.code === 'EADDRINUSE' ? resolve(true) : reject(error));
    probe.listen({host, port, exclusive: true}, () => probe.close(error => error ? reject(error) : resolve(false)));
  });
  const address = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '::1' : host;
  const url = `http://${address.includes(':') ? `[${address}]` : address}:${port}`;
  if (!occupied) return {state: 'available', url};
  try {
    const response = await fetch(`${url}/api/health`, {signal: AbortSignal.timeout(2500), redirect: 'error'});
    const health = await response.json();
    if (health.service === service) return {state: response.ok && health.status === 'ok' && health.database === 'ready' ? 'running' : 'unhealthy', url};
  } catch { /* An occupied port without this app's health response is a conflict. */ }
  return {state: 'conflict', url};
}
