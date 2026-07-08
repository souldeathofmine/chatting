import { useEffect, useRef, useCallback } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const Captcha = ({ onVerify, onExpire }) => {
  const ref = useRef(null);
  const widgetId = useRef(null);

  const render = useCallback(() => {
    if (ref.current && window.turnstile) {
      if (widgetId.current != null) {
        window.turnstile.reset(widgetId.current);
      }
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
      });
    }
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (!SITE_KEY) return;

    if (window.turnstile) {
      render();
    } else {
      window._turnstileOnLoad = render;
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_turnstileOnLoad';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    return () => {
      if (widgetId.current != null) {
        try { window.turnstile?.remove(widgetId.current); } catch {}
      }
    };
  }, [render]);

  if (!SITE_KEY) return null;

  return <div ref={ref} className="my-4 flex justify-center" />;
};

export default Captcha;
