import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { RefreshCw, Volume2, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import './Captcha.css';

const Captcha = forwardRef(({ onValidate, className = '' }, ref) => {
  const canvasRef = useRef(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'valid' | 'invalid'
  const [errorMessage, setErrorMessage] = useState('');
  const [isRotating, setIsRotating] = useState(false);

  // Generate 5 distinct, high-readability alphanumeric characters
  const generateCode = useCallback(() => {
    // Clear uppercase characters and numbers (omitting confusing 0, O, 1, I)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  // Draw high-resolution canvas dynamically fitted to its container
  const drawCaptcha = useCallback((text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamically calculate container dimensions for 100% responsiveness
    const container = canvas.parentElement;
    const rect = container ? container.getBoundingClientRect() : null;
    const displayWidth = rect && rect.width > 40 ? Math.floor(rect.width) : 220;
    const displayHeight = rect && rect.height > 20 ? Math.floor(rect.height) : 46;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    // Set pixel resolution buffer
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);
    ctx.scale(dpr, dpr);

    const width = displayWidth;
    const height = displayHeight;

    // Background Gradient (soft clean tint)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.5, '#eef2f6');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle wavy background security lines
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * height);
      ctx.bezierCurveTo(
        width * 0.3, Math.random() * height,
        width * 0.7, Math.random() * height,
        width, Math.random() * height
      );
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 80 + 120)}, ${Math.floor(Math.random() * 80 + 120)}, ${Math.floor(Math.random() * 80 + 120)}, 0.4)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Light noise dots
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 116, 139, 0.25)';
      ctx.fill();
    }

    // High contrast distinct colors for each letter
    const colors = ['#B91C1C', '#1D4ED8', '#047857', '#7C3AED', '#C2410C'];
    const fontFamilies = ['Arial', 'Verdana', 'Trebuchet MS', 'Impact'];

    // Proportional character spacing based on container width
    const charSpacing = width / (text.length + 1);
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      ctx.save();
      const x = (i + 0.95) * charSpacing;
      const y = height / 2 + 1;
      const angle = (Math.random() * 14 - 7) * (Math.PI / 180); // gentle tilt

      ctx.translate(x, y);
      ctx.rotate(angle);

      // Scale font size proportionally to height and width
      const fontName = fontFamilies[i % fontFamilies.length];
      const fontSize = Math.min(24, Math.max(17, Math.floor(height * 0.52)));
      ctx.font = `900 ${fontSize}px ${fontName}, sans-serif`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // Subtle shadow for 3D depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, []);

  // Refresh CAPTCHA
  const refreshCaptcha = useCallback(() => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 450);

    setUserInput('');
    setStatus('idle');
    setErrorMessage('');
    if (onValidate) onValidate(false);

    const newCode = generateCode();
    setCaptchaCode(newCode);
    setTimeout(() => drawCaptcha(newCode), 15);
  }, [generateCode, drawCaptcha, onValidate]);

  // Initial load
  useEffect(() => {
    refreshCaptcha();
  }, []);

  // ResizeObserver: auto-redraw canvas whenever container resizes (e.g., responsive changes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement || typeof ResizeObserver === 'undefined') return;

    let resizeTimer;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (captchaCode) {
          drawCaptcha(captchaCode);
        }
      }, 60);
    });

    observer.observe(canvas.parentElement);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [captchaCode, drawCaptcha]);

  // Text-to-speech accessibility
  const speakCaptcha = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const textToSpeak = captchaCode.split('').join(' . ');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.75;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setUserInput(val);
    setErrorMessage('');

    if (val.trim() === captchaCode) {
      setStatus('valid');
      if (onValidate) onValidate(true);
    } else {
      setStatus('idle');
      if (onValidate) onValidate(false);
    }
  };

  // Expose validation methods to parent form
  useImperativeHandle(ref, () => ({
    validate: () => {
      const isValid = userInput.trim().toUpperCase() === captchaCode;
      if (isValid) {
        setStatus('valid');
        setErrorMessage('');
        if (onValidate) onValidate(true);
        return true;
      } else {
        setStatus('invalid');
        setErrorMessage('Incorrect CAPTCHA. Please enter the characters shown above.');
        if (onValidate) onValidate(false);
        refreshCaptcha();
        return false;
      }
    },
    reset: () => {
      refreshCaptcha();
    },
    isValid: () => userInput.trim().toUpperCase() === captchaCode
  }));

  return (
    <div className={`saas-captcha-box ${className}`}>
      {/* Header Info */}
      <div className="saas-captcha-top-row">
        <div className="saas-captcha-tag">
          <ShieldCheck size={16} color="#C62828" />
          <span>Security Verification</span>
          <span className="saas-captcha-pill">Spam Protection</span>
        </div>
        <div className="saas-captcha-tool-buttons">
          <button
            type="button"
            className="saas-captcha-icon-btn"
            title="Listen to CAPTCHA code"
            onClick={speakCaptcha}
            aria-label="Listen to code"
          >
            <Volume2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Interactive Row: Canvas + Reload + Input Block */}
      <div className="saas-captcha-interactive-row">
        {/* Canvas Visual Card */}
        <div
          className="saas-captcha-canvas-card"
          onClick={refreshCaptcha}
          title="Click to generate new code"
        >
          <canvas
            ref={canvasRef}
            className="saas-captcha-canvas-element"
          />
        </div>

        {/* Reload Button */}
        <button
          type="button"
          className="saas-captcha-reload-btn"
          onClick={refreshCaptcha}
          title="Reload CAPTCHA"
          aria-label="Reload CAPTCHA"
        >
          <RefreshCw size={15} className={isRotating ? 'rotate-spin' : ''} />
          <span>Reload</span>
        </button>

        {/* User Input Field */}
        <div className="saas-captcha-input-block">
          <input
            type="text"
            className={`saas-captcha-input-field ${status === 'valid' ? 'is-valid' : ''} ${status === 'invalid' ? 'is-invalid' : ''}`}
            placeholder="Enter 5 characters"
            value={userInput}
            onChange={handleInputChange}
            maxLength={8}
            required
            autoComplete="off"
            spellCheck="false"
          />
          {status === 'valid' && (
            <div className="saas-captcha-status-indicator text-success">
              <Check size={18} />
            </div>
          )}
        </div>
      </div>

      {/* Error & Success Feedback */}
      {status === 'invalid' && (
        <div className="saas-captcha-alert error">
          <AlertCircle size={14} />
          <span>{errorMessage || 'Incorrect code, please try again.'}</span>
        </div>
      )}

      {status === 'valid' && (
        <div className="saas-captcha-alert success">
          <Check size={14} />
          <span>Security check verified</span>
        </div>
      )}
    </div>
  );
});

export default Captcha;
