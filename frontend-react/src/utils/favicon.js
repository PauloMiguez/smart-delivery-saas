/**
 * Atualiza o favicon da página com a URL da imagem fornecida
 * @param {string} url - URL da imagem (logo)
 */
export const setFavicon = (url) => {
  if (!url) return;

  // Remove favicon existente (se houver)
  const oldLink = document.querySelector("link[rel='icon']");
  if (oldLink) {
    oldLink.remove();
  }

  // Cria novo link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = url;
  link.type = 'image/png'; // ou 'image/jpeg' (o navegador aceita)
  document.head.appendChild(link);
};