import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Live Exchange Rate API endpoint provided
export const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

// Base prices in INR (Platform standard)
export const BASE_INR_PRICES = {
  trial: 0,
  starter: 999,
  pro: 1299,
  premium: 1499,
  custom: 'Custom'
};

// Default fallback exchange rates (relative to USD) in case network is delayed
export const DEFAULT_RATES = {
  USD: 1,
  INR: 96.0,
  EUR: 0.88,
  GBP: 0.75,
  AED: 3.67,
  SAR: 3.75,
  JPY: 157.3,
  CAD: 1.42,
  AUD: 1.44
};

export const REGIONAL_EDITIONS = [
  {
    id: 'in',
    code: 'IN',
    lang: 'en',
    label: 'India (₹)',
    country: 'India',
    currency: '₹',
    currencyCode: 'INR',
    isGlobe: true,
  },
  {
    id: 'us',
    code: 'US',
    lang: 'en',
    label: 'USA ($)',
    country: 'United States',
    currency: '$',
    currencyCode: 'USD',
    isGlobe: false,
  },
  {
    id: 'gb',
    code: 'GB',
    lang: 'en',
    label: 'UK (£)',
    country: 'United Kingdom',
    currency: '£',
    currencyCode: 'GBP',
    isGlobe: false,
  },
  {
    id: 'ae',
    code: 'AE',
    lang: 'ar',
    label: 'UAE (AED د.إ)',
    country: 'United Arab Emirates',
    currency: 'AED',
    currencyCode: 'AED',
    isGlobe: false,
  },
  {
    id: 'de',
    code: 'DE',
    lang: 'de',
    label: 'Germany (€)',
    country: 'Germany',
    currency: '€',
    currencyCode: 'EUR',
    isGlobe: false,
  },
  {
    id: 'es',
    code: 'ES',
    lang: 'es',
    label: 'Spain (€)',
    country: 'Spain',
    currency: '€',
    currencyCode: 'EUR',
    isGlobe: false,
  }
];

const RegionalContext = createContext();

export const RegionalProvider = ({ children }) => {
  // 1. Live Exchange Rates State (with local cache)
  const [rates, setRates] = useState(() => {
    try {
      const cached = localStorage.getItem('kiaan_exchange_rates');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return DEFAULT_RATES;
  });

  // 2. Active Edition State
  const [edition, setEditionState] = useState(() => {
    const saved = localStorage.getItem('kiaan_regional_edition');
    return REGIONAL_EDITIONS.find((e) => e.id === saved) || REGIONAL_EDITIONS[0];
  });

  // Fetch live exchange rates from open.er-api.com API
  const fetchExchangeRates = useCallback(async () => {
    try {
      const res = await fetch(EXCHANGE_RATE_API);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setRates(data.rates);
          localStorage.setItem('kiaan_exchange_rates', JSON.stringify(data.rates));
          localStorage.setItem('kiaan_exchange_rates_time', Date.now().toString());
        }
      }
    } catch (err) {
      console.warn('[RegionalContext] Using cached/default exchange rates:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  // Convert an amount from one currency code to another (relative to USD base)
  const convertAmount = useCallback((amount, fromCurrency = 'INR', toCurrency = edition.currencyCode) => {
    if (amount === undefined || amount === null || amount === '') return 0;
    const num = parseFloat(amount);
    if (isNaN(num)) return 0;
    if (fromCurrency === toCurrency) return num;

    const fromRate = rates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1;
    const toRate = rates[toCurrency] || DEFAULT_RATES[toCurrency] || 1;

    // Convert to USD first, then to target currency
    const amountInUSD = num / fromRate;
    return amountInUSD * toRate;
  }, [rates, edition.currencyCode]);

  // Format currency with symbol & localized formatting
  const formatCurrency = useCallback((amount, fromCurrency = 'INR', toCurrency = edition.currencyCode) => {
    if (amount === undefined || amount === null || amount === '') return '';
    if (typeof amount === 'string' && isNaN(parseFloat(amount))) return amount; // for 'Custom' etc.
    
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    if (num === 0) {
      const sym = edition.currency || '₹';
      return `${sym} 0`;
    }

    const converted = convertAmount(num, fromCurrency, toCurrency);
    const targetEdition = REGIONAL_EDITIONS.find(e => e.currencyCode === toCurrency) || edition;
    const sym = targetEdition.currency || toCurrency;

    let formattedNum;
    if (toCurrency === 'JPY' || toCurrency === 'INR') {
      formattedNum = Math.round(converted).toLocaleString();
    } else {
      formattedNum = converted.toLocaleString(undefined, {
        minimumFractionDigits: Number.isInteger(converted) ? 0 : 2,
        maximumFractionDigits: 2
      });
    }

    return `${sym} ${formattedNum}`;
  }, [convertAmount, edition]);

  // Calculate live plan prices object for active edition
  const dynamicPrices = {
    trial: `${edition.currency} 0`,
    starter: formatCurrency(BASE_INR_PRICES.starter, 'INR', edition.currencyCode),
    pro: formatCurrency(BASE_INR_PRICES.pro, 'INR', edition.currencyCode),
    premium: formatCurrency(BASE_INR_PRICES.premium, 'INR', edition.currencyCode),
    custom: 'Custom'
  };

  const activeEditionWithPrices = {
    ...edition,
    prices: dynamicPrices
  };

  const setGoogleTranslateCookie = (lang) => {
    const host = window.location.hostname;
    if (!lang || lang === 'en') {
      const paths = ['/', ''];
      const domains = ['', host, `.${host}`];
      paths.forEach((p) => {
        domains.forEach((d) => {
          const domainStr = d ? `; domain=${d}` : '';
          const pathStr = p ? `; path=${p}` : '; path=/';
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pathStr}${domainStr};`;
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pathStr};`;
        });
      });
    } else {
      document.cookie = `googtrans=/en/${lang}; path=/; domain=${host};`;
      document.cookie = `googtrans=/en/${lang}; path=/;`;
    }
  };

  const triggerGoogleTranslateWidget = (lang) => {
    const masterSelect = document.querySelector("#google_translate_master_container select.goog-te-combo");
    if (masterSelect) {
      masterSelect.value = (!lang || lang === 'en') ? '' : lang;
      masterSelect.dispatchEvent(new Event("change"));
    }
  };

  // Change active country / edition and auto-convert currency
  const changeEdition = (newEdition) => {
    setEditionState(newEdition);
    localStorage.setItem('kiaan_regional_edition', newEdition.id);
    localStorage.setItem('kiaan_selected_currency', newEdition.currency);
    localStorage.setItem('kiaan_selected_currency_code', newEdition.currencyCode);
    localStorage.setItem('kiaan_selected_language', newEdition.lang || 'en');

    const langCode = newEdition.lang || 'en';
    setGoogleTranslateCookie(langCode);
    triggerGoogleTranslateWidget(langCode);

    if (langCode === 'en') {
      const isTranslated = document.querySelector('html.translated-ltr') || document.querySelector('html.translated-rtl');
      if (isTranslated) {
        window.location.reload();
      }
    }

    // Dispatch custom events
    window.dispatchEvent(new CustomEvent('kiaanRegionalChanged', { detail: newEdition }));
    window.dispatchEvent(new CustomEvent('kiaanCurrencyChanged', { detail: { currency: newEdition.currency, currencyCode: newEdition.currencyCode } }));
  };

  // Automatically switch currency when language changes
  const changeByLanguage = (langCode) => {
    if (!langCode) return;
    const matching = REGIONAL_EDITIONS.find(e => e.lang === langCode);
    if (matching) {
      changeEdition(matching);
    }
  };

  useEffect(() => {
    const savedLang = edition.lang || 'en';
    if (savedLang && savedLang !== 'en') {
      setGoogleTranslateCookie(savedLang);
      const timer = setTimeout(() => {
        triggerGoogleTranslateWidget(savedLang);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <RegionalContext.Provider
      value={{
        edition: activeEditionWithPrices,
        changeEdition,
        changeByLanguage,
        convertAmount,
        formatCurrency,
        currency: edition.currency,
        currencyCode: edition.currencyCode,
        rates,
        editions: REGIONAL_EDITIONS,
        refreshRates: fetchExchangeRates
      }}
    >
      {children}
    </RegionalContext.Provider>
  );
};

export const useRegional = () => {
  const context = useContext(RegionalContext);
  if (!context) {
    const saved = localStorage.getItem('kiaan_regional_edition');
    const fallback = REGIONAL_EDITIONS.find((e) => e.id === saved) || REGIONAL_EDITIONS[0];
    return {
      edition: { ...fallback, prices: BASE_INR_PRICES },
      changeEdition: () => {},
      changeByLanguage: () => {},
      convertAmount: (a) => a,
      formatCurrency: (a) => `₹ ${a}`,
      currency: fallback.currency,
      currencyCode: fallback.currencyCode,
      rates: DEFAULT_RATES,
      editions: REGIONAL_EDITIONS,
      refreshRates: () => {}
    };
  }
  return context;
};
