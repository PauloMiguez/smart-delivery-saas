-- ============================================================
--  MIGRAÇÃO: ADICIONAR SUPORTE A ACOMPANHAMENTOS
-- ============================================================

-- 1. ADICIONAR CAMPO NA TABELA products
ALTER TABLE products 
ADD COLUMN is_addon TINYINT(1) DEFAULT 0 COMMENT '1 = é um acompanhamento';

-- 2. CRIAR ÍNDICE
CREATE INDEX idx_products_is_addon ON products(is_addon);

-- 3. ATUALIZAR PRODUTOS EXISTENTES COMO ACOMPANHAMENTOS
UPDATE products SET is_addon = 1 WHERE category IN ('Bebidas', 'Sobremesas', 'Acompanhamentos', 'Adicionais');

-- 4. VERIFICAR
SELECT id, name, category, is_addon FROM products WHERE is_addon = 1;
