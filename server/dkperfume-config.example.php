<?php
// DK Perfume server settings.
//
// On Hostinger: copy this file to the folder ABOVE public_html (for example
// /home/u123456789/domains/dkperfume.com/dkperfume-config.php), rename it to
// dkperfume-config.php and fill in your values. It must never be inside public_html or in git.

return [
    // hPanel -> Databases -> MySQL Databases
    'db_driver' => 'mysql',
    'db_host' => 'localhost',
    'db_name' => 'u123456789_dkperfume',
    'db_user' => 'u123456789_dkperfume',
    'db_pass' => 'PASTE-YOUR-DATABASE-PASSWORD',

    'site_url' => 'https://dkperfume.com',

    // Sender for staff emails (password reset). Default: the store email if it is @dkperfume.com.
    // 'mail_from' => 'info@dkperfume.com',

    // Uploaded photos are kept here (created automatically). Default: dk-uploads next to this file.
    // 'uploads_dir' => '/home/u123456789/domains/dkperfume.com/dk-uploads',

    // Optional: the owner can instead enter these in Admin -> Payments (that value wins when both exist).
    // Stripe (cards, Apple Pay, Google Pay): dashboard.stripe.com -> Developers -> API keys / Webhooks.
    // Leave empty until your Stripe account is ready; card payments stay hidden until then.
    'stripe_secret_key' => '',      // sk_live_... (or sk_test_... for testing)
    'stripe_webhook_secret' => '',  // whsec_...  (webhook URL: https://dkperfume.com/api/?a=stripe_webhook, event: checkout.session.completed)

    // PayPal: developer.paypal.com -> Apps & Credentials -> your app
    'paypal_client_id' => '',
    'paypal_secret' => '',
    'paypal_mode' => 'live',        // 'sandbox' while testing
];
