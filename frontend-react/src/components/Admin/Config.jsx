import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import './Config.css';

const Config = () => {
    const { tenant } = useTenant();
    const [config, setConfig] = useState({
        store_name: '',
        store_phone: '',
        delivery_fee: '3.00',
        open_time: '09:00',
        close_time: '22:00',
        is_open: true,
        store_address: '',
        banner_image: '',
        logo_image: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
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
                open_time: data.open_time || '09:00',
                close_time: data.close_time || '22:00',
                is_open: data.is_open === 'true' || data.is_open === true,
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
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Formato inválido. Use JPG, PNG, GIF ou WEBP.' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Imagem muito grande. Máximo 5MB.' });
            return;
        }

        setBannerFile(file);
        setMessage('');

        const reader = new FileReader();
        reader.onload = (e) => setBannerPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Formato inválido. Use JPG, PNG, GIF ou WEBP.' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Imagem muito grande. Máximo 5MB.' });
            return;
        }

        setLogoFile(file);
        setMessage('');

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
        setMessage('');

        try {
            let bannerUrl = config.banner_image;
            let logoUrl = config.logo_image;

            // Upload do banner se houver novo arquivo
            if (bannerFile) {
                const formData = new FormData();
                formData.append('image', bannerFile);
                const response = await api.post('/upload/banner', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                if (response.data.success) {
                    bannerUrl = response.data.data.url;
                }
            }

            // Upload do logo se houver novo arquivo
            if (logoFile) {
                const formData = new FormData();
                formData.append('image', logoFile);
                const response = await api.post('/upload/logo', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
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
                open_time: config.open_time,
                close_time: config.close_time,
                is_open: config.is_open ? 'true' : 'false',
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
        <div className="config-container">
            <h2>⚙️ Configurações da Loja</h2>

            {message && (
                <div className={`config-message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="config-form">
                <div className="config-section">
                    <h3>Informações Básicas</h3>
                    
                    <div className="form-group">
                        <label>Nome da Loja *</label>
                        <input
                            type="text"
                            name="store_name"
                            value={config.store_name}
                            onChange={handleChange}
                            placeholder="Ex: Fire Burger"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Telefone (WhatsApp)</label>
                        <input
                            type="text"
                            name="store_phone"
                            value={config.store_phone}
                            onChange={handleChange}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                        <small>Número para receber notificações de pedidos.</small>
                    </div>

                    <div className="form-group">
                        <label>Taxa de Entrega (R$)</label>
                        <input
                            type="number"
                            name="delivery_fee"
                            value={config.delivery_fee}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Horário de Abertura</label>
                            <input
                                type="time"
                                name="open_time"
                                value={config.open_time}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Horário de Fechamento</label>
                            <input
                                type="time"
                                name="close_time"
                                value={config.close_time}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_open"
                                checked={config.is_open}
                                onChange={handleChange}
                            />
                            Loja aberta para pedidos
                        </label>
                    </div>
                </div>

                <div className="config-section">
                    <h3>📍 Endereço</h3>
                    <div className="form-group">
                        <label>Endereço completo</label>
                        <input
                            type="text"
                            name="store_address"
                            value={config.store_address}
                            onChange={handleChange}
                            placeholder="Rua, número, bairro, cidade - UF"
                        />
                    </div>
                </div>

                <div className="config-section">
                    <h3>🖼️ Imagens da Loja</h3>
                    
                    <div className="form-group">
                        <label>Banner (topo da página)</label>
                        <div className="image-upload-area">
                            {bannerPreview ? (
                                <div className="image-preview-container">
                                    <img src={bannerPreview} alt="Banner" className="image-preview" />
                                    <button
                                        type="button"
                                        className="btn-remove-image"
                                        onClick={removeBanner}
                                    >
                                        ✕ Remover
                                    </button>
                                </div>
                            ) : (
                                <div className="image-drop-area">
                                    <span>📸 Clique para selecionar um banner</span>
                                    <input
                                        id="banner-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerChange}
                                    />
                                </div>
                            )}
                            <small className="image-hint">Tamanho recomendado: 1200x400px</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Logo (redonda)</label>
                        <div className="image-upload-area">
                            {logoPreview ? (
                                <div className="image-preview-container">
                                    <img src={logoPreview} alt="Logo" className="image-preview logo-preview" />
                                    <button
                                        type="button"
                                        className="btn-remove-image"
                                        onClick={removeLogo}
                                    >
                                        ✕ Remover
                                    </button>
                                </div>
                            ) : (
                                <div className="image-drop-area">
                                    <span>📸 Clique para selecionar um logo</span>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                </div>
                            )}
                            <small className="image-hint">Tamanho recomendado: 200x200px</small>
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn-save-config" disabled={loading}>
                    {loading ? 'Salvando...' : '💾 Salvar Configurações'}
                </button>
            </form>
        </div>
    );
};

export default Config;