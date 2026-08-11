// frontend-react/src/components/Admin/ChangePassword.jsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { tokens } from '../../styles/tokens';
import { Card } from '../Shared/Container';

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: ${tokens.spacing.sm} 0;
`;

const Title = styled.h3`
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${tokens.colors.text};
  margin: 0 0 ${tokens.spacing.xs} 0;
`;

const Description = styled.p`
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.textMuted};
  margin: 0 0 ${tokens.spacing.md} 0;
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
  font-weight: ${tokens.typography.fontWeight.medium};
  font-size: ${tokens.typography.fontSize.sm};
  color: ${tokens.colors.textSecondary};
`;

const Input = styled.input`
  width: 100%;
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  font-size: ${tokens.typography.fontSize.base};
  font-family: ${tokens.typography.fontFamily};
  color: ${tokens.colors.text};
  background: ${tokens.colors.surface};
  border: 1.5px solid ${props => props.$error ? tokens.colors.error : tokens.colors.border};
  border-radius: ${tokens.radius.md};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${tokens.colors.placeholder};
  }

  &:hover {
    border-color: ${props => props.$error ? tokens.colors.error : tokens.colors.borderHover};
  }

  &:focus {
    border-color: ${props => props.$error ? tokens.colors.error : tokens.colors.accent};
    box-shadow: 0 0 0 3px ${props => props.$error ? tokens.colors.errorLight : tokens.colors.accentLight};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: ${tokens.colors.background};
  }
`;

const ErrorText = styled.span`
  color: ${tokens.colors.error};
  font-size: ${tokens.typography.fontSize.xs};
  margin-top: ${tokens.spacing.xs};
`;

const Button = styled.button`
  padding: ${tokens.spacing.md};
  background: ${tokens.colors.accent};
  color: ${tokens.colors.surface};
  border: none;
  border-radius: ${tokens.radius.md};
  font-size: ${tokens.typography.fontSize.base};
  font-weight: ${tokens.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: ${tokens.typography.fontFamily};
  margin-top: ${tokens.spacing.sm};

  &:hover:not(:disabled) {
    background: ${tokens.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${tokens.shadows.md};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuccessMessage = styled.div`
  padding: ${tokens.spacing.md};
  background: ${tokens.colors.successLight};
  color: ${tokens.colors.success};
  border-radius: ${tokens.radius.md};
  border-left: 3px solid ${tokens.colors.success};
  font-weight: ${tokens.typography.fontWeight.medium};
  font-size: ${tokens.typography.fontSize.sm};
  margin-bottom: ${tokens.spacing.md};
`;

const ErrorMessage = styled.div`
  padding: ${tokens.spacing.md};
  background: ${tokens.colors.errorLight};
  color: ${tokens.colors.error};
  border-radius: ${tokens.radius.md};
  border-left: 3px solid ${tokens.colors.error};
  font-weight: ${tokens.typography.fontWeight.medium};
  font-size: ${tokens.typography.fontSize.sm};
  margin-bottom: ${tokens.spacing.md};
`;

const ToggleVisibilityButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.textMuted};
  padding: 4px;
  font-family: ${tokens.typography.fontFamily};

  &:hover {
    color: ${tokens.colors.text};
  }
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const ChangePassword = () => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpar erro do campo ao digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (success) {
            setSuccess(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Senha atual é obrigatória';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'Nova senha é obrigatória';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'A nova senha deve ter no mínimo 6 caracteres';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'As senhas não coincidem';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Preencha todos os campos corretamente', 'error');
            return;
        }

        setLoading(true);
        setSuccess(false);

        try {
            const response = await api.put('/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            if (response.data.success) {
                setSuccess(true);
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                showToast('Senha alterada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('❌ Erro ao alterar senha:', error);
            let errorMessage = 'Erro ao alterar senha. Tente novamente.';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            
            setErrors(prev => ({
                ...prev,
                general: errorMessage
            }));
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = (field) => {
        switch(field) {
            case 'current':
                setShowCurrentPassword(!showCurrentPassword);
                break;
            case 'new':
                setShowNewPassword(!showNewPassword);
                break;
            case 'confirm':
                setShowConfirmPassword(!showConfirmPassword);
                break;
            default:
                break;
        }
    };

    return (
        <Container>
            <Card>
                <Title>🔐 Alterar Senha</Title>
                <Description>
                    Para sua segurança, mantenha sua senha atualizada regularmente.
                </Description>

                {success && (
                    <SuccessMessage>
                        ✅ Senha alterada com sucesso! Use a nova senha para próximos acessos.
                    </SuccessMessage>
                )}

                {errors.general && (
                    <ErrorMessage>
                        ❌ {errors.general}
                    </ErrorMessage>
                )}

                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <InputWrapper>
                            <Input
                                id="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Digite sua senha atual"
                                disabled={loading}
                                $error={!!errors.currentPassword}
                            />
                            <ToggleVisibilityButton
                                type="button"
                                onClick={() => toggleVisibility('current')}
                            >
                                {showCurrentPassword ? '👁️' : '🔒'}
                            </ToggleVisibilityButton>
                        </InputWrapper>
                        {errors.currentPassword && <ErrorText>{errors.currentPassword}</ErrorText>}
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <InputWrapper>
                            <Input
                                id="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Digite a nova senha (mínimo 6 caracteres)"
                                disabled={loading}
                                $error={!!errors.newPassword}
                            />
                            <ToggleVisibilityButton
                                type="button"
                                onClick={() => toggleVisibility('new')}
                            >
                                {showNewPassword ? '👁️' : '🔒'}
                            </ToggleVisibilityButton>
                        </InputWrapper>
                        {errors.newPassword && <ErrorText>{errors.newPassword}</ErrorText>}
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <InputWrapper>
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirme a nova senha"
                                disabled={loading}
                                $error={!!errors.confirmPassword}
                            />
                            <ToggleVisibilityButton
                                type="button"
                                onClick={() => toggleVisibility('confirm')}
                            >
                                {showConfirmPassword ? '👁️' : '🔒'}
                            </ToggleVisibilityButton>
                        </InputWrapper>
                        {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
                    </FormGroup>

                    <Button type="submit" disabled={loading}>
                        {loading ? '⏳ Alterando...' : '🔑 Alterar Senha'}
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default ChangePassword;