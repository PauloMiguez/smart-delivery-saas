import React, { useState, useEffect } from 'react';
import './CategoryModal.css';

const CategoryModal = ({ isOpen, onClose, onSave, category }) => {
    const [formData, setFormData] = useState({
        name: '',
        display_order: 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                display_order: category.display_order || 1
            });
        } else {
            setFormData({
                name: '',
                display_order: 1
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