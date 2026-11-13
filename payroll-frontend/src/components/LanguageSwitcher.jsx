import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useRegional, REGIONAL_EDITIONS } from '../context/RegionalContext';
import './LanguageSwitcher.css';

export { REGIONAL_EDITIONS };

export const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const { edition: currentEdition, changeEdition } = useRegional();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with Google Translate widget if user changes it
  useEffect(() => {
    const syncWithGoogle = () => {
      const masterSelect = document.querySelector("#google_translate_master_container select.goog-te-combo");
      if (masterSelect && masterSelect.value && masterSelect.value !== currentEdition.lang) {
        const matchingEdition = REGIONAL_EDITIONS.find(e => e.lang === masterSelect.value);
        if (matchingEdition) {
          changeEdition(matchingEdition);
        }
      }
    };
    const interval = setInterval(syncWithGoogle, 1500);
    return () => clearInterval(interval);
  }, [currentEdition, changeEdition]);

  const handleSelectEdition = (edition) => {
    changeEdition(edition);
    if (edition.lang) {
      i18n.changeLanguage(edition.lang);
    }
    setIsOpen(false);
  };

  return (
    <div className={`kiaan-regional-wrapper notranslate ${className}`} ref={dropdownRef}>
      {/* Top Toggle Button */}
      <button
        type="button"
        className={`kiaan-regional-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Regional Edition & Language"
      >
        <Globe size={18} className="kiaan-regional-globe-icon" />
        <span className="kiaan-regional-toggle-code">{currentEdition.code}</span>
        <span className="kiaan-regional-toggle-label">{currentEdition.label}</span>
        {isOpen ? (
          <ChevronUp size={16} className="kiaan-regional-arrow" />
        ) : (
          <ChevronDown size={16} className="kiaan-regional-arrow" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="kiaan-regional-dropdown shadow-lg">
          {/* Header */}
          <div className="kiaan-regional-header">
            REGIONAL & LANGUAGE EDITIONS
          </div>

          {/* List of Editions */}
          <div className="kiaan-regional-list">
            {REGIONAL_EDITIONS.map((edition) => {
              const isSelected = currentEdition.id === edition.id;
              return (
                <button
                  key={edition.id}
                  type="button"
                  onClick={() => handleSelectEdition(edition)}
                  className={`kiaan-regional-item ${isSelected ? 'selected' : ''}`}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className={`kiaan-regional-code-badge ${isSelected ? 'selected' : ''}`}>
                      {edition.code}
                    </span>
                    <span className={`kiaan-regional-item-label ${isSelected ? 'selected' : ''}`}>
                      {edition.label}
                    </span>
                  </div>

                  {isSelected && (
                    <Check size={18} className="kiaan-regional-check-icon" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
