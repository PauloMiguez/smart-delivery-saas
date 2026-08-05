import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import styled from 'styled-components';

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

const DayRow = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
    gap: 12px;
    flex-wrap: wrap;

    &:last-child {
        border-bottom: none;
    }

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 768px) {
        gap: 8px;
        padding: 10px 0;
    }

    @media (max-width: 480px) {
        gap: 6px;
        padding: 8px 0;
    }
`;

const DayName = styled.div`
    width: 120px;
    font-weight: 600;
    color: #2d3436;
    font-size: 14px;

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 768px) {
        width: 100px;
        font-size: 13px;
    }

    @media (max-width: 480px) {
        width: 80px;
        font-size: 12px;
    }
`;

const Toggle = styled.label`
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
    cursor: pointer;
    flex-shrink: 0;

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 480px) {
        width: 40px;
        height: 20px;
    }
`;

const ToggleInput = styled.input`
    opacity: 0;
    width: 0;
    height: 0;
`;

const ToggleSlider = styled.span`
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ccc;
    transition: 0.3s;
    border-radius: 24px;

    &:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background: white;
        transition: 0.3s;
        border-radius: 50%;
    }

    ${props => props.$checked && `
        background: #27ae60;
        &:before {
            transform: translateX(24px);
        }
    `}

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 480px) {
        border-radius: 20px;
        &:before {
            height: 14px;
            width: 14px;
            left: 3px;
            bottom: 3px;
        }
        ${props => props.$checked && `
            &:before {
                transform: translateX(20px);
            }
        `}
    }
`;

const TimeInput = styled.input`
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: ${props => props.disabled ? '#f5f5f5' : '#fff'};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    width: 110px;
    color: #2d3436; /* ✅ CORRIGIDO: Cor escura para visibilidade */

    &:focus {
        border-color: #e67e22;
        outline: none;
    }

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 768px) {
        width: 90px;
        font-size: 13px;
        padding: 4px 8px;
    }

    @media (max-width: 480px) {
        width: 70px;
        font-size: 12px;
        padding: 3px 6px;
    }
`;

const TimeSeparator = styled.span`
    color: #888;
    font-size: 14px;
    flex-shrink: 0;

    @media (max-width: 480px) {
        font-size: 12px;
    }
`;

const StatusBadge = styled.span`
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    background: ${props => props.$open ? '#d4edda' : '#f8d7da'};
    color: ${props => props.$open ? '#155724' : '#721c24'};
    flex-shrink: 0;

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 480px) {
        font-size: 10px;
        padding: 2px 8px;
    }
`;

const ButtonContainer = styled.div`
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 480px) {
        flex-direction: column;
        gap: 8px;
    }
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

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 480px) {
        padding: 12px;
        font-size: 14px;
        width: 100%;
    }
`;

const ResetButton = styled.button`
    padding: 10px 32px;
    background: #95a5a6;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
        background: #7f8c8d;
    }

    /* ✅ RESPONSIVIDADE: Mobile */
    @media (max-width: 480px) {
        padding: 12px;
        font-size: 14px;
        width: 100%;
    }
`;

const OperatingHours = () => {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const dayNames = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    useEffect(() => {
        if (tenant) {
            loadHours();
        }
    }, [tenant]);

    const loadHours = async () => {
        setLoading(true);
        try {
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

    const handleToggle = (index) => {
        const newHours = [...hours];
        newHours[index].is_open = !newHours[index].is_open;
        setHours(newHours);
    };

    const handleTimeChange = (index, field, value) => {
        const newHours = [...hours];
        newHours[index][field] = value;
        setHours(newHours);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const hoursToSend = hours.map(h => ({
                day_of_week: h.day_of_week,
                is_open: h.is_open ? 1 : 0,
                open_time: h.open_time,
                close_time: h.close_time,
                break_start: h.break_start || null,
                break_end: h.break_end || null
            }));

            await api.put('/operating-hours', { hours: hoursToSend });
            showToast('✅ Horários salvos com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar horários:', error);
            showToast('Erro ao salvar horários', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Tem certeza que deseja resetar os horários para o padrão?')) return;
        await loadHours();
        showToast('Horários resetados para o padrão', 'info');
    };

    if (loading) {
        return <Container>🔄 Carregando horários...</Container>;
    }

    return (
        <Container>
            <Title>🕐 Horários de Funcionamento</Title>
            <Description>
                Configure os horários de funcionamento da loja para cada dia da semana.
                O status "Aberto/Fechado" será atualizado automaticamente no cardápio.
            </Description>
            
            {hours.map((day, index) => {
                const isOpen = day.is_open === 1 || day.is_open === true;
                return (
                    <DayRow key={day.id || index}>
                        <DayName>{dayNames[day.day_of_week]}</DayName>
                        
                        <Toggle>
                            <ToggleInput
                                type="checkbox"
                                checked={isOpen}
                                onChange={() => handleToggle(index)}
                            />
                            <ToggleSlider $checked={isOpen} />
                        </Toggle>

                        <TimeInput
                            type="time"
                            value={day.open_time?.substring(0, 5) || '09:00'}
                            onChange={(e) => handleTimeChange(index, 'open_time', e.target.value)}
                            disabled={!isOpen}
                        />

                        <TimeSeparator>às</TimeSeparator>

                        <TimeInput
                            type="time"
                            value={day.close_time?.substring(0, 5) || '22:00'}
                            onChange={(e) => handleTimeChange(index, 'close_time', e.target.value)}
                            disabled={!isOpen}
                        />

                        <StatusBadge $open={isOpen}>
                            {isOpen ? '🟢 Aberto' : '🔴 Fechado'}
                        </StatusBadge>
                    </DayRow>
                );
            })}

            <ButtonContainer>
                <ResetButton onClick={handleReset}>
                    ↩️ Resetar
                </ResetButton>
                <SaveButton onClick={handleSave} disabled={saving}>
                    {saving ? '💾 Salvando...' : '💾 Salvar Horários'}
                </SaveButton>
            </ButtonContainer>
        </Container>
    );
};

export default OperatingHours;
