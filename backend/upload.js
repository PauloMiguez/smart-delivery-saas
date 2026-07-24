// ============================================================
//  CLOUDINARY UPLOAD CONFIG
// ============================================================
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração para banners (imagens grandes)
const bannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: process.env.CLOUDINARY_FOLDER + '/banners',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1200, height: 400, crop: 'fill' }
        ]
    }
});

// Configuração para logos (imagens pequenas)
const logoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: process.env.CLOUDINARY_FOLDER + '/logos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 200, height: 200, crop: 'fill' }
        ]
    }
});

// Configuração para produtos
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: process.env.CLOUDINARY_FOLDER + '/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill' }
        ]
    }
});

// Criar uploaders
const uploadBanner = multer({ storage: bannerStorage });
const uploadLogo = multer({ storage: logoStorage });
const uploadProduct = multer({ storage: productStorage });

// Função para deletar imagem
async function deleteImage(publicId) {
    try {
        if (!publicId) return;
        // Extrair o public_id da URL
        const parts = publicId.split('/');
        const fileName = parts[parts.length - 1].split('.')[0];
        const folder = parts[parts.length - 2];
        const fullPublicId = `${folder}/${fileName}`;
        
        const result = await cloudinary.uploader.destroy(fullPublicId);
        console.log('🗑️ Imagem deletada:', result);
        return result;
    } catch (error) {
        console.error('❌ Erro ao deletar imagem:', error);
        return null;
    }
}

module.exports = {
    uploadBanner,
    uploadLogo,
    uploadProduct,
    deleteImage,
    cloudinary
};