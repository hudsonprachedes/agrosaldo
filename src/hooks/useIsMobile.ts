import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

const getIsMobile = () =>
  typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => getIsMobile());

  useEffect(() => {
    const checkMobile = () => setIsMobile(getIsMobile());

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
