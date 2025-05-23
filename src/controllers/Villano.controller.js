import Villanos from "../models/Villanos.js";
import { descargarImagenDesdeURL, eliminarImagen } from "../../utils/fileUtils.js";

// Función para construir la URL de la imagen
const construirUrlImagen = (req, nombreArchivo) => {
    if (!nombreArchivo) return "";
    return `${req.protocol}://${req.get('host')}/api/villanos/imagen/${nombreArchivo}`;
};

const consulta = async (req, res) => {
    try {
        const villanos = await Villanos.find();
        const villanosConImagen = villanos.map(villano => ({
            ...villano._doc,
            imagen: construirUrlImagen(req, villano.imagen)
        }));
        res.json(villanosConImagen);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            detalles: "Error al consultar todos los villanos"
        });
    }
};

const consulta_individual = async (req, res) => {
    try {
        const villano = await Villanos.findOne({ "nombre_villano": req.params.nombre_villano });
        
        if (!villano) {
            return res.status(404).json({ 
                error: "Villano no encontrado",
                nombre_buscado: req.params.nombre_villano
            });
        }
        
        res.json({
            ...villano._doc,
            imagen: construirUrlImagen(req, villano.imagen)
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            detalles: "Error al consultar villano individual"
        });
    }
};

const insercion = async (req, res) => {
    try {
        if (req.user.rol !== 1) {
            return res.status(403).json({ 
                msj: "No tienes permisos para efectuar esta acción",
                rol_requerido: "Administrador (1)",
                rol_actual: req.user.rol
            });
        }

        const { nombre_real, nombre_villano, tierra, habilidades, imagen } = req.body;
        
        // Validación de campos
        const errores = [];
        if (!nombre_real?.trim()) errores.push("nombre_real es requerido");
        if (!nombre_villano?.trim()) errores.push("nombre_villano es requerido");
        if (!tierra?.trim()) errores.push("tierra es requerida");
        if (!Array.isArray(habilidades)) errores.push("habilidades debe ser un array");
        if (habilidades?.length === 0) errores.push("Debe tener al menos una habilidad");
        
        if (errores.length > 0) {
            return res.status(400).json({ 
                error: "Validación fallida",
                detalles: errores
            });
        }

        // Verificar duplicados
        const existeVillano = await Villanos.findOne({ 
            $or: [
                { nombre_villano }, 
                { nombre_real }
            ] 
        });
        
        if (existeVillano) {
            return res.status(400).json({ 
                error: "Conflicto de datos",
                mensaje: "Ya existe un villano con ese nombre o identidad secreta",
                villano_existente: existeVillano.nombre_villano
            });
        }

        // Manejo de imagen
        let nombreArchivo = "";
        if (imagen?.startsWith('http')) {
            try {
                nombreArchivo = await descargarImagenDesdeURL(imagen, 'villanos');
            } catch (error) {
                console.error("Error al descargar imagen:", error);
                return res.status(400).json({
                    error: "Error al procesar imagen",
                    mensaje: "No se pudo descargar la imagen desde la URL proporcionada"
                });
            }
        }

        // Crear nuevo villano
        const nuevoVillano = new Villanos({ 
            nombre_real, 
            nombre_villano, 
            tierra, 
            habilidades,
            imagen: nombreArchivo 
        });
        
        await nuevoVillano.save();
        
        res.status(201).json({
            ...nuevoVillano._doc,
            imagen: construirUrlImagen(req, nombreArchivo)
        });
    } catch (error) {
        console.error("Error en insercion:", error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const actualizar = async (req, res) => {
    try {
        if (req.user.rol !== 1) {
            return res.status(403).json({ 
                msj: "No tienes permisos para efectuar esta acción",
                rol_requerido: "Administrador (1)",
                rol_actual: req.user.rol
            });
        }

        const { nombre_real, nombre_villano, tierra, habilidades, imagen } = req.body;
        const villanoParam = req.params.nombre_villano;
        
        // Validación de campos
        const errores = [];
        if (!nombre_real?.trim()) errores.push("nombre_real es requerido");
        if (!nombre_villano?.trim()) errores.push("nombre_villano es requerido");
        if (!tierra?.trim()) errores.push("tierra es requerida");
        if (!Array.isArray(habilidades)) errores.push("habilidades debe ser un array");
        if (habilidades?.length === 0) errores.push("Debe tener al menos una habilidad");
        
        if (errores.length > 0) {
            return res.status(400).json({ 
                error: "Validación fallida",
                detalles: errores
            });
        }

        // Manejo de imagen
        let nombreArchivo = "";
        if (imagen?.startsWith('http')) {
            try {
                nombreArchivo = await descargarImagenDesdeURL(imagen, 'villanos');
            } catch (error) {
                console.error("Error al descargar imagen:", error);
                return res.status(400).json({
                    error: "Error al procesar imagen",
                    mensaje: "No se pudo descargar la imagen desde la URL proporcionada"
                });
            }
        }

        const datosActualizacion = { 
            nombre_real, 
            nombre_villano, 
            tierra, 
            habilidades
        };

        if (nombreArchivo) {
            datosActualizacion.imagen = nombreArchivo;
        }

        const villanoExistente = await Villanos.findOne({ "nombre_villano": villanoParam });
        
        if (!villanoExistente) {
            // Crear nuevo si no existe
            const nuevoVillano = new Villanos({ 
                nombre_real, 
                nombre_villano, 
                tierra, 
                habilidades,
                imagen: nombreArchivo 
            });
            await nuevoVillano.save();
            return res.status(201).json({ 
                msj: "Villano no existía, pero se creó uno nuevo", 
                villano: {
                    ...nuevoVillano._doc,
                    imagen: construirUrlImagen(req, nombreArchivo)
                } 
            });
        }
        
        // Verificar si el nuevo nombre ya existe para otro villano
        if (nombre_villano !== villanoParam) {
            const nombreExistente = await Villanos.findOne({ 
                nombre_villano, 
                _id: { $ne: villanoExistente._id } 
            });
            if (nombreExistente) {
                return res.status(400).json({ 
                    error: "Conflicto de datos",
                    mensaje: "Ya existe otro villano con ese nombre",
                    villano_existente: nombreExistente.nombre_villano
                });
            }
        }
        
        // Eliminar imagen anterior si se está actualizando
        if (nombreArchivo && villanoExistente.imagen) {
            await eliminarImagen(villanoExistente.imagen, 'villanos');
        }
        
        // Actualizar el villano existente
        const villanoActualizado = await Villanos.findOneAndUpdate(
            { "nombre_villano": villanoParam },
            datosActualizacion,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({ 
            msj: "Villano actualizado correctamente!",
            villano: {
                ...villanoActualizado._doc,
                imagen: construirUrlImagen(req, villanoActualizado.imagen)
            }
        });
    } catch (error) {
        console.error("Error en actualizar:", error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const eliminar = async (req, res) => {
    try {
        if (req.user.rol !== 1) {
            return res.status(403).json({ 
                msj: "No tienes permisos para efectuar esta acción",
                rol_requerido: "Administrador (1)",
                rol_actual: req.user.rol
            });
        }

        const nombre_villano = req.params.nombre_villano;
        const villanoExistente = await Villanos.findOne({ "nombre_villano": nombre_villano });
        
        if (!villanoExistente) {
            return res.status(404).json({ 
                error: "Villano no encontrado",
                nombre_buscado: nombre_villano
            });
        }
        
        // Eliminar la imagen asociada si existe
        if (villanoExistente.imagen) {
            await eliminarImagen(villanoExistente.imagen, 'villanos');
        }
        
        await Villanos.deleteOne({ "nombre_villano": nombre_villano });
        
        res.status(200).json({ 
            msj: "Villano eliminado correctamente!",
            villano: {
                ...villanoExistente._doc,
                imagen: construirUrlImagen(req, villanoExistente.imagen)
            }
        });
    } catch (error) {
        console.error("Error en eliminar:", error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export { consulta, consulta_individual, insercion, actualizar, eliminar };