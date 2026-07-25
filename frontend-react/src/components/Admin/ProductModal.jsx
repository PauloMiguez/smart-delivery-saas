import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, onSave, product, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        active: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                category: product.category || '',
                active: product.active === 1 || product.active === true
            });
            setImagePreview(product.image_url || '');
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                category: categories[0]?.name || '',
                active: true
            });
            setImagePreview('');
            setImageFile(null);
        }
        setError('');
    }, [product, categories, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Formato inválido. Use JPG, PNG, GIF ou WEBP.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Imagem muito grande. Máximo 5MB.');
            return;
        }

        setImageFile(file);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // === FUNÇÃO removeImage (APENAS UMA VEZ!) ===
    const removeImage = () => {
        // Se for edição e tiver imagem, perguntar se quer remover
        if (product?.image_url) {
            if (confirm('Deseja remover a imagem atual?')) {
                setImagePreview('');
                setImageFile(null);
                // Marcar que a imagem deve ser removida
                setFormData(prev => ({ ...prev, _removeImage: true }));
                // Limpar o input file
                const input = document.getElementById('product-image-input');
                if (input) input.value = '';
            }
        } else {
            setImagePreview('');
            setImageFile(null);
            const input = document.getElementById('product-image-input');
            if (input) input.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.name || !formData.price || !formData.category) {
                setError('Preencha todos os campos obrigatórios.');
                setLoading(false);
                return;
            }

            let imageUrl = product?.image_url || '';

            // Verificar se deve remover a imagem
            if (formData._removeImage) {
                imageUrl = null;
            } else if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', imageFile);

                const uploadResponse = await api.post('/upload/product', uploadFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (uploadResponse.data.success) {
                    imageUrl = uploadResponse.data.data.url;
                } else {
                    throw new Error('Erro ao fazer upload da imagem');
                }
            }

            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                image: imageUrl,
                active: formData.active ? 1 : 0
            };

            // Remover o campo _removeImage antes de enviar
            delete productData._removeImage;

            await onSave(productData);
            onClose();
        } catch (error) {
            console.error('❌ Erro ao salvar produto:', error);
            setError(error.message || 'Erro ao salvar produto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{product ? '✏️ Editar Produto' : '➕ Adicionar Produto'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-group">
                        <label>Nome do produto *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: X-Burguer"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Descrição</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Breve descrição do produto"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Preço (R$) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Categoria *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                {categories.length === 0 ? (
                                    <option value="">Nenhuma categoria</option>
                                ) : (
                                    categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Imagem do produto</label>
                        <div className="image-upload-area">
                            {imagePreview ? (
                                <div className="image-preview-container">
                                    <img src={imagePreview} alt="Preview" className="image-preview" />
                                    <button
                                        type="button"
                                        className="btn-remove-image"
                                        onClick={removeImage}
                                    >
                                        ✕ Remover
                                    </button>
                                </div>
                            ) : (
                                <div className="image-drop-area">
                                    <span>📸 Clique para selecionar uma imagem</span>
                                    <input
                                        id="product-image-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            )}
                            <small className="image-hint">Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)</small>
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                            />
                            Produto disponível
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Salvando...' : (product ? 'Atualizar' : 'Adicionar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;