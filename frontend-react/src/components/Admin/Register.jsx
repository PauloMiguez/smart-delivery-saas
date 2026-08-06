import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { api } from '../../services/api';
import { Button, Input } from '../Shared/Container';

// Injeção de tipografia profissional e reset sutil para o contexto
const FormThemeSettings = createGlobalStyle`
  @import url('https://googleapis.com');
  
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    background-color: #f8fafc;
    margin: 0;
    padding: 0;
  }
`;

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f1f5f9; 
  // Padding dinâmico: menor em telas pequenas para aproveitar o espaço
  padding: 16px;

  @media (min-width: 640px) {
    padding: 32px;
  }
`;

const RegisterBox = styled.div`
  background: #ffffff;
  // Padding confortável no desktop que reduz no mobile para o formulário respirar
  padding: 24px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03), 0 20px 25px -5px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(226, 232, 240, 0.8);
  max-width: 480px;
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

  input {
    font-family: inherit;
    border-radius: 8px !important;
    border: 1px solid #cbd5e1 !important;
    padding: 10px 14px !important;
    font-size: 14px !important;
    width: 100%; // Garante que o input nunca quebre a largura do Box
    box-sizing: border-box;
    transition: all 0.15s ease-in-out !important;

    &:focus {
      outline: none !important;
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
    }
  }
`;

const StyledButton = styled(Button)`
  font-family: inherit;
  font-weight: 500;
  font-size: 14px;
  background-color: #0f172a !important; 
  color: #ffffff !important;
  border: none;
  border-radius: 8px !important;
  padding: 12px !important;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease-in-out !important;
  margin-top: 8px;

  &:hover {
    background-color: #1e293b !important;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #94a3b8 !important;
    cursor: not-allowed;
    transform: none;
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
            setError(error.response?.data?.error || 'Erro ao cadastrar sua conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <FormThemeSettings />
            <RegisterContainer>
                <RegisterBox>
                    <Logo>
                        <h1>Smart<span>Delivery</span></h1>
                        <p>Crie sua plataforma de vendas em poucos passos</p>
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
                                placeholder="fireburger"
                                required
                            />
                            <small>Seu endereço será: ://smartdelivery.com</small>
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
                                placeholder="Crie uma senha forte"
                                required
                            />
                        </FormGroup>

                        <StyledButton type="submit" disabled={loading}>
                            {loading ? 'Criando conta...' : 'Concluir Cadastro'}
                        </StyledButton>
                    </Form>

                    <Footer>
                        Já tem uma conta? <a href="/login">Fazer login</a>
                    </Footer>
                </RegisterBox>
            </RegisterContainer>
        </>
    );
};

export default Register;
