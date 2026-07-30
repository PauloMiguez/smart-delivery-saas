import styled from 'styled-components';

export const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    animation: fadeIn 0.2s ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

export const ModalContent = styled.div`
    background: ${props => props.theme.colors.card};
    border-radius: ${props => props.theme.borderRadius.lg};
    max-width: 550px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;
    box-shadow: ${props => props.theme.shadows.xl};
    animation: slideUp 0.3s ease;

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 480px) {
        padding: 16px;
        margin: 8px;
    }
`;

export const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid ${props => props.theme.colors.border};

    h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: ${props => props.theme.colors.text};
    }
`;

export const ModalClose = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: ${props => props.theme.colors.textMuted};
    padding: 0 4px;
    transition: color 0.2s;

    &:hover {
        color: ${props => props.theme.colors.text};
    }
`;

export const ModalForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const FormGroup = styled.div`
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

export const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

export const Input = styled.input`
    width: 100%;
    padding: 10px 12px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    transition: all 0.3s ease;
    background: #ffffff;
    color: #2d3436;
    
    &::placeholder {
        color: #b2bec3;
    }

    &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
        box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
    }

    &:disabled {
        background: #f5f5f5;
        color: #888888;
    }
`;

export const Select = styled.select`
    width: 100%;
    padding: 10px 12px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    background: #ffffff;
    color: #2d3436;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
        box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
    }
`;

export const TextArea = styled.textarea`
    width: 100%;
    padding: 10px 12px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    background: #ffffff;
    color: #2d3436;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    transition: all 0.3s ease;

    &::placeholder {
        color: #b2bec3;
    }

    &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
        box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
    }
`;

export const CheckboxGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    label {
        font-weight: 400;
        cursor: pointer;
        color: ${props => props.theme.colors.text};
    }

    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: ${props => props.theme.colors.primary};
    }
`;

export const ModalActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid ${props => props.theme.colors.border};

    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

export const Button = styled.button`
    padding: 10px 24px;
    border: none;
    border-radius: ${props => props.theme.borderRadius.md};
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;

    ${props => props.primary && `
        background: ${props.theme.colors.primary};
        color: #ffffff;
        &:hover { background: ${props.theme.colors.primaryDark}; }
    `}

    ${props => props.secondary && `
        background: ${props.theme.colors.border};
        color: ${props.theme.colors.text};
        &:hover { background: #d0d0d0; }
    `}

    ${props => props.danger && `
        background: ${props.theme.colors.danger};
        color: #ffffff;
        &:hover { background: #c0392b; }
    `}

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

export const ErrorMessage = styled.div`
    background: #fdedec;
    color: ${props => props.theme.colors.danger};
    padding: 10px 12px;
    border-radius: ${props => props.theme.borderRadius.md};
    font-size: 14px;
    border-left: 3px solid ${props => props.theme.colors.danger};
`;

export const ImageUploadArea = styled.div`
    border: 2px dashed ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    padding: 16px;
    text-align: center;
    transition: border-color 0.3s;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &:hover {
        border-color: ${props => props.theme.colors.primary};
    }
`;

export const ImageDropArea = styled.div`
    position: relative;
    cursor: pointer;
    width: 100%;
    padding: 20px;

    span {
        color: ${props => props.theme.colors.textMuted};
        font-size: 14px;
    }

    input[type="file"] {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }
`;

export const ImagePreviewContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
`;

export const ImagePreview = styled.img`
    max-width: 100%;
    max-height: 180px;
    object-fit: contain;
    border-radius: ${props => props.theme.borderRadius.md};
    border: 1px solid ${props => props.theme.colors.border};
`;

export const RemoveImageButton = styled.button`
    background: ${props => props.theme.colors.danger};
    color: #ffffff;
    border: none;
    padding: 4px 12px;
    border-radius: ${props => props.theme.borderRadius.sm};
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;

    &:hover {
        background: #c0392b;
    }
`;