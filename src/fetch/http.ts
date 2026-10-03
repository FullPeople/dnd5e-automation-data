import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';

export interface ResponseBody { status: number; etag?: string; body: Buffer }
/** Keep the inherited proxy and TLS trust. No redirects or insecure transports. */
export function request(url: string, etag?: string): Promise<ResponseBody> {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.username || target.password) throw Error('HTTPS without embedded credentials is required');
  const proxyText = process.env.HTTPS_PROXY || process.env.https_proxy;
  const agent = new https.Agent({ keepAlive: false });
  if (proxyText) {
    const proxy = new URL(proxyText);
    if (!['http:', 'https:'].includes(proxy.protocol)) throw Error('Unsupported proxy protocol');
    (agent as any).createConnection = (options: tls.ConnectionOptions, callback: (error: Error | null, socket?: tls.TLSSocket) => void) => {
      const headers: Record<string, string> = { Host: `${target.hostname}:${target.port || 443}` };
      if (proxy.username || proxy.password) headers['Proxy-Authorization'] = `Basic ${Buffer.from(`${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`).toString('base64')}`;
      const connect = (proxy.protocol === 'https:' ? https : http).request({ hostname: proxy.hostname, port: proxy.port || (proxy.protocol === 'https:' ? 443 : 80), method: 'CONNECT', path: headers.Host, headers });
      let settled = false;
      const finish = (error: Error | null, socket?: tls.TLSSocket) => { if (!settled) { settled = true; callback(error, socket); } };
      connect.setTimeout(30000, () => connect.destroy(Error('Proxy CONNECT timed out')));
      connect.on('error', error => finish(error));
      connect.on('connect', (response, socket, head) => {
        if (response.statusCode !== 200) { socket.destroy(); finish(Error(`Proxy CONNECT refused (${response.statusCode})`)); return; }
        if (head.length) socket.unshift(head);
        const secure = tls.connect({ ...options, socket, servername: target.hostname });
        secure.on('error', error => finish(error));
        secure.on('secureConnect', () => finish(null, secure));
      });
      connect.end();
    };
  }
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Encoding': 'identity' };
    if (etag) headers['If-None-Match'] = etag;
    const req = https.get(target, { agent, headers }, response => {
      const chunks: Buffer[] = []; let bytes = 0;
      response.on('data', chunk => { bytes += chunk.length; if (bytes > 32 * 1024 * 1024) req.destroy(Error('Input exceeds 32 MiB')); else chunks.push(chunk); });
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode || 0, etag: typeof response.headers.etag === 'string' ? response.headers.etag : undefined, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(30000, () => req.destroy(Error('HTTPS request timed out')));
    req.on('error', reject);
    req.on('close', () => agent.destroy());
  });
}
