import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import styled from 'styled-components';
import { tokens } from '../../styles/tokens';

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const ConfigContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${tokens.spacing.sm} 0;
  font-family: ${tokens.typography.fontFamily};
`;

const ConfigTitle = styled.h2`
  font-size: ${tokens.typography.fontSize['2xl']};
  font-weight: ${tokens.typography.fontWeight.bold};
  margin-bottom: ${tokens.spacing.lg};
  color: ${tokens.colors.text};
  letter-spacing: -0.02em;
`;

const ConfigSection = styled.div`
  background: ${tokens.colors.surface};
  border-radius: ${tokens.radius.md};
  padding: ${tokens.spacing.lg};
  margin-bottom: ${tokens.spacing.lg};
  border: 1px solid ${tokens.colors.border};
  box-shadow: ${tokens.shadows.sm};

  h3 {
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.text};
    margin: 0 0 ${tokens.spacing.md} 0;
    padding-bottom: ${tokens.spacing.sm};
    border-bottom: 1px solid ${tokens.colors.border};
    letter-spacing: -0.01em;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.xs};
  margin-bottom: ${tokens.spacing.md};

  label {
    font-weight: ${tokens.typography.fontWeight.medium};
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
  }

  small {
    color: ${tokens.colors.textMuted};
    font-size: ${tokens.typography.fontSize.xs};
    margin-top: ${tokens.spacing.xs};
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${tokens.spacing.md};

  @media (max-width: ${tokens.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  font-size: ${tokens.typography.fontSize.base};
  font-family: ${tokens.typography.fontFamily};
  color: ${tokens.colors.text};
  background: ${tokens.colors.surface};
  border: 1.5px solid ${tokens.colors.border};
  border-radius: ${tokens.radius.md};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${tokens.colors.placeholder};
  }

  &:hover {
    border-color: ${tokens.colors.borderHover};
  }

  &:focus {
    border-color: ${tokens.colors.accent};
    box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: ${tokens.colors.background};
  }
`;

const ImageUploadArea = styled.div`
  border: 2px dashed ${tokens.colors.border};
  border-radius: ${tokens.radius.md};
  padding: ${tokens.spacing.md};
  text-align: center;
  transition: all 0.2s ease-in-out;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: ${tokens.colors.background};

  &:hover {
    border-color: ${tokens.colors.accent};
  }
`;

const ImageDropArea = styled.div`
  position: relative;
  cursor: pointer;
  width: 100%;
  padding: ${tokens.spacing.lg};

  span {
    color: ${tokens.colors.textMuted};
    font-size: ${tokens.typography.fontSize.sm};
  }

  input[type="file"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${tokens.spacing.sm};
  width: 100%;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: ${tokens.radius.md};
  border: 1px solid ${tokens.colors.border};
`;

const RemoveImageButton = styled.button`
  background: ${tokens.colors.error};
  color: ${tokens.colors.surface};
  border: none;
  padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  border-radius: ${tokens.radius.sm};
  cursor: pointer;
  font-size: ${tokens.typography.fontSize.xs};
  font-weight: ${tokens.typography.fontWeight.medium};
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:hover {
    background: ${tokens.colors.error};
    opacity: 0.85;
  }

  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: ${tokens.spacing.md};
  background: ${tokens.colors.accent};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:hover:not(:disabled) {
    background: ${tokens.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${tokens.shadows.md};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Message = styled.div`
  padding: ${tokens.spacing.md};
  border-radius: ${tokens.radius.md};
  font-weight: ${tokens.typography.fontWeight.medium};
  margin-bottom: ${tokens.spacing.md};
  font-size: ${tokens.typography.fontSize.sm};

  ${props => props.$success && `
    background: ${tokens.colors.successLight};
    color: ${tokens.colors.success};
    border-left: 3px solid ${tokens.colors.success};
  `}

  ${props => props.$error && `
    background: ${tokens.colors.errorLight};
    color: ${tokens.colors.error};
    border-left: 3px solid ${tokens.colors.error};
  `}
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const Config = () => {
    const { tenant } = useTenant();
    const [config, setConfig] = useState({
        store_name: '',
        store_phone: '',
        delivery_fee: '3.00',
        store_address: '',
        banner_image: '',
        logo_image: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const [logoPreview, setLogoPreview] = useState('');

    useEffect(() => {
        if (!tenant) return;
        loadConfig();
    }, [tenant]);

    const loadConfig = async () => {
        try {
            const response = await api.get('/config');
            const data = response.data.data;
            setConfig({
                store_name: data.store_name || '',
                store_phone: data.store_phone || '',
                delivery_fee: data.delivery_fee || '3.00',
                store_address: data.store_address || '',
                banner_image: data.banner_image || '',
                logo_image: data.logo_image || ''
            });
            setBannerPreview(data.banner_image || '');
            setLogoPreview(data.logo_image || '');
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar configurações.' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Imagem muito grande. Máximo 5MB.' });
            return;
        }

        setBannerFile(file);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = (e) => setBannerPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Imagem muito grande. Máximo 5MB.' });
            return;
        }

        setLogoFile(file);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const removeBanner = () => {
        setBannerPreview('');
        setBannerFile(null);
        document.getElementById('banner-upload').value = '';
        setConfig(prev => ({ ...prev, banner_image: '' }));
    };

    const removeLogo = () => {
        setLogoPreview('');
        setLogoFile(null);
        document.getElementById('logo-upload').value = '';
        setConfig(prev => ({ ...prev, logo_image: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            let bannerUrl = config.banner_image;
            let logoUrl = config.logo_image;

            if (bannerFile) {
                const formData = new FormData();
                formData.append('image', bannerFile);
                const response = await api.post('/upload/banner', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (response.data.success) {
                    bannerUrl = response.data.data.url;
                }
            }

            if (logoFile) {
                const formData = new FormData();
                formData.append('image', logoFile);
                const response = await api.post('/upload/logo', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (response.data.success) {
                    logoUrl = response.data.data.url;
                }
            }

            const data = {
                store_name: config.store_name,
                store_phone: config.store_phone,
                delivery_fee: config.delivery_fee,
                store_address: config.store_address,
                banner_image: bannerUrl,
                logo_image: logoUrl
            };

            await api.put('/config', data);
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            loadConfig();
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfigContainer>
            <ConfigTitle>⚙️ Configurações da Loja</ConfigTitle>

            {message && (
                <Message $success={message.type === 'success'} $error={message.type === 'error'}>
                    {message.text}
                </Message>
            )}

            <form onSubmit={handleSubmit}>
                <ConfigSection>
                    <h3>📋 Informações Básicas</h3>

                    <FormGroup>
                        <label htmlFor="store_name">Nome da Loja *</label>
                        <Input
                            id="store_name"
                            type="text"
                            name="store_name"
                            value={config.store_name}
                            onChange={handleChange}
                            placeholder="Ex: Fire Burger"
                            required
                            autoFocus
                        />
                    </FormGroup>

                    <FormGroup>
                        <label htmlFor="store_phone">Telefone (WhatsApp)</label>
                        <Input
                            id="store_phone"
                            type="text"
                            name="store_phone"
                            value={config.store_phone}
                            onChange={handleChange}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                        <small>Número para receber notificações de pedidos.</small>
                    </FormGroup>
                </ConfigSection>

                <ConfigSection>
                    <h3>📍 Endereço</h3>
                    <FormGroup>
                        <label htmlFor="store_address">Endereço completo</label>
                        <Input
                            id="store_address"
                            type="text"
                            name="store_address"
                            value={config.store_address}
                            onChange={handleChange}
                            placeholder="Rua, número, bairro, cidade - UF"
                        />
                    </FormGroup>
                </ConfigSection>

                <ConfigSection>
                    <h3>🖼️ Imagens da Loja</h3>

                    <FormGroup>
                        <label>Banner (topo da página)</label>
                        <ImageUploadArea>
                            {bannerPreview ? (
                                <ImagePreviewContainer>
                                    <ImagePreview src={bannerPreview} alt="Banner" />
                                    <RemoveImageButton type="button" onClick={removeBanner}>
                                        ✕ Remover
                                    </RemoveImageButton>
                                </ImagePreviewContainer>
                            ) : (
                                <ImageDropArea>
                                    <span>📸 Clique para selecionar um banner</span>
                                    <input
                                        id="banner-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerChange}
                                    />
                                </ImageDropArea>
                            )}
                        </ImageUploadArea>
                        <small>Tamanho recomendado: 1200x400px</small>
                    </FormGroup>

                    <FormGroup>
                        <label>Logo (redonda)</label>
                        <ImageUploadArea>
                            {logoPreview ? (
                                <ImagePreviewContainer>
                                    <ImagePreview src={logoPreview} alt="Logo" style={{ maxWidth: 150, maxHeight: 150, borderRadius: '50%' }} />
                                    <RemoveImageButton type="button" onClick={removeLogo}>
                                        ✕ Remover
                                    </RemoveImageButton>
                                </ImagePreviewContainer>
                            ) : (
                                <ImageDropArea>
                                    <span>📸 Clique para selecionar um logo</span>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                </ImageDropArea>
                            )}
                        </ImageUploadArea>
                        <small>Tamanho recomendado: 200x200px</small>
                    </FormGroup>
                </ConfigSection>

                <SaveButton type="submit" disabled={loading}>
                    {loading ? '💾 Salvando...' : '💾 Salvar Configurações'}
                </SaveButton>
            </form>
        </ConfigContainer>
    );
};

export default Config;