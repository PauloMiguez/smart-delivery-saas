#!/bin/bash
# ============================================================
# VERIFICAR SE TODOS OS COMPONENTES USAM A FUNÇÃO CENTRALIZADA
# ============================================================

echo "=========================================="
echo "🔍 VERIFICANDO USO DA FUNÇÃO CENTRALIZADA formatDate"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar se o arquivo centralizado existe
echo "${BLUE}📁 1. VERIFICANDO ARQUIVO CENTRALIZADO${NC}"
echo "------------------------------------------"
if [ -f "frontend-react/src/utils/dateFormatter.js" ]; then
    echo "${GREEN}✅ dateFormatter.js existe${NC}"
else
    echo "${RED}❌ dateFormatter.js NÃO encontrado${NC}"
    echo "   Criando arquivo..."
    
    mkdir -p frontend-react/src/utils
    cat > frontend-react/src/utils/dateFormatter.js << 'EOF'
// ============================================================
//  FUNÇÃO CENTRALIZADA PARA FORMATAR DATAS
// ============================================================

/**
 * Formata uma data para exibição no padrão brasileiro
 * @param {string} dateString - Data em formato ISO (YYYY-MM-DDTHH:MM:SS)
 * @param {boolean} isScheduled - Se é uma data agendada (mantém horário local)
 * @returns {string} Data formatada (DD/MM/YYYY, HH:MM)
 */
export const formatDate = (dateString, isScheduled = false) => {
    if (!dateString) return '-';
    try {
        // ✅ Verificar se é uma data agendada (formato YYYY-MM-DDTHH:MM:SS)
        // e NÃO tem Z (UTC) ou offset (+/-)
        const isScheduledDate = isScheduled && 
                               typeof dateString === 'string' && 
                               dateString.includes('T') && 
                               !dateString.includes('Z') && 
                               !dateString.includes('+') &&
                               !dateString.includes('-', 10);

        if (isScheduledDate) {
            const parts = dateString.split('T');
            if (parts.length === 2) {
                const datePart = parts[0];
                const timePart = parts[1];
                const [y, m, d] = datePart.split('-');
                const [h, min] = timePart.split(':');
                if (y && m && d && h && min) {
                    return `${d}/${m}/${y}, ${h}:${min}`;
                }
            }
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error("Erro ao formatar data:", error);
        return '-';
    }
};

/**
 * Formata data para exibição em cards (apenas data, sem hora)
 */
export const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
};

/**
 * Formata data para exibição em listas (data e hora curta)
 */
export const formatDateTimeShort = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

export default formatDate;
