// frontend-react/src/components/Client/DateTimePicker.jsx
import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { TenantContext } from '../../contexts/TenantContext';
import { api } from '../../services/api';

const Container = styled.div`
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e0e0e0;
    margin: 16px 0;
`;

const Title = styled.h3`
    font-size: 16px;
    color: #2d3436;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Subtitle = styled.p`
    font-size: 14px;
    color: #888;
    margin: 0 0 16px 0;
`;

const DaysContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
`;

const DayButton = styled.button`
    padding: 10px 16px;
    border: 2px solid ${props => props.selected ? '#e67e22' : '#e0e0e0'};
    border-radius: 8px;
    background: ${props => props.selected ? '#fdf0e6' : '#fff'};
    color: ${props => props.selected ? '#e67e22' : '#555'};
    cursor: pointer;
    font-size: 13px;
    min-width: 80px;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        border-color: ${props => props.selected ? '#e67e22' : '#bbb'};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const DayLabel = styled.div`
    font-weight: 600;
    font-size: 14px;
`;

const DayDate = styled.div`
    font-size: 12px;
    color: #888;
`;

const LoadingContainer = styled.div`
    text-align: center;
    padding: 20px;
    color: #888;
`;

const ErrorMessage = styled.div`
    color: #e74c3c;
    font-size: 14px;
    padding: 8px 12px;
    background: #fde8e8;
    border-radius: 8px;
    margin-top: 8px;
`;

const SelectWrapper = styled.div`
    position: relative;
    width: 100%;
    margin-top: 8px;
`;

const StyledSelect = styled.select`
    width: 100%;
    padding: 14px 16px;
    font-size: 16px;
    border: 2px solid ${props => props.hasValue ? '#e67e22' : '#e0e0e0'};
    border-radius: 8px;
    background-color: #fff;
    color: #2d3436;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    transition: all 0.2s;
    
    &:focus {
        border-color: #e67e22;
        box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
    }
    
    &:hover {
        border-color: #e67e22;
    }

    option {
        padding: 8px;
        font-size: 14px;
    }
`;

const SelectArrow = styled.div`
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #888;
    font-size: 18px;
`;

const SelectedInfo = styled.div`
    margin-top: 12px;
    padding: 12px;
    background: #f0faf4;
    border-radius: 8px;
    border: 2px solid #2ecc71;
    display: ${props => props.visible ? 'flex' : 'none'};
    align-items: center;
    gap: 8px;
    color: #27ae60;
    font-size: 14px;
`;

const InfoText = styled.div`
    margin-top: 12px;
    font-size: 13px;
    color: #888;
    text-align: center;
`;

const DateTimePicker = ({ onSelect, selectedDateTime, isOpen }) => {
    const { tenant } = useContext(TenantContext);
    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Gerar os próximos 3 dias (hoje + 2)
    useEffect(() => {
        if (!isOpen) return;

        const generateDays = () => {
            const daysArray = [];
            const today = new Date();
            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            
            for (let i = 0; i < 3; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                
                const dayOfWeek = date.getDay();
                const dayName = dayNames[dayOfWeek];
                const dayNumber = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const isToday = i === 0;
                
                daysArray.push({
                    date: dateStr,
                    display: `${dayName}${isToday ? ' (Hoje)' : ''}`,
                    day: dayNumber,
                    month: month,
                    year: year,
                    dayOfWeek: dayOfWeek,
                    isToday: isToday
                });
            }
            
            setDays(daysArray);
            
            if (daysArray.length > 0) {
                setSelectedDay(daysArray[0]);
            }
        };
        
        generateDays();
    }, [isOpen]);

    // Buscar slots quando o dia for selecionado
    useEffect(() => {
        if (selectedDay && tenant) {
            fetchSlots(selectedDay.date);
        }
    }, [selectedDay, tenant]);

    const fetchSlots = async (date) => {
        try {
            setLoading(true);
            setError(null);
            setSelectedSlot(null);
            setSlots([]);
            
            console.log('📤 Buscando slots para:', date);
            console.log('🔑 Tenant do contexto:', tenant);
            
            const tenantId = tenant || sessionStorage.getItem('tenant') || localStorage.getItem('tenant');
            console.log('🔑 Tenant final:', tenantId);
            
            if (!tenantId) {
                console.error('❌ Tenant não encontrado!');
                setError('Tenant não encontrado. Recarregue a página.');
                setLoading(false);
                return;
            }
            
            const url = `/orders/available-slots?date=${date}&tenant=${tenantId}`;
            console.log('📤 URL:', url);
            
            const response = await api.get(url);
            console.log('📥 Resposta STATUS:', response.status);
            console.log('📥 Resposta DATA:', response.data);
            
            if (response && response.data) {
                console.log('✅ Resposta recebida');
                
                if (response.data.success) {
                    const data = response.data.data;
                    console.log('📊 Dados:', data);
                    
                    if (data && data.slots && data.slots.length > 0) {
                        console.log('✅ Slots encontrados:', data.slots.length);
                        setSlots(data.slots);
                        setError(null);
                    } else {
                        console.log('⚠️ Sem slots disponíveis');
                        setSlots([]);
                        setError(data?.message || 'Nenhum horário disponível para este dia.');
                    }
                } else {
                    console.error('❌ Resposta com success: false');
                    setError(response.data?.error || 'Erro ao buscar horários disponíveis.');
                }
            } else {
                console.error('❌ Resposta vazia ou inválida');
                setError('Resposta inválida do servidor.');
            }
        } catch (error) {
            console.error('❌ Erro ao buscar slots:', error);
            console.error('❌ Detalhes:', error.response?.data || error.message);
            setError('Erro ao buscar horários disponíveis. Tente novamente.');
        } finally {
            setLoading(false);
            console.log('🏁 Carregamento finalizado');
        }
    };

    const handleDaySelect = (day) => {
        setSelectedDay(day);
        setSelectedSlot(null);
        if (onSelect) {
            onSelect(null);
        }
    };

    const handleSlotSelect = (slot) => {
        if (!slot.available) return;
        
        setSelectedSlot(slot);
        
        const dateTime = `${selectedDay.date}T${slot.time}:00`;
        
        if (onSelect) {
            onSelect({
                date: selectedDay.date,
                time: slot.time,
                datetime: dateTime,
                is_scheduled: true
            });
        }
    };

    if (!isOpen) return null;

    const availableSlots = slots.filter(s => s.available);

    return (
        <Container>
            <Title>📅 Agendar Entrega</Title>
            <Subtitle>
                Escolha o dia e horário para receber seu pedido.
                Agendamentos disponíveis para hoje, amanhã e depois de amanhã.
            </Subtitle>

            <DaysContainer>
                {days.map((day) => (
                    <DayButton
                        key={day.date}
                        selected={selectedDay?.date === day.date}
                        onClick={() => handleDaySelect(day)}
                    >
                        <DayLabel>{day.display}</DayLabel>
                        <DayDate>{day.day}/{day.month}</DayDate>
                    </DayButton>
                ))}
            </DaysContainer>

            {loading && (
                <LoadingContainer>
                    <span>⏳ Carregando horários disponíveis...</span>
                </LoadingContainer>
            )}

            {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}

            {!loading && !error && slots.length > 0 && (
                <>
                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                        Horários disponíveis para {selectedDay?.display}:
                    </div>
                    
                    {/* ✅ SELECT EM VEZ DE BOTÕES */}
                    <SelectWrapper>
                        <StyledSelect
                            hasValue={!!selectedSlot}
                            value={selectedSlot?.time || ''}
                            onChange={(e) => {
                                const selectedTime = e.target.value;
                                if (selectedTime) {
                                    const slot = slots.find(s => s.time === selectedTime);
                                    if (slot && slot.available) {
                                        handleSlotSelect(slot);
                                    }
                                } else {
                                    setSelectedSlot(null);
                                    if (onSelect) onSelect(null);
                                }
                            }}
                        >
                            <option value="">Selecione um horário</option>
                            {availableSlots.map((slot) => (
                                <option key={slot.time} value={slot.time}>
                                    {slot.time}
                                </option>
                            ))}
                        </StyledSelect>
                        <SelectArrow>▼</SelectArrow>
                    </SelectWrapper>

                    <InfoText>
                        {availableSlots.length} horário{availableSlots.length > 1 ? 's' : ''} disponível{availableSlots.length > 1 ? 'is' : ''}
                    </InfoText>
                </>
            )}

            {!loading && !error && slots.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    <span>😕 Nenhum horário disponível para este dia.</span>
                </div>
            )}

            <SelectedInfo visible={!!selectedSlot}>
                <span>✅</span>
                <span>
                    <strong>Horário selecionado:</strong> {selectedDay?.display} às {selectedSlot?.time}
                </span>
            </SelectedInfo>
        </Container>
    );
};

export default DateTimePicker;
