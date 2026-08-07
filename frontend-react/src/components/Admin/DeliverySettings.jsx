import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { tokens } from '../../styles/tokens';

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const Container = styled.div`
  padding: ${tokens.spacing.lg};
  background: ${tokens.colors.surface};
  border-radius: ${tokens.radius.md};
  box-shadow: ${tokens.shadows.sm};
  border: 1px solid ${tokens.colors.border};
  font-family: ${tokens.typography.fontFamily};
`;

const Title = styled.h2`
  margin: 0 0 ${tokens.spacing.lg} 0;
  color: ${tokens.colors.text};
  font-size: ${tokens.typography.fontSize['2xl']};
  font-weight: ${tokens.typography.fontWeight.bold};
  letter-spacing: -0.02em;
`;

const Description = styled.p`
  color: ${tokens.colors.textSecondary};
  font-size: ${tokens.typography.fontSize.sm};
  margin: -${tokens.spacing.sm} 0 ${tokens.spacing.lg} 0;
  line-height: ${tokens.typography.lineHeight.normal};
`;

const FormGroup = styled.div`
  margin-bottom: ${tokens.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-weight: ${tokens.typography.fontWeight.medium};
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.textSecondary};
  margin-bottom: ${tokens.spacing.xs};
`;

const Select = styled.select`
  width: 100%;
  max-width: 300px;
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  border: 1.5px solid ${tokens.colors.border};
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.sm};
  background: ${tokens.colors.surface};
  color: ${tokens.colors.text};
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:hover {
    border-color: ${tokens.colors.borderHover};
  }

  &:focus {
    border-color: ${tokens.colors.accent};
    box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    max-width: 100%;
  }
`;

const Input = styled.input`
  width: 100%;
  max-width: 300px;
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  border: 1.5px solid ${tokens.colors.border};
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.text};
  outline: none;
  transition: all 0.2s ease-in-out;
  background: ${props => props.disabled ? tokens.colors.background : tokens.colors.surface};
  font-family: ${tokens.typography.fontFamily};

  &:hover:not(:disabled) {
    border-color: ${tokens.colors.borderHover};
  }

  &:focus:not(:disabled) {
    border-color: ${tokens.colors.accent};
    box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    max-width: 100%;
  }
`;

const ZoneRow = styled.div`
  display: flex;
  gap: ${tokens.spacing.sm};
  align-items: center;
  padding: ${tokens.spacing.sm} 0;
  border-bottom: 1px solid ${tokens.colors.border};
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }
`;

const ZoneInput = styled.input`
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  border: 1.5px solid ${tokens.colors.border};
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.sm};
  flex: 1;
  min-width: 120px;
  color: ${tokens.colors.text};
  outline: none;
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:focus {
    border-color: ${tokens.colors.accent};
    box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    min-width: 100px;
  }
`;

const ZoneValue = styled.input`
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  border: 1.5px solid ${tokens.colors.border};
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.sm};
  width: 100px;
  color: ${tokens.colors.text};
  outline: none;
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:focus {
    border-color: ${tokens.colors.accent};
    box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    width: 80px;
  }
`;

const AddButton = styled.button`
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  background: ${tokens.colors.success};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  cursor: pointer;
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.medium};
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:hover {
    background: ${tokens.colors.success};
    opacity: 0.85;
    transform: translateY(-1px);
    box-shadow: ${tokens.shadows.sm};
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid ${tokens.colors.accent};
    outline-offset: 2px;
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    width: 100%;
  }
`;

const RemoveButton = styled.button`
  padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  background: ${tokens.colors.error};
  color: ${tokens.colors.surface};
  border: none;
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

const ButtonContainer = styled.div`
  margin-top: ${tokens.spacing.lg};
  display: flex;
  justify-content: flex-end;

  @media (max-width: ${tokens.breakpoints.sm}) {
    justify-content: stretch;
  }
`;

const SaveButton = styled.button`
  padding: ${tokens.spacing.sm} ${tokens.spacing.xl};
  background: ${tokens.colors.accent};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.medium};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
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

  @media (max-width: ${tokens.breakpoints.sm}) {
    width: 100%;
    justify-content: center;
  }
`;

const InfoBox = styled.div`
  padding: ${tokens.spacing.md};
  background: ${tokens.colors.accentLight};
  border-radius: ${tokens.radius.md};
  border-left: 3px solid ${tokens.colors.accent};
  margin: ${tokens.spacing.sm} 0;
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.textSecondary};
  line-height: ${tokens.typography.lineHeight.normal};
`;

const EmptyState = styled.p`
  color: ${tokens.colors.textMuted};
  padding: ${tokens.spacing.md} 0;
  font-size: ${tokens.typography.fontSize.sm};
`;

const ZoneName = styled.span`
  font-weight: ${tokens.typography.fontWeight.medium};
  min-width: 120px;
  color: ${tokens.colors.text};
`;

const ZonePrice = styled.span`
  color: ${tokens.colors.accent};
  font-weight: ${tokens.typography.fontWeight.semibold};
`;

const AddZoneContainer = styled.div`
  display: flex;
  gap: ${tokens.spacing.sm};
  margin-bottom: ${tokens.spacing.sm};
  flex-wrap: wrap;

  @media (max-width: ${tokens.breakpoints.sm}) {
    flex-direction: column;
  }
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
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
            showToast('Configurações salvas com sucesso!', 'success');
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
                <Label htmlFor="deliveryType">Tipo de Cálculo</Label>
                <Select
                    id="deliveryType"
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                >
                    <option value="fixa">Fixa</option>
                    <option value="dinamica">Dinâmica (por bairro)</option>
                    <option value="manual">Manual</option>
                </Select>
            </FormGroup>

            {deliveryType === 'fixa' && (
                <FormGroup>
                    <Label htmlFor="deliveryFee">Valor Fixo da Entrega (R$)</Label>
                    <Input
                        id="deliveryFee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="0.00"
                    />
                    <InfoBox>
                        Esta taxa será aplicada a todos os pedidos, independente do endereço.
                    </InfoBox>
                </FormGroup>
            )}

            {deliveryType === 'dinamica' && (
                <FormGroup>
                    <Label>Zonas de Entrega</Label>
                    <InfoBox>
                        Configure os bairros e os valores de entrega para cada um.
                        O sistema identificará o bairro pelo endereço do cliente.
                    </InfoBox>

                    <AddZoneContainer>
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
                    </AddZoneContainer>

                    {zones.length === 0 ? (
                        <EmptyState>
                            Nenhuma zona configurada. Adicione bairros acima.
                        </EmptyState>
                    ) : (
                        zones.map((zone, index) => (
                            <ZoneRow key={index}>
                                <ZoneName>{zone.bairro}</ZoneName>
                                <ZonePrice>R$ {zone.valor.toFixed(2)}</ZonePrice>
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
                    A taxa de entrega será definida manualmente pelo restaurante
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