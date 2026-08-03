// frontend-react/src/components/Admin/OperatingHours.jsx
import React, { useState, useEffect, useContext } from 'react';
import { TenantContext } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import styled from 'styled-components';

const Container = styled.div`
    padding: 20px;
    max-width: 1100px;
    margin: 0 auto;
`;

const Title = styled.h2`
    color: #2d3436;
    margin-bottom: 8px;
    font-size: 24px;
`;

const Subtitle = styled.p`
    color: #888;
    margin-bottom: 24px;
    font-size: 14px;
`;

const StoreStatusCard = styled.div`
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e0e0e0;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
`;

const StoreStatusHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
`;

const StoreStatusInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const StoreStatusIndicator = styled.span`
    font-size: 24px;
`;

const StoreStatusTitle = styled.strong`
    font-size: 18px;
    color: #2d3436;
`;

const StoreStatusDescription = styled.p`
    font-size: 14px;
    color: #888;
    margin-top: 4px;
`;

const StatusButton = styled.button`
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    background: ${props => props.isOpen ? '#e74c3c' : '#27ae60'};
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    opacity: ${props => props.disabled ? 0.6 : 1};
    transition: all 0.3s;
    min-width: 120px;

    &:hover {
        transform: ${props => props.disabled ? 'none' : 'scale(1.02)'};
        background: ${props => props.isOpen ? '#c0392b' : '#219a52'};
    }
`;

const StatusInfoBox = styled.div`
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    background: ${props => props.isOpen ? '#eafaf1' : '#fdedec'};
    color: ${props => props.isOpen ? '#27ae60' : '#e74c3c'};
`;

const TableWrapper = styled.div`
    overflow-x: auto;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
`;

const Th = styled.th`
    padding: 12px 10px;
    background: #f8f9fa;
    text-align: left;
    font-size: 13px;
    color: #555;
    font-weight: 600;
    border-bottom: 2px solid #e9ecef;
`;

const Td = styled.td`
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
`;

const Row = styled.tr`
    &:hover {
        background: #f8f9fa;
    }
`;

const Checkbox = styled.input`
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #e67e22;
`;

const TimeInput = styled.input`
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    width: 100px;
    background: ${props => props.disabled ? '#f5f5f5' : '#fff'};
    cursor: ${props => props.disabled ? 'not-allowed' : 'text'};

    &:focus {
        border-color: #e67e22;
        outline: none;
    }
`;

const NumberInput = styled.input`
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    width: 60px;
    text-align: center;
    background: ${props => props.disabled ? '#f5f5f5' : '#fff'};
    cursor: ${props => props.disabled ? 'not-allowed' : 'text'};

    &:focus {
        border-color: #e67e22;
        outline: none;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 20px;
    justify-content: flex-end;
`;

const CancelButton = styled.button`
    padding: 10px 24px;
    border-radius: 8px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    color: #555;
    transition: all 0.2s;

    &:hover {
        background: #f8f9fa;
        border-color: #bbb;
    }
`;

const SaveButton = styled.button`
    padding: 10px 24px;
    border-radius: 8px;
    border: none;
    background: #e67e22;
    color: #fff;
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    font-size: 14px;
    font-weight: 600;
    opacity: ${props => props.disabled ? 0.7 : 1};
    transition: all 0.2s;

    &:hover {
        background: ${props => props.disabled ? '#e67e22' : '#d35400'};
        transform: ${props => props.disabled ? 'none' : 'scale(1.02)'};
    }
`;

const DicaBox = styled.div`
    margin-top: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    font-size: 14px;
    color: #888;
`;

const LoadingContainer = styled.div`
    text-align: center;
    padding: 40px;
    color: #888;
`;

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const OperatingHours = () => {
    const { tenant } = useContext(TenantContext);
    const { showToast } = useToast();
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);

    useEffect(() => {
        if (tenant) {
            loadHours();
            loadStoreStatus();
        }
    }, [tenant]);

    const loadStoreStatus = async () => {
        try {
            const response = await api.get('/config');
            if (response.data.success) {
                const config = response.data.data;
                setIsOpen(config.is_open === 'true' || config.is_open === true);
            }
        } catch (error) {
            console.error('Erro ao carregar status da loja:', error);
        }
    };

    const toggleStoreStatus = async () => {
        try {
            setSavingConfig(true);
            const newStatus = !isOpen;
            await api.put('/config', { is_open: newStatus ? 'true' : 'false' });
            setIsOpen(newStatus);
            showToast(
                newStatus ? '🟢 Loja aberta para pedidos!' : '🔴 Loja fechada para pedidos!',
                'success'
            );
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            showToast('Erro ao atualizar status da loja', 'error');
        } finally {
            setSavingConfig(false);
        }
    };

    const loadHours = async () => {
        try {
            setLoading(true);
            const response = await api.get('/operating-hours');
            if (response.data.success) {
                setHours(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar horários:', error);
            showToast('Erro ao carregar horários', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index, field, value) => {
        const updated = [...hours];
        updated[index] = { ...updated[index], [field]: value };
        setHours(updated);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put('/operating-hours', { hours });
            showToast('Horários salvos com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast('Erro ao salvar horários', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        loadHours();
        showToast('Horários recarregados', 'info');
    };

    if (loading) {
        return (
            <Container>
                <LoadingContainer>
                    <span>⏳ Carregando horários de funcionamento...</span>
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <Title>🕐 Horários de Funcionamento</Title>
            <Subtitle>
                Configure os dias e horários que o restaurante funciona.
                Os clientes só poderão fazer pedidos dentro do horário de funcionamento.
            </Subtitle>

            {/* ============================================================
                CARD DE STATUS DA LOJA
                ============================================================ */}
            <StoreStatusCard>
                <StoreStatusHeader>
                    <div>
                        <StoreStatusInfo>
                            <StoreStatusIndicator>{isOpen ? '🟢' : '🔴'}</StoreStatusIndicator>
                            <StoreStatusTitle>
                                Loja {isOpen ? 'Aberta' : 'Fechada'} para Pedidos
                            </StoreStatusTitle>
                        </StoreStatusInfo>
                        <StoreStatusDescription>
                            {isOpen 
                                ? 'A loja está aceitando pedidos. O status segue os horários configurados abaixo.'
                                : 'A loja está fechada. Nenhum pedido será aceito, independente do horário configurado.'}
                        </StoreStatusDescription>
                    </div>
                    <StatusButton 
                        isOpen={isOpen}
                        onClick={toggleStoreStatus}
                        disabled={savingConfig}
                    >
                        {savingConfig ? 'Salvando...' : isOpen ? '🔴 Fechar Loja' : '🟢 Abrir Loja'}
                    </StatusButton>
                </StoreStatusHeader>
                <StatusInfoBox isOpen={isOpen}>
                    {isOpen 
                        ? '✅ A loja está aberta. O status segue os horários configurados abaixo.' 
                        : '❌ A loja está fechada. Nenhum pedido será aceito até que seja reaberta.'}
                </StatusInfoBox>
            </StoreStatusCard>

            {/* ============================================================
                TABELA DE HORÁRIOS
                ============================================================ */}
            <TableWrapper>
                <Table>
                    <thead>
                        <tr>
                            <Th>Dia</Th>
                            <Th style={{ textAlign: 'center' }}>Aberto</Th>
                            <Th>Abertura</Th>
                            <Th>Fechamento</Th>
                            <Th>Início Almoço</Th>
                            <Th>Fim Almoço</Th>
                            <Th style={{ textAlign: 'center' }}>Max Pedidos</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {hours.map((h, index) => (
                            <Row key={h.day_of_week}>
                                <Td style={{ fontWeight: '600' }}>
                                    {DAYS[h.day_of_week]}
                                </Td>
                                <Td style={{ textAlign: 'center' }}>
                                    <Checkbox
                                        type="checkbox"
                                        checked={h.is_open === 1}
                                        onChange={(e) => handleChange(index, 'is_open', e.target.checked ? 1 : 0)}
                                    />
                                </Td>
                                <Td>
                                    <TimeInput
                                        type="time"
                                        value={h.open_time?.substring(0, 5) || '09:00'}
                                        onChange={(e) => handleChange(index, 'open_time', e.target.value)}
                                        disabled={!h.is_open}
                                    />
                                </Td>
                                <Td>
                                    <TimeInput
                                        type="time"
                                        value={h.close_time?.substring(0, 5) || '22:00'}
                                        onChange={(e) => handleChange(index, 'close_time', e.target.value)}
                                        disabled={!h.is_open}
                                    />
                                </Td>
                                <Td>
                                    <TimeInput
                                        type="time"
                                        value={h.break_start?.substring(0, 5) || ''}
                                        onChange={(e) => handleChange(index, 'break_start', e.target.value || null)}
                                        disabled={!h.is_open}
                                    />
                                </Td>
                                <Td>
                                    <TimeInput
                                        type="time"
                                        value={h.break_end?.substring(0, 5) || ''}
                                        onChange={(e) => handleChange(index, 'break_end', e.target.value || null)}
                                        disabled={!h.is_open}
                                    />
                                </Td>
                                <Td style={{ textAlign: 'center' }}>
                                    <NumberInput
                                        type="number"
                                        value={h.max_orders_per_day || 5}
                                        onChange={(e) => handleChange(index, 'max_orders_per_day', parseInt(e.target.value) || 5)}
                                        min="1"
                                        max="20"
                                        disabled={!h.is_open}
                                    />
                                </Td>
                            </Row>
                        ))}
                    </tbody>
                </Table>
            </TableWrapper>

            {/* ============================================================
                BOTÕES
                ============================================================ */}
            <ButtonGroup>
                <CancelButton onClick={handleReset} disabled={saving}>
                    🔄 Resetar
                </CancelButton>
                <SaveButton onClick={handleSave} disabled={saving}>
                    {saving ? '💾 Salvando...' : '💾 Salvar Horários'}
                </SaveButton>
            </ButtonGroup>

            {/* ============================================================
                DICA
                ============================================================ */}
            <DicaBox>
                💡 <strong>Dica:</strong> Os clientes só poderão agendar pedidos para os próximos 2 dias,
                dentro dos horários configurados acima. Cada horário permite no máximo 
                <strong> {hours[0]?.max_orders_per_day || 5} </strong> pedidos simultâneos.
                <br />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                    ⏰ Para abrir/fechar a loja rapidamente, use o switch "Loja Aberta" no topo da página.
                </span>
            </DicaBox>
        </Container>
    );
};

export default OperatingHours;