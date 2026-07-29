import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../services/api';
import { Container, Button, Input } from '../Shared/Container';

const RegisterContainer = styled(Container)`
    padding-top: 40px;
    max-width: 500px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const RegisterBox = styled.div`
    background: #fff;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    border: 1px solid #f0f0f0;
`;

const Title = styled.h1`
    font-size: 28px;
    font-weight: 700;
    color: #2d3436;
    margin-bottom: 8px;
    text-align: center;
`;

const Subtitle = styled.p`
    text-align: center;
    color: #888;
    font-size: 14px;
    margin-bottom: 24px;
`;

const Form = styled.form`
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
        color: #555;
    }

    small {
        color: #888;
        font-size: 12px;
    }
`;

const ErrorMessage = styled.div`
    background: #fdedec;
    color: #e74c3c;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    border-left: 3px solid #e74c3c;
`;

const SuccessMessage = styled.div`
    background: #eafaf1;
    color: #27ae60;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    border-left: 3px solid #27ae60;
`;

const Footer = styled.div`
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #888;

    a {
        color: #e67e22;
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
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await api.post('/auth/register', formData);
            
            if (response.data.success) {
                const { token, user, subdomain } = response.data.data;
                const tenantId = user.tenantId || subdomain;
                
                localStorage.setItem('token', token);
                localStorage.setItem('tenant', tenantId);
                setSuccess(true);
                
                setTimeout(() => {
                    navigate('/admin?tenant=' + tenantId);
                }, 2000);
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
                <Title>🚀 Criar Conta</Title>
                <Subtitle>Cadastre seu restaurante e comece a vender</Subtitle>

                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>✅ Restaurante cadastrado com sucesso! Redirecionando...</SuccessMessage>}

                <Form onSubmit={handleSubmit}>
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
                            placeholder="fireburger"
                            required
                        />
                        <small>Ex: fireburger.smartdelivery.com</small>
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
                            placeholder="contato@fireburger.com"
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

                    <Button primary disabled={loading} style={{ padding: '14px' }}>
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