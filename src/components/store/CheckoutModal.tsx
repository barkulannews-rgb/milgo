import React, { useEffect, useMemo, useState } from 'react';
import { X, AlertCircle, CreditCard, Smartphone, Landmark, Banknote, Wallet } from 'lucide-react';
import { CartItem, DeliveryZone, PaymentMethod, Language, StoreSettings, Order } from '../../types';
import { getTranslation } from '../../lib/translations';
import { storeRepo } from '../../lib/storage';
import {
  CARD_BRANDS,
  HQ_COUNTRY,
  SOMALIA,
  browserCountry,
  countryName,
  currencyForCountry,
  detectCardBrand,
  expiryValid,
  formatCardNumber,
  luhnValid,
  sortedCountries,
} from '../../lib/countries';

import { formatMoney, BASE_CURRENCY } from '../../lib/money';
interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  lang: Language;
  settings: StoreSettings;
  deliveryZones: DeliveryZone[];
  appliedCoupon: string | null;
  couponDiscount: number;
  onOrderSuccess: (order: Order) => void;
}

type MethodOption = { id: PaymentMethod; title: string; hint: string; icon: React.FC<{ className?: string }> };

const GATEWAY_FOR: Partial<Record<PaymentMethod, 'Stripe' | 'PayPal' | 'ApplePay' | 'GooglePay'>> = {
  'Credit / Debit Card': 'Stripe',
  PayPal: 'PayPal',
  'Apple Pay': 'ApplePay',
  'Google Pay': 'GooglePay',
};

const inputClass =
  'w-full bg-surface border border-line-strong focus:border-fg p-2.5 text-sm text-fg outline-none transition-colors';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  lang,
  settings,
  appliedCoupon,
  couponDiscount,
  onOrderSuccess,
}) => {
  const so = lang === 'so';
  const payments = storeRepo.getPaymentSettings();
  const markets = storeRepo.getMarketSettings();
  const testMode = payments.mode === 'test';

  const countries = useMemo(
    () => sortedCountries(lang, markets.sellWorldwide ? undefined : markets.allowedCountries),
    [lang, markets.sellWorldwide, markets.allowedCountries]
  );
  // Start from the shopper's own country when we sell there, else head office (UK)
  const defaultCountry =
    [browserCountry(), HQ_COUNTRY].find((c) => c && countries.some((x) => x.code === c)) ?? countries[0]?.code ?? HQ_COUNTRY;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [country, setCountry] = useState(defaultCountry);
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const zones = useMemo(() => storeRepo.getZonesForCountry(country), [country, isOpen]);
  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? zones[0];
  // City zones (e.g. Mogadishu districts) already name the city; country-wide zones need a typed city
  const cityZones = zones.length > 0 && zones.every((z) => z.regionType === 'domestic');
  const isSomalia = country === SOMALIA;

  // Payment options depend on the destination: wallets and cash on delivery only where configured.
  const methods: MethodOption[] = useMemo(() => {
    const list: MethodOption[] = [];
    if (payments.cards.enabled)
      list.push({ id: 'Credit / Debit Card', title: so ? 'Kaarka Bangiga' : 'Credit / Debit Card', hint: 'Visa · Mastercard · Amex', icon: CreditCard });
    if (payments.paypal.enabled) list.push({ id: 'PayPal', title: 'PayPal', hint: so ? 'Akoon ama kaar' : 'Account or card', icon: Wallet });
    if (payments.applePay) list.push({ id: 'Apple Pay', title: 'Apple Pay', hint: 'iPhone · Mac', icon: Smartphone });
    if (payments.googlePay) list.push({ id: 'Google Pay', title: 'Google Pay', hint: 'Android · Chrome', icon: Smartphone });
    if (payments.mobileMoney.enabled && payments.mobileMoney.countries.includes(country))
      payments.mobileMoney.wallets
        .filter((w) => w.enabled)
        .forEach((w) => list.push({ id: w.name, title: w.name, hint: 'Mobile Money', icon: Smartphone }));
    if (payments.bankTransfer.enabled)
      list.push({ id: 'Bank Transfer', title: so ? 'Xawilaad Bangi' : 'Bank Transfer', hint: payments.bankTransfer.bankName || 'IBAN / SWIFT', icon: Landmark });
    if (payments.cashOnDelivery.enabled && payments.cashOnDelivery.countries.includes(country))
      list.push({ id: 'Cash on Delivery', title: so ? 'Lacag Caddaan ah' : 'Cash on Delivery', hint: so ? 'Bixi marka aad hesho' : 'Pay upon receipt', icon: Banknote });
    return list;
  }, [payments, country, so]);

  // Keep zone and method selections valid when the destination changes
  useEffect(() => {
    if (!zones.some((z) => z.id === selectedZoneId)) setSelectedZoneId(zones[0]?.id ?? '');
  }, [zones, selectedZoneId]);
  useEffect(() => {
    if (!methods.some((m) => m.id === paymentMethod)) setPaymentMethod(methods[0]?.id ?? '');
  }, [methods, paymentMethod]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  // Each zone sets its own free-shipping threshold (or none)
  const freeFrom = selectedZone?.freeShippingFrom;
  const freeDelivery = freeFrom != null && subtotal >= freeFrom;
  const deliveryFee = freeDelivery ? 0 : selectedZone?.deliveryFee || 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  const localCurrency = currencyForCountry(country);
  const localRate = markets.currencyRates.find((r) => r.code === localCurrency)?.rate;
  const localTotal =
    localCurrency !== BASE_CURRENCY && localRate
      ? new Intl.NumberFormat(so ? 'so' : 'en', { style: 'currency', currency: localCurrency, maximumFractionDigits: localRate > 100 ? 0 : 2 }).format(grandTotal * localRate)
      : null;

  const isGatewayMethod = paymentMethod !== '' && paymentMethod in GATEWAY_FOR;
  const wallet = payments.mobileMoney.wallets.find((w) => w.name === paymentMethod);
  const cardBrand = detectCardBrand(cardNumber);
  const cvcLength = cardBrand === 'amex' ? 4 : 3;

  const fail = (en: string, som: string) => {
    setErrorMsg(so ? som : en);
    return false;
  };

  const validate = (): boolean => {
    if (!customerName.trim()) return fail('Please enter your full name.', 'Fadlan geli magacaaga oo buuxa.');
    if (customerPhone.replace(/\D/g, '').length < 7)
      return fail('Please enter a valid phone number with country code (e.g. +44 7700 900123).', 'Fadlan geli lambar taleefan oo sax ah (tusaale +252 61XXXXXXX).');
    if ((isGatewayMethod || !isSomalia) && !/^\S+@\S+\.\S+$/.test(customerEmail.trim()))
      return fail('Please enter your email for the payment receipt and shipping updates.', 'Fadlan geli email-kaaga si laguugu soo diro rasiidka iyo warbixinta gaarsiinta.');
    if (!selectedZone)
      return fail(`Sorry, we don't ship to ${countryName(country, lang)} yet.`, `Waan ka xunnahay, weli uma dirno ${countryName(country, lang)}.`);
    if (!cityZones && !city.trim()) return fail('Please enter your city.', 'Fadlan geli magaaladaada.');
    if (!deliveryAddress.trim())
      return fail('Please enter your street address.', 'Fadlan geli cinwaanka gaarsiinta (wadada, dhismaha ama calaamad).');
    if (!paymentMethod) return fail('Please choose a payment method.', 'Fadlan dooro hab lacag-bixin.');
    if (isGatewayMethod && !testMode)
      return fail(
        'Online payments are being connected. Please choose another payment method for now.',
        'Lacag-bixinta online-ka weli lama xirin. Fadlan hadda dooro hab kale.'
      );
    if (paymentMethod === 'Credit / Debit Card') {
      if (!cardName.trim()) return fail('Please enter the name on the card.', 'Fadlan geli magaca kaarka ku qoran.');
      if (!luhnValid(cardNumber)) return fail('That card number is not valid.', 'Lambarka kaarku sax maaha.');
      if (!cardBrand || !payments.cards.brands.includes(cardBrand))
        return fail('This card type is not accepted. Please use another card.', 'Nooca kaarkan lama aqbalo. Fadlan isticmaal kaar kale.');
      if (!expiryValid(cardExpiry)) return fail('Please check the expiry date (MM/YY).', 'Fadlan hubi taariikhda dhicitaanka (MM/YY).');
      if (cardCvc.length !== cvcLength) return fail(`Please enter the ${cvcLength}-digit security code.`, `Fadlan geli koodhka ammaanka (${cvcLength} god).`);
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validate() || !paymentMethod || !selectedZone) return;
    setIsSubmitting(true);

    try {
      // Map items with costPrice for historical accounting
      const orderItems = items.map((item) => {
        const prod = storeRepo.getProductById(item.productId);
        const variant = prod?.variants.find((v) => v.id === item.variantId);
        return {
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          brand: item.brand,
          size: item.size,
          image: item.image,
          unitPrice: item.unitPrice,
          costPrice: variant?.costPrice || 0,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity,
        };
      });

      // Test mode approves gateway payments instantly. Only the card brand and last four digits are
      // kept; the full number and security code never leave this form.
      const gateway = GATEWAY_FOR[paymentMethod];
      const digits = cardNumber.replace(/\D/g, '');
      const gatewayDetails = gateway
        ? {
            gateway,
            transactionId: `test_${gateway.toLowerCase()}_${Date.now().toString(36)}`,
            cardBrand: paymentMethod === 'Credit / Debit Card' ? CARD_BRANDS.find((b) => b.id === cardBrand)?.label : undefined,
            cardLast4: paymentMethod === 'Credit / Debit Card' ? digits.slice(-4) : undefined,
            payerEmail: customerEmail.trim() || undefined,
            captureDate: new Date().toISOString(),
          }
        : undefined;

      const paymentStatus = gateway
        ? 'Paid'
        : paymentMethod === 'Cash on Delivery' || paymentMethod === 'Bank Transfer'
        ? 'Unpaid'
        : paymentReference
        ? 'Paid'
        : 'Unpaid';

      const result = storeRepo.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        country: countryName(country, 'en'),
        city: cityZones ? selectedZone.city : city.trim(),
        postalCode: postalCode.trim() || undefined,
        deliveryArea: selectedZone.zoneName,
        deliveryAddress: deliveryAddress.trim(),
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        shippingMethod: `${selectedZone.zoneName} (${selectedZone.estimatedHours})`,
        items: orderItems,
        subtotal,
        discountAmount: couponDiscount,
        couponCode: appliedCoupon || undefined,
        deliveryFee,
        tax: 0,
        grandTotal,
        currency: BASE_CURRENCY,
        paymentMethod,
        paymentStatus,
        paymentReference: gatewayDetails?.transactionId || paymentReference.trim() || undefined,
        paymentGatewayDetails: gatewayDetails,
        orderStatus: 'Pending',
      });

      if (!result.success || !result.order) {
        setErrorMsg(result.error || 'Failed to place order.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onOrderSuccess(result.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating order.');
      setIsSubmitting(false);
    }
  };

  const sectionTitle = 'font-sans text-[11px] uppercase tracking-[0.16em] text-fg mb-4';
  const label = 'block text-xs text-fg-3 mb-1';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-surface overflow-hidden shadow-2xl text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-line flex items-center justify-between">
          <h2 className="font-serif text-2xl">{getTranslation(lang, 'checkout')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-fg-3 hover:text-fg transition-colors cursor-pointer"
            aria-label="Close Checkout"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer Contact */}
          <div>
            <h3 className={sectionTitle}>1. {getTranslation(lang, 'customerInfo')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>{getTranslation(lang, 'fullName')} *</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Amina Cali Maxamed"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={label}>
                  {getTranslation(lang, 'phoneNumber')} *
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={isSomalia ? '+252 61 555 1234' : country === 'GB' ? '+44 7700 900123' : '+1 555 010 2030'}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>
                  {isGatewayMethod || !isSomalia ? `${so ? 'Email' : 'Email Address'} *` : getTranslation(lang, 'emailAddress')}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shipping */}
          <div>
            <h3 className={sectionTitle}>2. {getTranslation(lang, 'deliveryDestination')}</h3>
            <div className="space-y-4">
              <div>
                <label className={label}>
                                    {so ? 'Dalka' : 'Country'} *
                </label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country" className={inputClass}>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {freeFrom != null && !freeDelivery && selectedZone && (
                <p className="text-xs text-fg-3 -mb-1">
                  {so
                    ? `Gaarsiin bilaash ah ${formatMoney(freeFrom)} ka badan (${formatMoney(freeFrom - subtotal)} ayaa ka dhiman).`
                    : `Free shipping over ${formatMoney(freeFrom)}. You're ${formatMoney(freeFrom - subtotal)} away.`}
                </p>
              )}

              {zones.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  {so
                    ? `Weli uma dirno ${countryName(country, lang)}. Nagala soo xiriir WhatsApp ${settings.whatsappNumber}.`
                    : `We don't ship to ${countryName(country, lang)} yet. Contact us on WhatsApp ${settings.whatsappNumber} for a quote.`}
                </div>
              ) : (
                <div>
                  <label className={label}>
                    {cityZones ? (so ? 'Magaalada & Goobta' : 'City & Area') : so ? 'Habka Dirista' : 'Shipping'}
                  </label>
                  <select value={selectedZone?.id} onChange={(e) => setSelectedZoneId(e.target.value)} className={inputClass}>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {cityZones ? `${z.city} — ${z.zoneName}` : z.zoneName} ({formatMoney(z.deliveryFee)} · {z.estimatedHours})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!cityZones && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className={label}>{so ? 'Magaalada' : 'City'} *</label>
                    <input type="text" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={label}>{so ? 'Koodhka Boostada' : 'Postal / ZIP Code'}</label>
                    <input type="text" autoComplete="postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={`${inputClass} font-mono`} />
                  </div>
                </div>
              )}

              <div>
                <label className={label}>{getTranslation(lang, 'deliveryAddress')} *</label>
                <input
                  type="text"
                  autoComplete="street-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={
                    cityZones
                      ? so ? 'Dabka, ka soo horjeedka Hoteelka, Guri #12' : 'e.g. Maka Al-Mukarama Rd, Opposite Taleex Hotel, Villa #12'
                      : so ? 'Wadada, lambarka guriga, dabaqa' : 'Street, building, apartment / suite'
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={label}>{getTranslation(lang, 'deliveryNotes')}</label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder={so ? 'Fadlan soo wac marka aad soo dhowaato' : 'e.g. Please call upon arrival at the gate'}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`${sectionTitle} mb-0`}>3. {getTranslation(lang, 'paymentMethod')}</h3>
              {testMode && (
                <span className="text-[10px] uppercase tracking-[0.14em] text-amber-700">{so ? 'Tijaabo' : 'Test mode'}</span>
              )}
            </div>

            {methods.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                {so ? 'Hab lacag-bixin looma hayo dalkan.' : 'No payment methods are available for this country.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
                {methods.map((m) => {
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 text-xs border transition-colors cursor-pointer text-left ${
                        paymentMethod === m.id ? 'border-fg' : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <div className="font-medium text-fg">{m.title}</div>
                      <div className="text-[10px] text-fg-3 mt-0.5 truncate">{m.hint}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Card details */}
            {paymentMethod === 'Credit / Debit Card' && (
              <div className="p-4 border border-line space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {CARD_BRANDS.filter((b) => payments.cards.brands.includes(b.id)).map((b) => (
                    <span
                      key={b.id}
                      className={`text-[10px] px-1.5 transition-colors ${cardBrand === b.id ? 'text-fg' : 'text-fg-4'}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
                <div>
                  <label className="block text-[11px] text-fg-3 mb-1">{so ? 'Magaca kaarka ku qoran' : 'Name on card'}</label>
                  <input type="text" autoComplete="cc-name" value={cardName} onChange={(e) => setCardName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] text-fg-3 mb-1">{so ? 'Lambarka kaarka' : 'Card number'}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-fg-3 mb-1">{so ? 'Dhicitaanka (MM/YY)' : 'Expiry (MM/YY)'}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={cardExpiry}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCardExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                      }}
                      placeholder="MM/YY"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-fg-3 mb-1">{so ? 'Koodhka ammaanka (CVC)' : 'Security code (CVC)'}</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, cvcLength))}
                      placeholder={cardBrand === 'amex' ? '••••' : '•••'}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                {testMode && (
                  <p className="text-[11px] text-fg-3">
                    {so ? 'Tijaabo: isticmaal 4242 4242 4242 4242.' : 'Test card: 4242 4242 4242 4242.'}
                  </p>
                )}
              </div>
            )}

            {/* Wallet redirects */}
            {(paymentMethod === 'PayPal' || paymentMethod === 'Apple Pay' || paymentMethod === 'Google Pay') && (
              <p className="text-xs text-fg-3">
                {so ? `Waxaad ku xaqiijinaysaa ${paymentMethod}.` : `You'll confirm with ${paymentMethod}.`}
              </p>
            )}

            {/* Mobile money */}
            {wallet && (
              <div className="p-4 border border-line space-y-2">
                <div className="text-sm text-fg font-mono">
                  {so ? `U dir: ${wallet.merchantNumber}` : `Send to: ${wallet.merchantNumber}`}
                </div>
                <div>
                  <label className="block text-[11px] text-fg-3 mb-1">
                    {so ? 'Lambarka xawilaadda (ikhtiyaari)' : 'Transaction ID (optional)'}
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. TXN-894120"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>
            )}

            {/* Bank transfer */}
            {paymentMethod === 'Bank Transfer' && (
              <div className="p-4 border border-line text-xs space-y-1.5">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  <span className="text-fg-3">{so ? 'Bangiga' : 'Bank'}</span>
                  <span className="text-fg font-medium">{payments.bankTransfer.bankName}</span>
                  <span className="text-fg-3">{so ? 'Magaca akoonka' : 'Account name'}</span>
                  <span className="text-fg font-medium">{payments.bankTransfer.accountName}</span>
                  {payments.bankTransfer.iban && (
                    <>
                      <span className="text-fg-3">IBAN</span>
                      <span className="text-fg font-mono">{payments.bankTransfer.iban}</span>
                    </>
                  )}
                  {payments.bankTransfer.swift && (
                    <>
                      <span className="text-fg-3">SWIFT / BIC</span>
                      <span className="text-fg font-mono">{payments.bankTransfer.swift}</span>
                    </>
                  )}
                </div>
                {payments.bankTransfer.instructions && <p className="text-fg-3 pt-1">{payments.bankTransfer.instructions}</p>}
              </div>
            )}
          </div>

          {/* Order Summary Recap */}
          <div className="pt-4 border-t border-line space-y-2 text-xs">
            <div className="flex justify-between text-fg-2">
              <span>{getTranslation(lang, 'subtotal')}</span>
              <span className="font-mono text-fg">{formatMoney(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon ({appliedCoupon})</span>
                <span className="font-mono tabular-nums">-{formatMoney(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-fg-2">
              <span>{so ? 'Dirista' : 'Shipping'}</span>
              <span className="font-mono text-fg">
                {deliveryFee === 0 && selectedZone ? <span className="text-emerald-700 font-semibold">Free</span> : `${formatMoney(deliveryFee)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm uppercase tracking-[0.12em] text-fg pt-3 border-t border-line">
              <span>{getTranslation(lang, 'total')}</span>
              <span className="font-mono text-base tracking-normal">{formatMoney(grandTotal)}</span>
            </div>
            {localTotal && (
              <div className="flex justify-between text-[11px] text-fg-3">
                <span>{so ? 'Qiyaas' : 'Approx.'}</span>
                <span className="font-mono">≈ {localTotal}</span>
              </div>
            )}
            {country !== HQ_COUNTRY && (
              <p className="text-[11px] text-fg-3 pt-1">
                {so ? 'Lagu jarayaa GBP. Canshuurta kastamka waa ku saaran tahay qofka helaya.' : 'Charged in GBP. Import duties may apply.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedZone || methods.length === 0}
            className="w-full py-4 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? so ? 'Waa la diraya…' : 'Processing…'
              : isGatewayMethod
              ? `${so ? 'Bixi' : 'Pay'} ${formatMoney(grandTotal)}`
              : getTranslation(lang, 'placeOrder')}
          </button>
        </form>
      </div>
    </div>
  );
};
