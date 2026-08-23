import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalClose,
    ModalForm,
    FormGroup,
    FormRow,
    Input,
    Select,
    TextArea,
    CheckboxGroup,
    ModalActions,
    Button,
    ErrorMessage,
    ImageUploadArea,
    ImageDropArea,
    ImagePreviewContainer,
    ImagePreview,
    RemoveImageButton
} from '../Shared/Modal.styled';

// ============================================================
//  STYLED COMPONENTS PARA O SELETOR DE ACOMPANHAMENTO
// ============================================================
const AddonToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.$isChecked ? '#e8f5e9' : '#f8f9fa'};
  border-radius: 8px;
  border: 2px solid ${props => props.$isChecked ? '#2e7d32' : '#e0e0e0'};
  transition: all 0.3s ease;
  margin-top: 4px;
`;

const AddonToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$isChecked ? '#2e7d32' : '#555'};
  flex: 1;
  user-select: none;
`;

const AddonToggleInput = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2e7d32;
  flex-shrink: 0;
`;

const AddonToggleDescription = styled.span`
  font-size: 12px;
  color: #888;
  font-weight: 400;
  display: block;
  margin-top: 2px;
`;

const AddonBadge = styled.span`
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
  background: ${props => props.$isAddon ? '#2e7d32' : '#e0e0e0'};
  color: ${props => props.$isAddon ? '#fff' : '#888'};
  margin-left: 8px;
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const ProductModal = ({ isOpen, onClose, onSave, product, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        active: true,
        is_addon: false // ✅ CAMPO DE ACOMPANHAMENTO
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
                active: product.active === 1 || product.active === true,
                is_addon: product.is_addon === 1 || product.is_addon === true // ✅ CARREGAR VALOR
            });
            setImagePreview(product.image_url || '');
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                category: categories[0]?.name || '',
                active: true,
                is_addon: false
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

        if (file.size > 5 * 1024 * 1024) {
            setError('Imagem muito grande. Máximo 5MB.');
            return;
        }

        setImageFile(file);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview('');
        setImageFile(null);
        document.getElementById('product-image-input').value = '';
        setFormData(prev => ({ ...prev, _removeImage: true }));
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
                active: formData.active ? 1 : 0,
                is_addon: formData.is_addon ? 1 : 0 // ✅ ENVIAR PARA O BACKEND
            };

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
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h2>{product ? '✏️ Editar Produto' : '➕ Adicionar Produto'}</h2>
                    <ModalClose onClick={onClose}>✕</ModalClose>
                </ModalHeader>

                <ModalForm onSubmit={handleSubmit}>
                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <FormGroup>
                        <label>Nome do produto *</label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: X-Burguer"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>Descrição</label>
                        <TextArea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Breve descrição do produto"
                            rows="3"
                        />
                    </FormGroup>

                    <FormRow>
                        <FormGroup>
                            <label>Preço (R$) *</label>
                            <Input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Categoria *</label>
                            <Select
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
                            </Select>
                        </FormGroup>
                    </FormRow>

                    {/* ✅ SELETOR DE ACOMPANHAMENTO */}
                    <FormGroup>
                        <label>Configuração do produto</label>
                        <AddonToggleContainer $isChecked={formData.is_addon}>
                            <AddonToggleLabel $isChecked={formData.is_addon}>
                                <AddonToggleInput
                                    type="checkbox"
                                    name="is_addon"
                                    checked={formData.is_addon}
                                    onChange={handleChange}
                                />
                                <div>
                                    <span>
                                        {formData.is_addon ? '✅ É um acompanhamento' : '📦 É um produto principal'}
                                        <AddonBadge $isAddon={formData.is_addon}>
                                            {formData.is_addon ? 'Acompanhamento' : 'Principal'}
                                        </AddonBadge>
                                    </span>
                                    <AddonToggleDescription>
                                        {formData.is_addon 
                                            ? 'Este produto aparecerá como opção de acompanhamento no modal' 
                                            : 'Este produto aparecerá no cardápio principal'}
                                    </AddonToggleDescription>
                                </div>
                            </AddonToggleLabel>
                        </AddonToggleContainer>
                    </FormGroup>

                    <FormGroup>
                        <label>Imagem do produto</label>
                        <ImageUploadArea>
                            {imagePreview ? (
                                <ImagePreviewContainer>
                                    <ImagePreview src={imagePreview} alt="Preview" />
                                    <RemoveImageButton type="button" onClick={removeImage}>
                                        ✕ Remover
                                    </RemoveImageButton>
                                </ImagePreviewContainer>
                            ) : (
                                <ImageDropArea>
                                    <span>📸 Clique para selecionar uma imagem</span>
                                    <input
                                        id="product-image-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </ImageDropArea>
                            )}
                        </ImageUploadArea>
                        <small>Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)</small>
                    </FormGroup>

                    <CheckboxGroup>
                        <input
                            type="checkbox"
                            name="active"
                            checked={formData.active}
                            onChange={handleChange}
                        />
                        <label>Produto disponível</label>
                    </CheckboxGroup>

                    <ModalActions>
                        <Button secondary type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button primary disabled={loading}>
                            {loading ? 'Salvando...' : (product ? 'Atualizar' : 'Adicionar')}
                        </Button>
                    </ModalActions>
                </ModalForm>
            </ModalContent>
        </ModalOverlay>
    );
};

export default ProductModal;