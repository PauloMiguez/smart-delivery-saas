import React, { useState, useEffect } from 'react';
import './CategoryModal.css';

const CategoryModal = ({ isOpen, onClose, onSave, category }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        display_order: 1,
        category_type: 'principal' // ✅ NOVO CAMPO
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                display_order: category.display_order || 1,
                category_type: category.category_type || 'principal' // ✅ CARREGAR VALOR
            });
        } else {
            setFormData({
                name: '',
                description: '',
                display_order: 1,
                category_type: 'principal'
            });
        }
        setError('');
    }, [category, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'display_order' ? parseInt(value) || 1 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.name.trim()) {
                setError('O nome da categoria é obrigatório.');
                setLoading(false);
                return;
            }

            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('❌ Erro ao salvar categoria:', error);
            setError(error.message || 'Erro ao salvar categoria. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-category" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{category ? '✏️ Editar Categoria' : '➕ Nova Categoria'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-group">
                        <label>Nome da categoria *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: Hambúrgueres, Bebidas"
                            required
                            autoFocus
                        />
                    </div>

                    {/* ✅ SELETOR DE TIPO DE CATEGORIA */}
                    <div className="form-group">
                        <label>Tipo de categoria</label>
                        <select
                            name="category_type"
                            value={formData.category_type}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="principal">📦 Produto Principal</option>
                            <option value="independente">🍟 Acompanhamento (aparece no cardápio)</option>
                            <option value="dependente">➕ Adicional Dependente (só via acompanhamentos)</option>
                        </select>
                        <small className="field-hint">
                            {formData.category_type === 'principal' && 'Produtos que aparecem no cardápio e podem ter acompanhamentos'}
                            {formData.category_type === 'independente' && 'Produtos que aparecem no cardápio e podem ser comprados sozinhos'}
                            {formData.category_type === 'dependente' && 'Produtos que NÃO aparecem no cardápio, só como acompanhamento'}
                        </small>
                    </div>

                    {/* ✅ CAMPO DE DESCRIÇÃO */}
                    <div className="form-group">
                        <label>Descrição da categoria</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Ex: Refrigerantes, sucos, águas e mais"
                            rows="2"
                            className="form-textarea"
                        />
                        <small className="field-hint">
                            Esta descrição aparecerá no modal de acompanhamentos.
                            {formData.description && (
                                <span className="hint-preview">
                                    {' '}Preview: "{formData.description}"
                                </span>
                            )}
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Ordem de exibição</label>
                        <input
                            type="number"
                            name="display_order"
                            value={formData.display_order}
                            onChange={handleChange}
                            placeholder="1"
                            min="1"
                        />
                        <small className="field-hint">Menor número aparece primeiro no cardápio.</small>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Salvando...' : (category ? 'Atualizar' : 'Adicionar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;