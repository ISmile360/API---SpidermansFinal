import { Router } from 'express';
import { actualizar, consulta, consulta_individual, insercion, eliminar } from "../controllers/Spidermans.controller.js";
import authMiddleware from '../config/authMiddleware.js';
import upload from '../config/archivoConfig.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


router.use('/uploads/spidermans', express.static(path.join(__dirname, '..', 'uploads', 'spidermans')));


router.get("/imagen/:nombreArchivo", (req, res) => {
    const filePath = path.join(__dirname, '..','..', 'uploads', 'spidermans', req.params.nombreArchivo);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            estatus: "error", 
            mensaje: "Imagen de Spiderman no encontrada",
            ruta_intentada: filePath
        });
    }

    res.sendFile(filePath);
});


router.post("/imagen", authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            estatus: "error", 
            mensaje: "No se subió ninguna imagen" 
        });
    }
    
    res.status(200).json({ 
        estatus: "éxito", 
        mensaje: "Imagen de Spiderman subida correctamente",
        imagen: `/api/spidermans/imagen/${req.file.filename}`
    });
});


router.get("/", consulta);
router.get("/spiderman/:nombre_spiderman", consulta_individual);
router.post("/insercion", authMiddleware, insercion);
router.put("/actualizar/:nombre_spiderman", authMiddleware, actualizar);
router.delete("/eliminar/:nombre_spiderman", authMiddleware, eliminar);

export default router;