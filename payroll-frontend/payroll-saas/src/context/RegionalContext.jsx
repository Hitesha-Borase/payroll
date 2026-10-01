import React, { createContext, useContext, useState, useEffect } from 'react';

export const REGIONAL_EDITIONS = [
  {
    id: 'in',
    code: 'IN',
    lang: 'en',
    label: 'India (₹)',
    currency: '₹',
    currencyCode: 'INR',
    isGlobe: true,
    prices: {
      trial: '₹ 0',
      starter: '₹ 999',
      pro: '₹ 1,299',
      premium: '₹ 1,499',
      custom: 'Custom'
    }
  },
  {
    id: 'us',
    code: 'US',
    lang: 'en',
    label: 'USA ($)',
    currency: '$',
    currencyCode: 'USD',
    isGlobe: false,
    prices: {
      trial: '$ 0',
      starter: '$ 19',
      pro: '$ 49',
      premium: '$ 99',
      custom: 'Custom'
    }
  },
  {
    id: 'ae',
    code: 'AE',
    lang: 'ar',
    label: 'UAE (AED)',
    currency: 'AED',
    currencyCode: 'AED',
    isGlobe: false,
    prices: {
      trial: 'AED 0',
      starter: 'AED 89',
      pro: 'AED 199',
      premium: 'AED 399',
      custom: 'Custom'
    }
  },
  {
    id: 'fr',
    code: 'FR',
    lang: 'fr',
    label: 'France (€)',
    currency: '€',
    currencyCode: 'EUR',
    isGlobe: false,
    prices: {
      trial: '€ 0',
      starter: '€ 18',
      pro: '€ 45',
      premium: '€ 89',
      custom: 'Custom'
    }
  },
  {
    id: 'es',
    code: 'ES',
    lang: 'es',
    label: 'Spain ($)',
    currency: '$',
    currencyCode: 'USD',
    isGlobe: false,
    prices: {
      trial: '$ 0',
      starter: '$ 19',
      pro: '$ 49',
      premium: '$ 99',
      custom: 'Custom'
    }
  },
  {
    id: 'de',
    code: 'DE',
    lang: 'de',
    label: 'Germany (€)',
    currency: '€',
    currencyCode: 'EUR',
    isGlobe: false,
    prices: {
      trial: '€ 0',
      starter: '€ 18',
      pro: '€ 45',
      premium: '€ 89',
      custom: 'Custom'
    }
  },
  {
    id: 'gb',
    code: 'GB',
    lang: 'en',
    label: 'UK (£)',
    currency: '£',
    currencyCode: 'GBP',
    isGlobe: false,
    prices: {
      trial: '£ 0',
      starter: '£ 15',
      pro: '£ 39',
      premium: '£ 79',
      custom: 'Custom'
    }
  }
];

const RegionalContext = createContext();

export const RegionalProvider = ({ children }) => {
  const [edition, setEditionState] = useState(() => {
    const saved = localStorage.getItem('kiaan_regional_edition');
    return REGIONAL_EDITIONS.find((e) => e.id === saved) || REGIONAL_EDITIONS[0];
  });

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

  const changeEdition = (newEdition) => {
    setEditionState(newEdition);
    localStorage.setItem('kiaan_regional_edition', newEdition.id);
    localStorage.setItem('kiaan_selected_currency', newEdition.currency);
    localStorage.setItem('kiaan_selected_language', newEdition.lang || 'en');

    const langCode = newEdition.lang || 'en';
    setGoogleTranslateCookie(langCode);
    triggerGoogleTranslateWidget(langCode);

    if (langCode === 'en') {
      // If returning to English from translated state, ensure DOM is clean
      const isTranslated = document.querySelector('html.translated-ltr') || document.querySelector('html.translated-rtl');
      if (isTranslated) {
        window.location.reload();
      }
    }

    // Dispatch global custom event for any listeners
    window.dispatchEvent(new CustomEvent('kiaanRegionalChanged', { detail: newEdition }));
  };

  useEffect(() => {
    const savedLang = edition.lang || 'en';
    if (savedLang && savedLang !== 'en') {
      setGoogleTranslateCookie(savedLang);
      // Wait for Google translate widget script to load if needed
      const timer = setTimeout(() => {
        triggerGoogleTranslateWidget(savedLang);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <RegionalContext.Provider value={{ edition, changeEdition, editions: REGIONAL_EDITIONS }}>
      {children}
    </RegionalContext.Provider>
  );
};

export const useRegional = () => {
  const context = useContext(RegionalContext);
  if (!context) {
    const saved = localStorage.getItem('kiaan_regional_edition');
    const fallback = REGIONAL_EDITIONS.find((e) => e.id === saved) || REGIONAL_EDITIONS[0];
    return { edition: fallback, changeEdition: () => {}, editions: REGIONAL_EDITIONS };
  }
  return context;
};

