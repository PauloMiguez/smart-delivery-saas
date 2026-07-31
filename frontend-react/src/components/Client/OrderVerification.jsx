import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { Container, Button, Card, Input } from '../Shared/Container';

const VerifyContainer = styled(Container)`
    padding-top: 16px;
    padding-bottom: 40px;
    max-width: 480px;
    margin: 0 auto;
    min-height: 60vh;
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: ${props => props.theme.colors.textLight};
    font-size: 14px;
    cursor: pointer;
    padding: 8px 0;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        color: ${props => props.theme.colors.text};
    }
`;

const Title = styled.h2`
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.text};
`;

const VerifyCard = styled(Card)`
    padding: 24px;
`;

const VerifyTitle = styled.h3`
    text-align: center;
    color: #2d3436;
    margin-bottom: 8px;
    font-size: 20px;
`;

const VerifySubtitle = styled.p`
    text-align: center;
    color: #888;
    font-size: 14px;
    margin-bottom: 24px;
`;

const VerifyForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
        font-weight: 600;
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
    }
`;

const ErrorText = styled.span`
    color: #e74c3c;
    font-size: 12px;
    margin-top: 4px;
`;

const OrderVerification = () => {
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.phone.trim()) {
            setError('Preencha nome e telefone para acessar seus pedidos.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Salvar dados do usuário no localStorage
            localStorage.setItem('user_name', formData.name.trim());
            localStorage.setItem('user_phone', formData.phone.trim());
            
            // Navegar para a lista de pedidos passando os dados
            navigate(`/orders?tenant=${tenant}&name=${encodeURIComponent(formData.name.trim())}&phone=${encodeURIComponent(formData.phone.trim())}`);
            
        } catch (error) {
            console.error('Erro ao verificar:', error);
            setError('Erro ao verificar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(`/?tenant=${tenant}`);
    };

    return (
        <VerifyContainer>
            <BackButton onClick={handleBack}>
                ← Voltar
            </BackButton>

            <Title>📋 Meus Pedidos</Title>

            <VerifyCard>
                <VerifyTitle>🔒 Verifique seus dados</VerifyTitle>
                <VerifySubtitle>
                    Informe o nome e telefone que usou no cadastro para visualizar seus pedidos.
                </VerifySubtitle>
                
                <VerifyForm onSubmit={handleSubmit}>
                    <FormGroup>
                        <label>Nome completo *</label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Seu nome completo"
                            required
                            autoFocus
                        />
                    </FormGroup>
                    
                    <FormGroup>
                        <label>Telefone *</label>
                        <Input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(85) 99999-9999"
                            required
                        />
                    </FormGroup>
                    
                    {error && <ErrorText>{error}</ErrorText>}
                    
                    <Button 
                        primary 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Verificando...' : '🔓 Verificar e Acessar'}
                    </Button>
                </VerifyForm>
            </VerifyCard>
        </VerifyContainer>
    );
};

export default OrderVerification;
