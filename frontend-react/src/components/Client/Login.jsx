import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../services/api';
import { Container, Button, Input } from '../Shared/Container';

const LoginContainer = styled(Container)`
    padding-top: 40px;
    max-width: 420px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const LoginBox = styled.div`
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
`;

const ErrorMessage = styled.div`
    background: #fdedec;
    color: #e74c3c;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    border-left: 3px solid #e74c3c;
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

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
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
            const response = await api.post('/auth/login', formData);
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                const tenantId = user.tenantId;
                
                localStorage.setItem('token', token);
                localStorage.setItem('tenant', tenantId);
                
                navigate('/admin?tenant=' + tenantId);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginContainer>
            <LoginBox>
                <Title>🔐 Smart Delivery</Title>
                <Subtitle>Faça login para acessar o painel</Subtitle>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <label>E-mail</label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@fireburger.com"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>Senha</label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </FormGroup>

                    <Button primary disabled={loading} style={{ padding: '14px' }}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </Form>

                <Footer>
                    Não tem uma conta? <a href="/register">Cadastre-se</a>
                </Footer>
            </LoginBox>
        </LoginContainer>
    );
};

export default Login;