import { Router } from 'express';
import { actualizar, consulta, consulta_individual, insercion, eliminar } from "../controllers/Villano.controller.js";
import authMiddleware from '../config/authMiddleware.js';
import upload from '../config/archivoConfigVillanos.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración para servir archivos estáticos
router.use('/uploads/villanos', express.static(path.join(__dirname, '..', 'uploads', 'villanos')));

// Ruta GET para visualizar imágenes
router.get("/imagen/:nombreArchivo", (req, res) => {
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'villanos', req.params.nombreArchivo);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            estatus: "error", 
            mensaje: "Imagen de villano no encontrada",
            ruta_intentada: filePath
        });
    }

    res.sendFile(filePath);
});

// Ruta para subida de imágenes
router.post("/imagen", authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            estatus: "error", 
            mensaje: "No se subió ninguna imagen" 
        });
    }
    
    res.status(200).json({ 
        estatus: "éxito", 
        mensaje: "Imagen de villano subida correctamente",
        imagen: `/api/villanos/imagen/${req.file.filename}`
    });
});

// Rutas CRUD
router.get("/", consulta);
router.get("/villano/:nombre_villano", consulta_individual);
router.post("/insercion", authMiddleware, insercion);
router.put("/actualizar/:nombre_villano", authMiddleware, actualizar);
router.delete("/eliminar/:nombre_villano", authMiddleware, eliminar);

export default router;