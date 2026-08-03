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

const SlotsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
`;

const SlotButton = styled.button`
    padding: 8px 16px;
    border: 2px solid ${props => {
        if (props.selected) return '#e67e22';
        if (props.available) return '#2ecc71';
        return '#e0e0e0';
    }};
    border-radius: 8px;
    background: ${props => {
        if (props.selected) return '#fdf0e6';
        if (props.available) return '#f0faf4';
        return '#f5f5f5';
    }};
    color: ${props => {
        if (props.selected) return '#e67e22';
        if (props.available) return '#2d3436';
        return '#aaa';
    }};
    cursor: ${props => props.available ? 'pointer' : 'not-allowed'};
    font-size: 14px;
    transition: all 0.2s;
    opacity: ${props => props.available ? 1 : 0.5};

    &:hover {
        border-color: ${props => props.available ? '#e67e22' : '#e0e0e0'};
        transform: ${props => props.available ? 'scale(1.02)' : 'none'};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

const SlotInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 8px;
    font-size: 13px;
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
                
                // Formatar data para YYYY-MM-DD
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                
                // Verificar se é hoje
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
            
            // Selecionar o primeiro dia por padrão (hoje)
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
        console.log('🔑 Tenant:', tenant);
        
        const response = await api.get(`/orders/available-slots?date=${date}&tenant=${tenant}`);
        console.log('📥 Resposta STATUS:', response.status);
        console.log('📥 Resposta DATA:', response.data);
        console.log('📥 Resposta COMPLETA:', response);
        
        // ✅ Verificar se a resposta existe
        if (response && response.data) {
            console.log('✅ Resposta recebida');
            
            if (response.data.success) {
                const data = response.data.data;
                console.log('📊 Dados:', data);
                
                if (data.available && data.slots && data.slots.length > 0) {
                    console.log('✅ Slots encontrados:', data.slots.length);
                    setSlots(data.slots);
                } else {
                    console.log('⚠️ Sem slots disponíveis');
                    setSlots([]);
                    setError(data.message || 'Nenhum horário disponível para este dia.');
                }
            } else {
                console.error('❌ Resposta com success: false');
                setError('Erro ao buscar horários disponíveis.');
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
        // Limpar a seleção no pai
        if (onSelect) {
            onSelect(null);
        }
    };

    const handleSlotSelect = (slot) => {
        if (!slot.available) return;
        
        setSelectedSlot(slot);
        
        // Criar datetime completo
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
                    <SlotsContainer>
                        {slots.map((slot) => (
                            <SlotButton
                                key={slot.time}
                                selected={selectedSlot?.time === slot.time}
                                available={slot.available}
                                onClick={() => handleSlotSelect(slot)}
                                disabled={!slot.available}
                            >
                                {slot.time}
                                {!slot.available && ' 🔴'}
                            </SlotButton>
                        ))}
                    </SlotsContainer>
                    <SlotInfo>
                        <span>🕐 Cada horário tem limite de pedidos</span>
                        <span>
                            {slots.filter(s => s.available).length} horários disponíveis
                        </span>
                    </SlotInfo>
                </>
            )}

            {!loading && !error && slots.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    <span>😕 Nenhum horário disponível para este dia.</span>
                </div>
            )}

            {selectedSlot && (
                <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    background: '#f0faf4', 
                    borderRadius: '8px',
                    border: '2px solid #2ecc71'
                }}>
                    <strong style={{ color: '#27ae60' }}>✅ Horário selecionado:</strong>
                    <span style={{ marginLeft: '8px' }}>
                        {selectedDay?.display} às {selectedSlot.time}
                    </span>
                </div>
            )}
        </Container>
    );
};

export default DateTimePicker;