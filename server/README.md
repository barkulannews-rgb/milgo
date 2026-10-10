# DK Perfume server (PHP + MySQL)

The site is a static React app plus a small PHP API in `public/api/`, which the build copies to
`dist/api/`. On Hostinger both are served from `public_html`; data lives in MySQL.

## Hostinger setup (once)

1. **Website + Git**: hPanel → Websites → dkperfume.com → Advanced → **Git**, repository
   `barkulannews-rgb/milgo`, branch **`hostinger`** (built by `.github/workflows/deploy-hostinger.yml`),
   install path `public_html` (empty folder). Turn on auto-deployment.
   Use the regular website, not a Node.js "web app": PHP must run.
2. **SSL**: Security → SSL → install.
3. **Database**: Databases → MySQL → create database + user.
4. **Config**: copy `server/dkperfume-config.example.php` to the folder **above** `public_html`
   (e.g. `domains/dkperfume.com/dkperfume-config.php`) and fill in the database details.
5. **Install**: open `https://dkperfume.com/api/install.php`, create the owner account, then
   sign in at `https://dkperfume.com/admin` (the storefront has no staff link).
   It loads the starting catalogue from `public/api/seed.json` and refuses to run again.

## Photos

Photos uploaded in the admin are saved in `dk-uploads/` next to the config file (outside
`public_html`, so deploys never delete them) and served at `/api/?a=img&f=...`. Include that folder
in your backups together with the database.

## Payments

Add keys to the config file (never to git):

- **Stripe** (cards, Apple Pay, Google Pay): `stripe_secret_key`, and a webhook to
  `https://dkperfume.com/api/?a=stripe_webhook` for `checkout.session.completed` → `stripe_webhook_secret`.
- **PayPal**: `paypal_client_id`, `paypal_secret`, `paypal_mode`.

Checkout only offers a provider once its keys are present. Orders become "Paid" only after Stripe's
signed webhook or PayPal's capture confirms the money.

## Local development

```
php -S 127.0.0.1:8080 -t public          # with DK_CONFIG=/path/to/a/config.php (SQLite works: db_driver => 'sqlite')
npm run dev                              # Vite proxies /api to the PHP server
```

Without the PHP server the app falls back to a browser-only demo (localStorage).
