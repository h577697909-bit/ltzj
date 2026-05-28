/*
  Galaxy Strike payment bridge.
  External dependencies required in index.html, in this order:
  1) https://www.roomilo.com/js/core/crypto-js.min.js
  2) https://www.roomilo.com/js/core/PayApi-v2.js
  3) ./pay.js

  The game calls window.GamePayment.startGamePayment(...). This wrapper builds
  the DoRequest(options) payload used by the provider and stores a pending order
  so coins can be granted when the player returns through successUrl.
*/
(function () {
  'use strict';

  const PENDING_KEY = 'GALAXY_STRIKE_PENDING_COIN_ORDER';

  const PAY_TYPES = {
    card: 8004,
    creditCard: 8004,
    'Credit Card': 8004,
    apple: 8003,
    applePay: 8003,
    'Apple Pay': 8003,
    google: 8012,
    googlePay: 8012,
    'Google Pay': 8012
  };

  function normalizeAmount(value) {
    if (typeof value === 'number') return Number(value.toFixed(2));
    return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
  }

  function cleanText(value, fallback) {
    const text = String(value || '').trim();
    return text || fallback;
  }

  function createOrderId(prefix = 'GS') {
    const random = Math.floor(Math.random() * 900000 + 100000);
    return `${prefix}${Date.now()}${random}`;
  }

  function buildReturnUrl(status, orderId) {
    const url = new URL(window.location.href);
    url.searchParams.set('payment', status);
    url.searchParams.set('orderId', orderId);
    return url.toString();
  }

  function savePending(order) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(order));
  }

  function readPending() {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); }
    catch (e) { return null; }
  }

  function clearPending() {
    localStorage.removeItem(PENDING_KEY);
  }

  async function startGamePayment({
    amount = 0,
    coins = 0,
    productName = '',
    packName = '',
    payMethod = 'card',
    method = '',
    currency = 'USD',
    email = '',
    firstName = '',
    lastName = '',
    country = 'US',
    phone = '',
    successUrl = '',
    backUrl = ''
  } = {}) {
    const checkoutEmail = cleanText(email, '').toLowerCase();
    const checkoutFirstName = cleanText(firstName, 'Ace');
    const checkoutLastName = cleanText(lastName, 'Pilot');
    const checkoutCountry = cleanText(country, 'US');
    const checkoutPhone = cleanText(phone, '0000000000');
    const amountValue = normalizeAmount(amount);
    const itemName = cleanText(productName || packName, 'Galaxy Strike Coin Pack');
    const methodKey = method || payMethod || 'card';
    const payTypes = PAY_TYPES[methodKey] || PAY_TYPES.card;
    const orderId = createOrderId('GS');

    if (!checkoutEmail || !checkoutFirstName || !checkoutLastName || !checkoutCountry) {
      return { ok: false, message: 'Please complete your billing information first.' };
    }

    if (!amountValue || amountValue <= 0) {
      return { ok: false, message: 'Invalid checkout amount.' };
    }

    const order = {
      orderId,
      packName: itemName,
      amount: amountValue,
      currency,
      coins: Number(coins || 0),
      method: methodKey,
      payTypes,
      email: checkoutEmail,
      firstName: checkoutFirstName,
      lastName: checkoutLastName,
      country: checkoutCountry,
      phone: checkoutPhone,
      createdAt: new Date().toISOString()
    };
    savePending(order);

    const options = {
      orderId,
      amount: amountValue,
      currency,
      payTypes,
      name: itemName,
      email: checkoutEmail,
      firstName: checkoutFirstName,
      lastName: checkoutLastName,
      phone: checkoutPhone,
      successUrl: successUrl || buildReturnUrl('success', orderId),
      backUrl: backUrl || buildReturnUrl('failed', orderId)
    };

    // Keep country in the provider payload for light-game checkout profiling.
    // The provider may ignore unsupported fields, but the local order keeps it.
    options.country = checkoutCountry;

    if (typeof window.DoRequest !== 'function') {
      console.error('[GamePayment] DoRequest is unavailable. Confirm crypto-js.min.js and PayApi-v2.js are loaded before pay.js.');
      return { ok: false, message: 'Payment service is not available. Please try again later.', order };
    }

    window.DoRequest(options);
    return { ok: true, order };
  }

  function consumeCompletedOrder(orderId) {
    const order = readPending();
    if (!order) return null;
    if (orderId && order.orderId && String(order.orderId) !== String(orderId)) return null;
    clearPending();
    return order;
  }

  window.GamePayment = {
    startGamePayment,
    consumeCompletedOrder,
    PAY_TYPES,
    createOrderId
  };

  // Backward compatibility for earlier Galaxy Strike builds.
  window.GalaxyPay = {
    checkout(params = {}) {
      return startGamePayment({
        amount: params.amount,
        coins: params.coins,
        productName: params.packName || params.productName,
        payMethod: params.method || params.payMethod,
        currency: params.currency,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        country: params.country,
        phone: params.phone,
        successUrl: params.successUrl,
        backUrl: params.backUrl
      });
    },
    consumeCompletedOrder
  };
})();
