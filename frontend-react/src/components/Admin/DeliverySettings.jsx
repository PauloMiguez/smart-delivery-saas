import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

const Container = styled.div`
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
    margin: 0 0 20px 0;
    color: #2d3436;
    font-size: 20px;
`;

const Description = styled.p`
    color: #888;
    font-size: 14px;
    margin: -12px 0 20px 0;
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

const Label = styled.label`
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: #555;
    margin-bottom: 6px;
`;

const Select = styled.select`
    width: 100%;
    max-width: 300px;
    padding: 10px 14px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
    color: #2d3436;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
        border-color: #e67e22;
    }
`;

const Input = styled.input`
    width: 100%;
    max-width: 300px;
    padding: 10px 14px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    color: #2d3436;
    outline: none;
    transition: border-color 0.2s;
    background: ${props => props.disabled ? '#f5f5f5' : '#fff'};

    &:focus {
        border-color: #e67e22;
    }
`;

const ZoneRow = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    flex-wrap: wrap;

    &:last-child {
        border-bottom: none;
    }
`;

const ZoneInput = styled.input`
    padding: 8px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 14px;
    flex: 1;
    min-width: 120px;
    color: #2d3436;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
        border-color: #e67e22;
    }
`;

const ZoneValue = styled.input`
    padding: 8px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 14px;
    width: 100px;
    color: #2d3436;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
        border-color: #e67e22;
    }
`;

const AddButton = styled.button`
    padding: 8px 16px;
    background: #27ae60;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;

    &:hover {
        background: #219a52;
    }
`;

const RemoveButton = styled.button`
    padding: 4px 10px;
    background: #e74c3c;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;

    &:hover {
        background: #c0392b;
    }
`;

const ButtonContainer = styled.div`
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
`;

const SaveButton = styled.button`
    padding: 10px 32px;
    background: #e67e22;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    opacity: ${props => props.disabled ? 0.7 : 1};
    transition: background 0.3s;

    &:hover:not(:disabled) {
        background: #d35400;
    }
`;

const InfoBox = styled.div`
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #e67e22;
    margin: 12px 0;
    font-size: 14px;
    color: #555;
`;

const DeliverySettings = () => {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deliveryType, setDeliveryType] = useState('fixa');
    const [deliveryFee, setDeliveryFee] = useState('3.00');
    const [zones, setZones] = useState([]);
    const [newZoneBairro, setNewZoneBairro] = useState('');
    const [newZoneValor, setNewZoneValor] = useState('');

    useEffect(() => {
        if (tenant) {
            loadConfig();
        }
    }, [tenant]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const response = await api.get('/config');
            if (response.data.success) {
                const data = response.data.data;
                setDeliveryType(data.delivery_type || 'fixa');
                setDeliveryFee(data.delivery_fee || '3.00');
                try {
                    setZones(JSON.parse(data.delivery_zones || '[]'));
                } catch {
                    setZones([]);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            showToast('Erro ao carregar configurações', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddZone = () => {
        if (!newZoneBairro.trim() || !newZoneValor.trim()) {
            showToast('Preencha bairro e valor', 'warning');
            return;
        }
        const valor = parseFloat(newZoneValor);
        if (isNaN(valor) || valor < 0) {
            showToast('Valor inválido', 'warning');
            return;
        }
        setZones([...zones, { bairro: newZoneBairro.trim(), valor: valor }]);
        setNewZoneBairro('');
        setNewZoneValor('');
    };

    const handleRemoveZone = (index) => {
        const newZones = zones.filter((_, i) => i !== index);
        setZones(newZones);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = {
                delivery_type: deliveryType,
                delivery_fee: deliveryType === 'fixa' ? deliveryFee : '0',
                delivery_zones: JSON.stringify(zones)
            };

            await api.put('/config', data);
            showToast('✅ Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast('Erro ao salvar configurações', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Container>🔄 Carregando...</Container>;
    }

    return (
        <Container>
            <Title>🚚 Taxa de Entrega</Title>
            <Description>
                Configure como a taxa de entrega será calculada para os pedidos.
            </Description>

            <FormGroup>
                <Label>Tipo de Cálculo</Label>
                <Select 
                    value={deliveryType} 
                    onChange={(e) => setDeliveryType(e.target.value)}
                >
                    <option value="fixa">💰 Fixa</option>
                    <option value="dinamica">📍 Dinâmica (por bairro)</option>
                    <option value="manual">✋ Manual</option>
                </Select>
            </FormGroup>

            {deliveryType === 'fixa' && (
                <FormGroup>
                    <Label>Valor Fixo da Entrega (R$)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="0.00"
                    />
                    <InfoBox>
                        💡 Esta taxa será aplicada a todos os pedidos, independente do endereço.
                    </InfoBox>
                </FormGroup>
            )}

            {deliveryType === 'dinamica' && (
                <FormGroup>
                    <Label>Zonas de Entrega</Label>
                    <InfoBox>
                        📍 Configure os bairros e os valores de entrega para cada um.
                        O sistema identificará o bairro pelo endereço do cliente.
                    </InfoBox>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <ZoneInput
                            placeholder="Nome do bairro"
                            value={newZoneBairro}
                            onChange={(e) => setNewZoneBairro(e.target.value)}
                        />
                        <ZoneValue
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Valor (R$)"
                            value={newZoneValor}
                            onChange={(e) => setNewZoneValor(e.target.value)}
                        />
                        <AddButton onClick={handleAddZone}>+ Adicionar</AddButton>
                    </div>

                    {zones.length === 0 ? (
                        <p style={{ color: '#888', padding: '12px 0' }}>
                            Nenhuma zona configurada. Adicione bairros acima.
                        </p>
                    ) : (
                        zones.map((zone, index) => (
                            <ZoneRow key={index}>
                                <span style={{ fontWeight: '500', minWidth: '120px' }}>
                                    {zone.bairro}
                                </span>
                                <span style={{ color: '#e67e22', fontWeight: '600' }}>
                                    R$ {zone.valor.toFixed(2)}
                                </span>
                                <RemoveButton onClick={() => handleRemoveZone(index)}>
                                    ✕ Remover
                                </RemoveButton>
                            </ZoneRow>
                        ))
                    )}
                </FormGroup>
            )}

            {deliveryType === 'manual' && (
                <InfoBox>
                    ✋ A taxa de entrega será definida manualmente pelo restaurante 
                    após o pedido ser enviado. O cliente verá a mensagem 
                    "Taxa de entrega será informada após o pedido".
                </InfoBox>
            )}

            <ButtonContainer>
                <SaveButton onClick={handleSave} disabled={saving}>
                    {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
                </SaveButton>
            </ButtonContainer>
        </Container>
    );
};

export default DeliverySettings;
