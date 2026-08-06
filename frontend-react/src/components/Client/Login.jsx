import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../services/api';
import { tokens } from '../../styles/tokens';

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: ${tokens.colors.background};
  padding: ${tokens.spacing.md};
`;

const Card = styled.div`
  background: ${tokens.colors.surface};
  padding: ${tokens.spacing.xl};
  border-radius: ${tokens.radius.lg};
  box-shadow: ${tokens.shadows.lg};
  border: 1px solid ${tokens.colors.border};
  max-width: 420px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: ${tokens.breakpoints.sm}) {
    padding: ${tokens.spacing.lg};
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${tokens.spacing.xl};

  h1 {
    font-size: ${tokens.typography.fontSize['2xl']};
    font-weight: ${tokens.typography.fontWeight.bold};
    letter-spacing: -0.02em;
    color: ${tokens.colors.text};
    margin: 0;

    span {
      color: ${tokens.colors.accent};
    }
  }

  p {
    color: ${tokens.colors.textSecondary};
    font-size: ${tokens.typography.fontSize.sm};
    line-height: ${tokens.typography.lineHeight.normal};
    margin: ${tokens.spacing.sm} 0 0 0;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.xs};
`;

const Label = styled.label`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${tokens.colors.textSecondary};
`;

const Input = styled.input`
  width: 100%;
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  font-size: ${tokens.typography.fontSize.base};
  font-family: ${tokens.typography.fontFamily};
  color: ${tokens.colors.text};
  background: ${tokens.colors.surface};
  border: 1.5px solid ${tokens.colors.border};
  border-radius: ${tokens.radius.md};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${tokens.colors.placeholder};
  }

  &:hover {
    border-color: ${tokens.colors.borderHover};
  }

  &:focus {
    border-color: ${tokens.colors.accent};
    box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: ${tokens.colors.background};
  }
`;

const HelperText = styled.small`
  color: ${tokens.colors.textMuted};
  font-size: ${tokens.typography.fontSize.xs};
  line-height: ${tokens.typography.lineHeight.normal};
  margin-top: ${tokens.spacing.xs};
`;

const ErrorMessage = styled.div`
  background: ${tokens.colors.errorLight};
  color: ${tokens.colors.error};
  padding: ${tokens.spacing.md};
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.sm};
  line-height: ${tokens.typography.lineHeight.normal};
  border-left: 3px solid ${tokens.colors.error};
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: ${tokens.spacing.md};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.medium};
  font-family: ${tokens.typography.fontFamily};
  color: ${tokens.colors.surface};
  background: ${tokens.colors.accent};
  border: none;
  border-radius: ${tokens.radius.md};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-top: ${tokens.spacing.sm};

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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Footer = styled.div`
  text-align: center;
  margin-top: ${tokens.spacing.lg};
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.textSecondary};

  a {
    color: ${tokens.colors.accent};
    text-decoration: none;
    font-weight: ${tokens.typography.fontWeight.medium};
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${tokens.colors.accentHover};
      text-decoration: underline;
    }
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${tokens.colors.border};
  margin: ${tokens.spacing.lg} 0;
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

    if (!formData.tenant) {
      setError('Por favor, informe o subdomínio do restaurante.');
      setLoading(false);
      return;
    }

    try {
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
    <Container>
      <Card>
        <Logo>
          <h1>🔐 <span>Smart</span>Delivery</h1>
          <p>Faça login para acessar o painel</p>
        </Logo>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <FormGroup>
            <Label htmlFor="email">E-mail</Label>
            <Input
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
            <Label htmlFor="password">Senha</Label>
            <Input
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
            <Label htmlFor="tenant">Subdomínio do Restaurante *</Label>
            <Input
              id="tenant"
              type="text"
              name="tenant"
              value={formData.tenant}
              onChange={handleChange}
              placeholder="fireburger"
              required
            />
            <HelperText>Ex: fireburger.smartdelivery.com</HelperText>
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </SubmitButton>
        </Form>

        <Divider />

        <Footer>
          Não tem uma conta? <a href="/register">Cadastre-se</a>
        </Footer>
      </Card>
    </Container>
  );
};

export default Login;
