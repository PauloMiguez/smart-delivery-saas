import React from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: ${props => props.fullHeight ? '100vh' : '200px'};
    flex-direction: column;
    gap: 16px;
`;

const Spinner = styled.div`
    width: 48px;
    height: 48px;
    border: 4px solid ${props => props.theme.colors.border};
    border-top: 4px solid ${props => props.theme.colors.primary};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

const LoadingText = styled.p`
    color: ${props => props.theme.colors.textLight};
    font-size: 14px;
    margin: 0;
`;

export const Loading = ({ fullHeight = false, text = 'Carregando...' }) => {
    return (
        <LoadingContainer fullHeight={fullHeight}>
            <Spinner />
            <LoadingText>{text}</LoadingText>
        </LoadingContainer>
    );
};

export const InlineLoading = styled.div`
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid ${props => props.theme.colors.border};
    border-top: 2px solid ${props => props.theme.colors.primary};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    vertical-align: middle;
    margin-right: 8px;

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;