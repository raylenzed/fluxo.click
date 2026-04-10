/**
 * Cloudflare Pages Function — root path handler
 *
 * Browsers visiting https://fluxo.click  → serve landing page (index.html)
 * curl / wget hitting https://fluxo.click → serve install script (install.sh)
 * curl / wget hitting https://fluxo.click/cn → serve install script with CN proxies pre-set
 *
 * This lets `curl -fsSL https://fluxo.click | bash` work without any
 * path suffix while the landing page stays at the same URL for human visitors.
 */
export async function onRequest(context) {
  const ua = context.request.headers.get('User-Agent') || '';
  const isCli = /^(curl|wget|HTTPie|python-requests|libwww-perl)/i.test(ua);
  const pathname = new URL(context.request.url).pathname;
  const isCn = pathname === '/cn' || pathname === '/cn/';

  // Browser visiting /cn — redirect to landing page
  if (isCn && !isCli) {
    return Response.redirect(new URL('/', context.request.url).toString(), 302);
  }

  if (isCli) {
    // Fetch install.sh
    const url = new URL(context.request.url);
    url.pathname = '/install.sh';
    const resp = await fetch(url.toString(), { cf: { cacheTtl: 300 } });
    let script = await resp.text();

    // For /cn requests, inject default CN proxies right after `set -euo pipefail`
    if (isCn) {
      script = script.replace(
        'set -euo pipefail',
        'set -euo pipefail\n\n# CN defaults — auto-injected by https://fluxo.click/cn\nGH_PROXY="${GH_PROXY:-https://gh-proxy.com/}"\nNPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"'
      );
    }

    return new Response(script, {
      status: resp.status,
      headers: {
        'Content-Type': 'text/x-shellscript; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Regular browser — let Pages serve index.html as normal
  return context.next();
}
