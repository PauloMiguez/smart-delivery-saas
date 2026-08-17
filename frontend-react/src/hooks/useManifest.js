// ============================================================
// HOOK PARA GERENCIAR MANIFEST DINÂMICO
// ============================================================

import { useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantContext';

export const useManifest = () => {
  const { tenantId } = useTenant();
  const [manifestLoaded, setManifestLoaded] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    const updateManifest = async () => {
      try {
        // Buscar manifest do tenant
        const response = await fetch(`/manifest.json?tenant=${encodeURIComponent(tenantId)}`);
        const manifest = await response.json();

        // Atualizar o link do manifest
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          manifestLink.href = `/manifest.json?tenant=${encodeURIComponent(tenantId)}`;
        }

        // Atualizar theme-color
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor && manifest.theme_color) {
          themeColor.content = manifest.theme_color;
        }

        // Atualizar title
        if (manifest.name) {
          document.title = manifest.name;
        }

        setManifestLoaded(true);
        console.log(`📱 Manifest atualizado para tenant: ${tenantId}`);
      } catch (error) {
        console.error('❌ Erro ao carregar manifest:', error);
        setManifestLoaded(true);
      }
    };

    updateManifest();

    // Recarregar quando o tenant mudar
    return () => {
      setManifestLoaded(false);
    };
  }, [tenantId]);

  return { manifestLoaded };
};

export default useManifest;