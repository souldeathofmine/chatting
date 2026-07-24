import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

let scriptLoaded = false;

const Recaptcha = ({ onVerify, onExpire }) => {
  const ref = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;

    const render = () => {
      if (ref.current.childNodes.length > 0) return;
      grecaptcha.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onVerifyRef.current?.(token),
        'expired-callback': () => onExpireRef.current?.(),
      });
    };

    if (window.grecaptcha?.render) {
      render();
    } else if (!scriptLoaded) {
      scriptLoaded = true;
      const originalOnLoad = window._recaptchaOnLoad;
      window._recaptchaOnLoad = () => {
        originalOnLoad?.();
        render();
      };
      const s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/api.js?onload=_recaptchaOnLoad&render=explicit';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    } else {
      const check = setInterval(() => {
        if (window.grecaptcha?.render) {
          clearInterval(check);
          render();
        }
      }, 200);
    }

    return () => {
      if (ref.current) ref.current.innerHTML = '';
    };
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={ref} className="my-4 flex justify-center" />;
};

export default Recaptcha;