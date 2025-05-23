import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Descarga una imagen desde una URL y la guarda localmente
 * @param {string} imageUrl - URL de la imagen a descargar
 * @param {string} folder - Carpeta de destino (default: 'spidermans')
 * @returns {Promise<string>} - Nombre del archivo guardado
 */
export const descargarImagenDesdeURL = async (imageUrl, folder = 'spidermans') => {
    try {
        // Crear directorio si no existe
        const uploadDir = path.join(__dirname, '..', 'uploads', folder);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Validar URL
        if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error('URL de imagen no válida');
        }

        // Descargar imagen
        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'stream',
            timeout: 10000 // 10 segundos de timeout
        });

        // Validar tipo de imagen
        const contentType = response.headers['content-type'];
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!validTypes.includes(contentType)) {
            throw new Error(`Tipo de imagen no soportado: ${contentType}`);
        }

        // Generar nombre único
        const extension = contentType.split('/')[1] || 'jpg';
        const fileName = `${folder === 'spidermans' ? 'spiderman' : 'aliado'}-${uuidv4()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        // Guardar archivo
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(fileName));
            writer.on('error', (error) => {
                // Intentar eliminar el archivo si hubo error al escribirlo
                fs.unlink(filePath, () => {});
                reject(error);
            });
        });

    } catch (error) {
        console.error('Error al descargar imagen:', {
            url: imageUrl,
            error: error.message
        });
        throw new Error(`No se pudo descargar la imagen: ${error.message}`);
    }
};

/**
 * Elimina una imagen del sistema de archivos
 * @param {string} fileName - Nombre del archivo a eliminar
 * @param {string} folder - Carpeta donde se encuentra (default: 'spidermans')
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export const eliminarImagen = async (fileName, folder = 'spidermans') => {
    try {
        if (!fileName || typeof fileName !== 'string') {
            console.warn('Intento de eliminar imagen con nombre inválido:', fileName);
            return false;
        }

        const filePath = path.join(__dirname, '..', '..', 'uploads', folder, fileName);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        
        console.warn('Archivo no encontrado para eliminar:', filePath);
        return false;
    } catch (error) {
        console.error('Error al eliminar imagen:', {
            fileName,
            error: error.message
        });
        return false;
    }
};