import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Recaptcha = ({ onVerify, onExpire }) => {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;

    const render = () => {
      if (widgetId.current != null) {
        grecaptcha.reset(widgetId.current);
        return;
      }
      widgetId.current = grecaptcha.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onVerifyRef.current?.(token),
        'expired-callback': () => onExpireRef.current?.(),
      });
    };

    if (window.grecaptcha?.ready) {
      grecaptcha.ready(render);
    } else {
      window._recaptchaOnLoad = render;
      const s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/api.js?onload=_recaptchaOnLoad&render=explicit';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    return () => {
      if (widgetId.current != null) {
        try { grecaptcha.reset(widgetId.current); } catch {}
      }
    };
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={ref} className="my-4 flex justify-center" />;
};

export default Recaptcha;
