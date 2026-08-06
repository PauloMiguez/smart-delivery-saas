import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { api } from '../../services/api';

// ============================================================
//  FONTES GLOBAIS
// ============================================================
const FormThemeSettings = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    background-color: #f8fafc;
    margin: 0;
    padding: 0;
  }
`;

// ============================================================
//  INPUT CUSTOMIZADO
// ============================================================
const StyledInput = styled.input`
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.15s ease-in-out;
  background: #ffffff;
  color: #0f172a;
  outline: none;

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  &:hover {
    border-color: #94a3b8;
  }

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    outline: none;
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f1f5f9;
  padding: 16px;

  @media (min-width: 640px) {
    padding: 32px;
  }
`;

const LoginBox = styled.div`
  background: #ffffff;
  padding: 24px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 
              0 2px 4px -2px rgba(0, 0, 0, 0.03),
              0 20px 25px -5px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(226, 232, 240, 0.8);
  max-width: 420px;
  width: 100%;
  box-sizing: border-box;

  @media (min-width: 480px) {
    padding: 40px;
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 28px;

  h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #0f172a;
    margin: 0;
    
    span {
      color: #2563eb;
    }

    @media (min-width: 480px) {
      font-size: 24px;
    }
  }

  p {
    color: #475569;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.5;
    margin: 6px 0 0 0;

    @media (min-width: 480px) {
      font-size: 14px;
    }
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
  gap: 6px;

  label {
    font-weight: 500;
    font-size: 13px;
    color: #334155;
    letter-spacing: -0.01em;
  }

  small {
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
    margin-top: 2px;
  }
`;

const SubmitButton = styled.button`
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 500;
  font-size: 14px;
  background-color: #0f172a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background-color: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #991b1b;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #fee2e2;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: #475569;

  a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s ease-in-out;

    &:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
      border-radius: 4px;
    }
  }
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        tenant: ''
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

        // Validar tenant
        if (!formData.tenant) {
            setError('Por favor, informe o subdomínio do restaurante.');
            setLoading(false);
            return;
        }

        try {
            // Salvar tenant antes do login (para o interceptor)
            localStorage.setItem('tenant', formData.tenant);
            sessionStorage.setItem('tenant', formData.tenant);

            const response = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password
            });
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                const tenantId = user.tenantId || formData.tenant;
                
                localStorage.setItem('token', token);
                localStorage.setItem('tenant', tenantId);
                sessionStorage.setItem('tenant', tenantId);
                
                navigate('/admin?tenant=' + tenantId);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <FormThemeSettings />
            <LoginContainer>
                <LoginBox>
                    <Logo>
                        <h1>🔐 <span>Smart</span>Delivery</h1>
                        <p>Faça login para acessar o painel</p>
                    </Logo>

                    <Form onSubmit={handleSubmit}>
                        {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}

                        <FormGroup>
                            <label htmlFor="email">E-mail</label>
                            <StyledInput
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="admin@fireburger.com"
                                required
                                autoFocus
                            />
                        </FormGroup>

                        <FormGroup>
                            <label htmlFor="password">Senha</label>
                            <StyledInput
                                id="password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <label htmlFor="tenant">Subdomínio do Restaurante *</label>
                            <StyledInput
                                id="tenant"
                                type="text"
                                name="tenant"
                                value={formData.tenant}
                                onChange={handleChange}
                                placeholder="fireburger"
                                required
                            />
                            <small>Ex: fireburger.smartdelivery.com</small>
                        </FormGroup>

                        <SubmitButton type="submit" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </SubmitButton>
                    </Form>

                    <Footer>
                        Não tem uma conta? <a href="/register">Cadastre-se</a>
                    </Footer>
                </LoginBox>
            </LoginContainer>
        </>
    );
};

export default Login;
