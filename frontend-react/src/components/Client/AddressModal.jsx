import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Input, Button } from '../Shared/Container';

// ============================================================
//  ESTILOS DO MODAL
// ============================================================
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    animation: fadeIn 0.3s ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const Modal = styled.div`
    background: #fff;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;

    h2 {
        margin: 0;
        font-size: 20px;
        color: #2d3436;
    }

    button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #888;
        padding: 0 4px;

        &:hover {
            color: #333;
        }
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;

    label {
        font-weight: 600;
        font-size: 14px;
        color: #555;
    }

    small {
        color: #888;
        font-size: 12px;
    }
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const CepStatus = styled.div`
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 4px;
    
    ${props => props.success && `
        background: #eafaf1;
        color: #27ae60;
    `}
    
    ${props => props.error && `
        background: #fdedec;
        color: #e74c3c;
    `}
    
    ${props => props.loading && `
        background: #eaf2f8;
        color: #2980b9;
        animation: pulse 1s infinite;
    `}
    
    ${props => props.info && `
        background: #f0f0f0;
        color: #555;
    `}

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;

const Actions = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;

    button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    .btn-cancel {
        background: #f5f5f5;
        color: #555;

        &:hover {
            background: #eee;
        }
    }

    .btn-save {
        background: #e67e22;
        color: #fff;

        &:hover {
            background: #d35400;
        }
    }
`;

// ============================================================
//  FUNÇÃO PARA BUSCAR CEP
// ============================================================
const buscarCep = async (cep) => {
    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
        return { erro: true, message: 'CEP inválido' };
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            return { erro: true, message: 'CEP não encontrado' };
        }
        
        return { 
            erro: false, 
            data: {
                street: data.logradouro || '',
                neighborhood: data.bairro || '',
                city: data.localidade || '',
                state: data.uf || ''
            }
        };
    } catch (error) {
        return { erro: true, message: 'Erro ao buscar CEP' };
    }
};

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const AddressModal = ({ isOpen, onClose, onSave, initialAddress }) => {
    const [formData, setFormData] = useState({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    });
    const [cep, setCep] = useState('');
    const [cepStatus, setCepStatus] = useState({ message: '', type: 'info' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Preencher com endereço atual
    useEffect(() => {
        if (initialAddress) {
            const parts = initialAddress.split(', ');
            setFormData({
                street: parts[0] || '',
                number: parts[1]?.split(' - ')[0] || '',
                complement: parts[1]?.includes(' - ') ? parts[1].split(' - ').slice(1).join(' - ') : '',
                neighborhood: parts[2] || '',
                city: parts[3]?.split(' - ')[0] || '',
                state: parts[3]?.split(' - ')[1] || ''
            });
        }
        setCep('');
        setCepStatus({ message: 'Digite o CEP para preenchimento automático', type: 'info' });
    }, [initialAddress, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCepChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        let formatted = value;
        if (value.length > 5) {
            formatted = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        setCep(formatted);
        setCepStatus({ message: 'Digite o CEP para preenchimento automático', type: 'info' });
    };

    const handleBuscarCep = async () => {
        const cepClean = cep.replace(/\D/g, '');
        if (cepClean.length !== 8) {
            setCepStatus({ message: 'Digite um CEP válido com 8 dígitos', type: 'error' });
            return;
        }

        setCepStatus({ message: 'Buscando endereço...', type: 'loading' });

        const result = await buscarCep(cep);
        
        if (result.erro) {
            setCepStatus({ message: result.message + '. Preencha manualmente.', type: 'error' });
            return;
        }

        setFormData(prev => ({
            ...prev,
            street: result.data.street || prev.street,
            neighborhood: result.data.neighborhood || prev.neighborhood,
            city: result.data.city || prev.city,
            state: result.data.state || prev.state
        }));

        setCepStatus({ 
            message: '✅ Endereço encontrado! Complete os campos restantes.', 
            type: 'success' 
        });
    };

    const handleSubmit = () => {
        const { street, number, neighborhood, city, state } = formData;
        
        if (!street || !number || !neighborhood || !city || !state) {
            setCepStatus({ message: 'Preencha todos os campos obrigatórios.', type: 'error' });
            return;
        }

        setSaving(true);

        let address = `${street}, ${number}`;
        if (formData.complement) {
            address += ` - ${formData.complement}`;
        }
        address += `, ${neighborhood}, ${city} - ${state}`;

        onSave(address);
        setSaving(false);
        onClose();
    };

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h2>📍 Editar Endereço de Entrega</h2>
                    <button onClick={onClose}>✕</button>
                </ModalHeader>

                {/* CEP OPCIONAL */}
                <FormGroup>
                    <label>CEP (opcional)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Input
                            type="text"
                            placeholder="00000-000"
                            value={cep}
                            onChange={handleCepChange}
                            maxLength="9"
                            style={{ flex: 1 }}
                        />
                        <Button 
                            secondary 
                            onClick={handleBuscarCep}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            Buscar
                        </Button>
                    </div>
                    <CepStatus 
                        success={cepStatus.type === 'success'}
                        error={cepStatus.type === 'error'}
                        loading={cepStatus.type === 'loading'}
                        info={cepStatus.type === 'info'}
                    >
                        {cepStatus.message}
                    </CepStatus>
                </FormGroup>

                {/* Campos do Endereço */}
                <FormGroup>
                    <label>Rua *</label>
                    <Input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Rua"
                    />
                </FormGroup>

                <FormRow>
                    <FormGroup>
                        <label>Número *</label>
                        <Input
                            type="text"
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            placeholder="Número"
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>Complemento</label>
                        <Input
                            type="text"
                            name="complement"
                            value={formData.complement}
                            onChange={handleChange}
                            placeholder="Complemento"
                        />
                    </FormGroup>
                </FormRow>

                <FormGroup>
                    <label>Bairro *</label>
                    <Input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        placeholder="Bairro"
                    />
                </FormGroup>

                <FormRow>
                    <FormGroup>
                        <label>Cidade *</label>
                        <Input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Cidade"
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>UF *</label>
                        <Input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="UF"
                            maxLength="2"
                        />
                    </FormGroup>
                </FormRow>

                <Actions>
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button 
                        className="btn-save" 
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : '💾 Salvar Endereço'}
                    </button>
                </Actions>
            </Modal>
        </Overlay>
    );
};

export default AddressModal;