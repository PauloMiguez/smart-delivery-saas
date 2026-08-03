import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import styled from 'styled-components';
import { Button, Input, Card } from '../Shared/Container';

const ConfigContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
`;

const ConfigTitle = styled.h2`
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.text};
`;

const ConfigSection = styled(Card)`
    margin-bottom: 20px;
    padding: 20px;

    h3 {
        font-size: 18px;
        font-weight: 600;
        color: ${props => props.theme.colors.text};
        margin: 0 0 16px 0;
        padding-bottom: 12px;
        border-bottom: 1px solid ${props => props.theme.colors.border};
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;

    label {
        font-weight: 600;
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
    }

    small {
        color: ${props => props.theme.colors.textMuted};
        font-size: 12px;
    }
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const ImageUploadArea = styled.div`
    border: 2px dashed ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    padding: 16px;
    text-align: center;
    transition: border-color 0.3s;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &:hover {
        border-color: ${props => props.theme.colors.primary};
    }
`;

const ImageDropArea = styled.div`
    position: relative;
    cursor: pointer;
    width: 100%;
    padding: 20px;

    span {
        color: ${props => props.theme.colors.textMuted};
        font-size: 14px;
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
    gap: 8px;
    width: 100%;
`;

const ImagePreview = styled.img`
    max-width: 100%;
    max-height: 180px;
    object-fit: contain;
    border-radius: ${props => props.theme.borderRadius.md};
    border: 1px solid ${props => props.theme.colors.border};
`;

const RemoveImageButton = styled.button`
    background: ${props => props.theme.colors.danger};
    color: #fff;
    border: none;
    padding: 4px 12px;
    border-radius: ${props => props.theme.borderRadius.sm};
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;

    &:hover {
        background: #c0392b;
    }
`;

const SaveButton = styled(Button)`
    padding: 14px 28px;
    font-size: 16px;
    width: 100%;
`;

const Message = styled.div`
    padding: 12px 16px;
    border-radius: ${props => props.theme.borderRadius.md};
    font-weight: 500;
    margin-bottom: 16px;

    ${props => props.success && `
        background: #eafaf1;
        color: ${props.theme.colors.success};
        border-left: 3px solid ${props.theme.colors.success};
    `}

    ${props => props.error && `
        background: #fdedec;
        color: ${props.theme.colors.danger};
        border-left: 3px solid ${props.theme.colors.danger};
    `}
`;

// ============================================================
//  COMPONENTE PRINCIPAL - CORRIGIDO
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
        // ❌ is_open REMOVIDO - agora gerenciado na aba Horários
        // ❌ open_time REMOVIDO - agora gerenciado na aba Horários
        // ❌ close_time REMOVIDO - agora gerenciado na aba Horários
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
                // ❌ open_time, close_time, is_open NÃO são mais carregados
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

            // ============================================================
            //  DADOS A SEREM SALVOS (sem is_open, open_time, close_time)
            // ============================================================
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
                <Message success={message.type === 'success'} error={message.type === 'error'}>
                    {message.text}
                </Message>
            )}

            <form onSubmit={handleSubmit}>
                <ConfigSection>
                    <h3>Informações Básicas</h3>
                    
                    <FormGroup>
                        <label>Nome da Loja *</label>
                        <Input
                            type="text"
                            name="store_name"
                            value={config.store_name}
                            onChange={handleChange}
                            placeholder="Ex: Fire Burger"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>Telefone (WhatsApp)</label>
                        <Input
                            type="text"
                            name="store_phone"
                            value={config.store_phone}
                            onChange={handleChange}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                        <small>Número para receber notificações de pedidos.</small>
                    </FormGroup>

                    <FormGroup>
                        <label>Taxa de Entrega (R$)</label>
                        <Input
                            type="number"
                            name="delivery_fee"
                            value={config.delivery_fee}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                        />
                    </FormGroup>

                    {/* ============================================================
                        ❌ CAMPOS REMOVIDOS: open_time, close_time, is_open
                        Agora gerenciados na aba "Horários" do admin
                        ============================================================ */}
                </ConfigSection>

                <ConfigSection>
                    <h3>📍 Endereço</h3>
                    <FormGroup>
                        <label>Endereço completo</label>
                        <Input
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

                <SaveButton primary disabled={loading}>
                    {loading ? 'Salvando...' : '💾 Salvar Configurações'}
                </SaveButton>
            </form>
        </ConfigContainer>
    );
};

export default Config;