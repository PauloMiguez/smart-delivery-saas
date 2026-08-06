import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import styled from 'styled-components';
import { tokens } from '../../styles/tokens';

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const Container = styled.div`
  padding: ${tokens.spacing.lg};
  background: ${tokens.colors.surface};
  border-radius: ${tokens.radius.md};
  border: 1px solid ${tokens.colors.border};
  box-shadow: ${tokens.shadows.sm};
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

const DayRow = styled.div`
  display: flex;
  align-items: center;
  padding: ${tokens.spacing.sm} 0;
  border-bottom: 1px solid ${tokens.colors.border};
  gap: ${tokens.spacing.sm};
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${tokens.breakpoints.md}) {
    gap: ${tokens.spacing.xs};
    padding: ${tokens.spacing.xs} 0;
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    gap: ${tokens.spacing.xs};
    padding: ${tokens.spacing.xs} 0;
  }
`;

const DayName = styled.div`
  width: 120px;
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  font-size: ${tokens.typography.fontSize.sm};

  @media (max-width: ${tokens.breakpoints.md}) {
    width: 100px;
    font-size: ${tokens.typography.fontSize.xs};
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    width: 80px;
    font-size: ${tokens.typography.fontSize.xs};
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;

  @media (max-width: ${tokens.breakpoints.sm}) {
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
  background: ${tokens.colors.border};
  transition: all 0.3s ease-in-out;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: ${tokens.colors.surface};
    transition: all 0.3s ease-in-out;
    border-radius: 50%;
    box-shadow: ${tokens.shadows.sm};
  }

  ${props => props.$checked && `
    background: ${tokens.colors.success};
    &:before {
      transform: translateX(24px);
    }
  `}

  @media (max-width: ${tokens.breakpoints.sm}) {
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
  padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  border: 1.5px solid ${tokens.colors.border};
  border-radius: ${tokens.radius.sm};
  font-size: ${tokens.typography.fontSize.sm};
  background: ${props => props.disabled ? tokens.colors.background : tokens.colors.surface};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  width: 110px;
  color: ${tokens.colors.text};
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:focus {
    border-color: ${tokens.colors.accent};
    box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
    outline: none;
  }

  @media (max-width: ${tokens.breakpoints.md}) {
    width: 90px;
    font-size: ${tokens.typography.fontSize.xs};
    padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  }

  @media (max-width: ${tokens.breakpoints.sm}) {
    width: 70px;
    font-size: ${tokens.typography.fontSize.xs};
    padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  }
`;

const TimeSeparator = styled.span`
  color: ${tokens.colors.textMuted};
  font-size: ${tokens.typography.fontSize.sm};
  flex-shrink: 0;

  @media (max-width: ${tokens.breakpoints.sm}) {
    font-size: ${tokens.typography.fontSize.xs};
  }
`;

const StatusBadge = styled.span`
  font-size: ${tokens.typography.fontSize.xs};
  padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  border-radius: ${tokens.radius.full};
  background: ${props => props.$open ? tokens.colors.successLight : tokens.colors.errorLight};
  color: ${props => props.$open ? tokens.colors.success : tokens.colors.error};
  flex-shrink: 0;
  font-weight: ${tokens.typography.fontWeight.medium};

  @media (max-width: ${tokens.breakpoints.sm}) {
    font-size: ${tokens.typography.fontSize.xs};
    padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  }
`;

const ButtonContainer = styled.div`
  margin-top: ${tokens.spacing.lg};
  display: flex;
  justify-content: flex-end;
  gap: ${tokens.spacing.sm};

  @media (max-width: ${tokens.breakpoints.sm}) {
    flex-direction: column;
    gap: ${tokens.spacing.xs};
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
    padding: ${tokens.spacing.md};
    font-size: ${tokens.typography.fontSize.sm};
    width: 100%;
  }
`;

const ResetButton = styled.button`
  padding: ${tokens.spacing.sm} ${tokens.spacing.xl};
  background: ${tokens.colors.textMuted};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};

  &:hover {
    background: ${tokens.colors.textSecondary};
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
    padding: ${tokens.spacing.md};
    font-size: ${tokens.typography.fontSize.sm};
    width: 100%;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: ${tokens.spacing.xl};
  color: ${tokens.colors.textMuted};
  font-size: ${tokens.typography.fontSize.sm};
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
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
        if (!confirm('Tem certeza que deseja resetar os horários para o padrão?')) {
            return;
        }
        await loadHours();
        showToast('Horários resetados para o padrão', 'info');
    };

    if (loading) {
        return (
            <Container>
                <LoadingContainer>🔄 Carregando horários...</LoadingContainer>
            </Container>
        );
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