import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../services/api';
import { Button, Input } from '../Shared/Container';

const RegisterContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #e67e22, #d35400);
    padding: 16px;
`;

const RegisterBox = styled.div`
    background: #fff;
    padding: 40px;
    border-radius: ${props => props.theme.borderRadius.xl};
    box-shadow: ${props => props.theme.shadows.xl};
    max-width: 450px;
    width: 100%;
`;

const Logo = styled.div`
    text-align: center;
    margin-bottom: 32px;

    h1 {
        font-size: 28px;
        font-weight: 800;
        color: ${props => props.theme.colors.text};
        margin: 0;
        
        span {
            color: ${props => props.theme.colors.primary};
        }
    }

    p {
        color: ${props => props.theme.colors.textLight};
        font-size: 14px;
        margin: 4px 0 0 0;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 14px;
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

    small {
        color: ${props => props.theme.colors.textMuted};
        font-size: 12px;
    }
`;

const ErrorMessage = styled.div`
    background: #fdedec;
    color: ${props => props.theme.colors.danger};
    padding: 10px 12px;
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    border-left: 3px solid ${props => props.theme.colors.danger};
`;

const Footer = styled.div`
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};

    a {
        color: ${props => props.theme.colors.primary};
        text-decoration: none;
        font-weight: 600;

        &:hover {
            text-decoration: underline;
        }
    }
`;

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        restaurantName: '',
        subdomain: '',
        ownerName: '',
        email: '',
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/register', formData);
            
            if (response.data.success) {
                const { token, tenantId } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('tenant', tenantId);
                
                navigate('/admin?tenant=' + tenantId);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Erro ao cadastrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <RegisterContainer>
            <RegisterBox>
                <Logo>
                    <h1>🚀 <span>Smart</span>Delivery</h1>
                    <p>Crie sua conta e comece a vender</p>
                </Logo>

                <Form onSubmit={handleSubmit}>
                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <FormGroup>
                        <label>Nome do Restaurante *</label>
                        <Input
                            type="text"
                            name="restaurantName"
                            value={formData.restaurantName}
                            onChange={handleChange}
                            placeholder="Ex: Fire Burger"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>Subdomínio *</label>
                        <Input
                            type="text"
                            name="subdomain"
                            value={formData.subdomain}
                            onChange={handleChange}
                            placeholder="firerburger"
                            required
                        />
                        <small>Ex: firerburger.smartdelivery.com</small>
                    </FormGroup>

                    <FormGroup>
                        <label>Seu Nome *</label>
                        <Input
                            type="text"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleChange}
                            placeholder="Seu nome completo"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>E-mail *</label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="contato@firerburger.com"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>Telefone</label>
                        <Input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(85) 99999-9999"
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>Senha *</label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength="6"
                        />
                    </FormGroup>

                    <Button primary disabled={loading} style={{ padding: '12px' }}>
                        {loading ? 'Cadastrando...' : 'Criar Conta'}
                    </Button>
                </Form>

                <Footer>
                    Já tem uma conta? <a href="/login">Faça login</a>
                </Footer>
            </RegisterBox>
        </RegisterContainer>
    );
};

export default Register;