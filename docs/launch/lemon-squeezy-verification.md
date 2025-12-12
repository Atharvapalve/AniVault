# Lemon Squeezy verification checklist

Live site URL: https://anivault.app (update if a different production domain is used)
Vercel project: anivault-website (set in Vercel dashboard)

## What to provide to Lemon Squeezy support
- [ ] Public pricing page with hosted checkout links (sandbox for testing) is reachable without auth
- [ ] Live domain with HTTPS enabled
- [ ] Privacy Policy, Terms of Use, and Refund Policy pages linked in footer
- [ ] Working checkout link with `data-product-id` visible in markup
- [ ] Contact email shown (support@anivault.app)
- [ ] Screenshots of checkout + receipt (sandbox) saved in `apps/website/public/press-kit/`

## Test purchase steps (sandbox)
1) Set `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL_SANDBOX` to the sandbox product link.
2) Deploy to Vercel (project root: `apps/website`).
3) Open `https://anivault.app/pricing` → click **Test Checkout (Sandbox)**.
4) Complete purchase with test card, copy license key from the receipt.
5) Open AniVault desktop → Settings → License → paste key → confirm activation.
6) Save receipt/screenshot for the verification email.

## Switching from sandbox to production
- In Vercel env vars, set `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL_PROD` to the live product link.
- Remove or leave sandbox var empty once live.
- Redeploy; pricing buttons will automatically use the production URL when present.

## Optional webhook endpoint (server-side)
- Recommended: create a server endpoint (e.g., `/api/lemon/webhook`) on your backend, not on the client site.
- Verify signatures using Lemon Squeezy signing secret.
- On `order_created` or `subscription_created`, provision license and email receipt if needed.

## Example license verification request (server-side)
Use a backend-only token; do **not** expose to the client.

```
GET https://api.lemonsqueezy.com/v1/licenses/verify
Headers:
  Authorization: Bearer <LEMON_SQUEEZY_API_KEY>
Body:
  { "license_key": "<key-from-receipt>" }
```

## Prelaunch QA
- [ ] Homepage hero CTA visible on mobile without scrolling
- [ ] Pricing buttons open Lemon Squeezy checkout in new tab
- [ ] Download and Chrome extension links work
- [ ] Meta tags validated (OG/Twitter/JSON-LD) via curl/SEO tool
- [ ] Lighthouse target: Perf ≥50, Accessibility ≥90, Best Practices ≥90, SEO ≥90
- [ ] Axe scan on homepage has no critical issues

## Domain & HTTPS
- Point domain (e.g., `anivault.app`) to Vercel via CNAME/ALIAS
- Confirm HTTPS certificate issued in Vercel dashboard
- Add preview deployments for PRs (GitHub integration)
