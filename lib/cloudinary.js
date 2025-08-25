const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Vérifier la configuration
console.log('🔧 Configuration Cloudinary:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configuré' : '❌ Manquant',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Configuré' : '❌ Manquant'
});

async function uploadImage(imageBuffer, filename, folder = 'dubai-immo-ads') {
  try {
    // Upload l'image sur Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename.replace('.png', ''),
          resource_type: 'image',
          format: 'png',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(imageBuffer);
    });

    console.log('✅ Image uploadée sur Cloudinary:', result.public_id);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes
    };

  } catch (error) {
    console.error('❌ Erreur upload Cloudinary:', error);
    throw error;
  }
}

async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Image supprimée de Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression Cloudinary:', error);
    throw error;
  }
}

module.exports = {
  uploadImage,
  deleteImage
};
