import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../services/api';
import { Button, Input } from '../Shared/Container';

const LoginContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #e67e22, #d35400);
    padding: 16px;
`;

const LoginBox = styled.div`
    background: #fff;
    padding: 40px;
    border-radius: ${props => props.theme.borderRadius.xl};
    box-shadow: ${props => props.theme.shadows.xl};
    max-width: 400px;
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

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('tenant', user.tenantId);
                
                navigate('/admin?tenant=' + user.tenantId);
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
                <Logo>
                    <h1>🔐 <span>Smart</span>Delivery</h1>
                    <p>Faça login para acessar o painel</p>
                </Logo>

                <Form onSubmit={handleSubmit}>
                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <FormGroup>
                        <label>E-mail</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@fireburger.com"
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label>Senha</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </FormGroup>

                    <Button primary disabled={loading} style={{ padding: '12px' }}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </Form>

                <Footer>
                    Não tem uma conta? <a href="/register.html">Cadastre-se</a>
                </Footer>
            </LoginBox>
        </LoginContainer>
    );
};

export default Login;