// frontend-react/src/utils/tenantUtils.js

// ============================================================
//  UTILITÁRIOS PARA TENANT
// ============================================================

/**
 * Verifica se o domínio atual é personalizado
 * @returns {boolean} true se for domínio personalizado
 */
export const isCustomDomain = () => {
    const host = window.location.hostname;
    return host !== 'smart-delivery-saas.onrender.com' && 
           host !== 'localhost' && 
           host !== '127.0.0.1' &&
           !host.includes('render.com');
};

/**
 * Retorna a URL base com tenant se necessário
 * @param {string} path - Caminho da URL
 * @param {string} tenant - Tenant ID
 * @returns {string} URL com tenant se necessário
 */
export const getUrlWithTenant = (path, tenant) => {
    if (isCustomDomain()) {
        // ✅ Domínio personalizado: não precisa de tenant
        return path;
    }
    
    // ✅ Domínio raiz: precisa de tenant
    if (tenant) {
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}tenant=${tenant}`;
    }
    
    return path;
};

/**
 * Remove tenant da URL se presente
 * @param {string} url - URL completa
 * @returns {string} URL sem tenant
 */
export const removeTenantFromUrl = (url) => {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.delete('tenant');
    return urlObj.pathname + urlObj.search + urlObj.hash;
};