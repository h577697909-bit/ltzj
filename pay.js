/*
  Galaxy Strike payment bridge.
  This file connects the game coin-pack checkout UI to the PayApi-v2 DoRequest flow.
*/
(function () {
  'use strict';

  const PENDING_KEY = 'GALAXY_STRIKE_PENDING_COIN_ORDER';
  const PAY_TYPES = {
    'Credit Card': 8004,
    'Apple Pay': 8003,
    'Google Pay': 8012
  };

  function normalizeAmount(value) {
    if (typeof value === 'number') return Number(value.toFixed(2));
    return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
  }

  function splitName(name) {
    const parts = String(name || 'Ace Pilot').trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || 'Ace',
      lastName: parts.slice(1).join(' ') || 'Pilot'
    };
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

  window.GalaxyPay = {
    async checkout({ method = 'Credit Card', packName = 'Coin Pack', amount = 0.99, currency = 'USD', coins = 0, email = '', name = 'Ace Pilot', firstName = '', lastName = '', country = 'US', phone = '', successUrl = '', backUrl = '' } = {}) {
      const orderId = `GS${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
      const amountValue = normalizeAmount(amount);
      const nameParts = splitName(name);
      const checkoutFirstName = String(firstName || nameParts.firstName || 'Ace').trim();
      const checkoutLastName = String(lastName || nameParts.lastName || 'Pilot').trim();
      const order = {
        orderId,
        packName,
        amount: amountValue,
        currency,
        coins,
        method,
        email,
        firstName: checkoutFirstName,
        lastName: checkoutLastName,
        country,
        createdAt: new Date().toISOString()
      };
      savePending(order);

      const options = {
        orderId,
        amount: amountValue,
        currency,
        payTypes: PAY_TYPES[method] || PAY_TYPES['Credit Card'],
        name: packName,
        email: email || 'pilot@example.com',
        firstName: checkoutFirstName,
        lastName: checkoutLastName,
        country,
        phone: phone || '',
        successUrl: successUrl || buildReturnUrl('success', orderId),
        backUrl: backUrl || buildReturnUrl('failed', orderId)
      };

      if (typeof window.DoRequest === 'function') {
        window.DoRequest(options);
        return { ok: true, order };
      }

      console.warn('[GalaxyPay] DoRequest is unavailable. Check PayApi-v2.js and crypto-js.min.js script loading.');
      return { ok: false, message: 'Payment service is unavailable.', order };
    },

    consumeCompletedOrder(orderId) {
      const order = readPending();
      if (!order) return null;
      if (orderId && order.orderId && String(order.orderId) !== String(orderId)) return null;
      clearPending();
      return order;
    }
  };
})();
