// ============================================================
// MODAL DE IMAGEM - EXPANDIR FOTO DO PRODUTO
// ============================================================

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.92);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ImageContainer = styled.div`
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Image = styled.img`
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  animation: scaleIn 0.3s ease;

  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const CloseButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 28px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  z-index: 100000;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.1);
  }

  @media (max-width: 480px) {
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    font-size: 22px;
  }
`;

const ImageInfo = styled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  pointer-events: none;

  @media (max-width: 480px) {
    bottom: 16px;
    font-size: 11px;
    padding: 6px 12px;
  }
`;

const ImageModal = ({ src, alt, onClose }) => {
  const overlayRef = useRef();

  // Fechar ao clicar fora da imagem
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <Overlay ref={overlayRef} onClick={handleOverlayClick}>
      <ImageContainer>
        <Image src={src} alt={alt || 'Imagem do produto'} />
      </ImageContainer>
      <CloseButton onClick={onClose} aria-label="Fechar">
        ✕
      </CloseButton>
      <ImageInfo>
        {alt || 'Produto'} • Clique em qualquer lugar para fechar
      </ImageInfo>
    </Overlay>
  );
};

export default ImageModal;