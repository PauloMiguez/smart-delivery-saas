// ============================================================
// DETECÇÃO DE NAVEGADOR E PLATAFORMA
// ============================================================

/**
 * Verifica se o navegador é Safari
 */
export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

/**
 * Verifica se é um dispositivo iOS (iPhone/iPad/iPod)
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Verifica se está rodando como PWA (tela de início)
 */
export const isPWA = () => {
  return window.navigator.standalone || 
         window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches;
};

/**
 * Verifica se o navegador suporta Push API
 */
export const isPushSupported = () => {
  return 'PushManager' in window && 
         'serviceWorker' in navigator &&
         !isSafari(); // Safari não suporta Push API padrão
};

/**
 * Retorna informações completas do navegador
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isSafariBrowser = isSafari();
  const isIOSDevice = isIOS();
  const isPWAApp = isPWA();
  const supportsPush = isPushSupported();

  return {
    userAgent,
    isSafari: isSafariBrowser,
    isIOS: isIOSDevice,
    isPWA: isPWAApp,
    supportsPush,
    isChrome: /Chrome/.test(userAgent) && !isSafariBrowser,
    isFirefox: /Firefox/.test(userAgent),
    isEdge: /Edg/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    platform: isIOSDevice ? 'iOS' : 
              /Android/.test(userAgent) ? 'Android' : 
              'Desktop'
  };
};

export default {
  isSafari,
  isIOS,
  isPWA,
  isPushSupported,
  getBrowserInfo
};