import Spidermans from "../models/Spidermans.js";
import { descargarImagenDesdeURL, eliminarImagen } from "../../utils/fileUtils.js";

// Función para construir la URL completa de la imagen
const construirUrlImagen = (req, nombreArchivo) => {
    if (!nombreArchivo) return "";
    return `${req.protocol}://${req.get('host')}/api/spidermans/imagen/${nombreArchivo}`;
};

// Consulta de todos los Spidermans
const consulta = async (req, res) => {
    try {
        const spidermans = await Spidermans.find();
        const spidermansConImagen = spidermans.map(spiderman => ({
            ...spiderman._doc,
            imagen: construirUrlImagen(req, spiderman.imagen)
        }));
        res.json(spidermansConImagen);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            detalles: "Error al consultar todos los Spidermans"
        });
    }
};

// Consulta individual de Spiderman
const consulta_individual = async (req, res) => {
    try {
        let nombre_spiderman = req.params.nombre_spiderman;
        const spiderman = await Spidermans.findOne({ "Nombre_spiderman": nombre_spiderman });
        
        if (!spiderman) {
            return res.status(404).json({ 
                error: "Este Spiderman no existe en la base de datos",
                nombre_buscado: nombre_spiderman
            });
        }
        
        res.json({
            ...spiderman._doc,
            imagen: construirUrlImagen(req, spiderman.imagen)
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            detalles: "Error al consultar Spiderman individual"
        });
    }
};

// Inserción de Spiderman
const insercion = async (req, res) => {
    try {
        if (req.user.rol !== 1) {
            return res.status(403).json({ 
                msj: "No tienes permisos para efectuar esta acción",
                rol_requerido: "Administrador (1)",
                rol_actual: req.user.rol
            });
        }

        const { Nombre_Real, Nombre_spiderman, Tierra, Habilidades, imagen } = req.body;
        
        // Validación de campos
        const errores = [];
        if (!Nombre_Real?.trim()) errores.push("Nombre_Real es requerido");
        if (!Nombre_spiderman?.trim()) errores.push("Nombre_spiderman es requerido");
        if (!Tierra?.trim()) errores.push("Tierra es requerida");
        if (!Array.isArray(Habilidades)) errores.push("Habilidades debe ser un array");
        if (Habilidades?.length === 0) errores.push("Debe tener al menos una habilidad");
        
        if (errores.length > 0) {
            return res.status(400).json({ 
                error: "Validación fallida",
                detalles: errores
            });
        }

        // Verificar duplicados
        const existeSpiderman = await Spidermans.findOne({ 
            $or: [
                { Nombre_spiderman }, 
                { Nombre_Real }
            ] 
        });
        
        if (existeSpiderman) {
            return res.status(400).json({ 
                error: "Conflicto de datos",
                mensaje: "Ya existe un Spiderman con ese nombre o identidad secreta",
                spiderman_existente: existeSpiderman.Nombre_spiderman
            });
        }

        // Manejo de imagen
        let nombreArchivo = "";
        if (imagen?.startsWith('http')) {
            try {
                nombreArchivo = await descargarImagenDesdeURL(imagen);
            } catch (error) {
                console.error("Error al descargar imagen:", error);
                return res.status(400).json({
                    error: "Error al procesar imagen",
                    mensaje: "No se pudo descargar la imagen desde la URL proporcionada"
                });
            }
        }

        // Crear nuevo Spiderman
        const spidermanNuevo = new Spidermans({ 
            Nombre_Real, 
            Nombre_spiderman, 
            Tierra, 
            Habilidades,
            imagen: nombreArchivo 
        });
        
        await spidermanNuevo.save();
        
        res.status(201).json({
            ...spidermanNuevo._doc,
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

// Actualizar Spiderman
const actualizar = async (req, res) => {
    try {
        if (req.user.rol !== 1) {
            return res.status(403).json({ 
                msj: "No tienes permisos para efectuar esta acción",
                rol_requerido: "Administrador (1)",
                rol_actual: req.user.rol
            });
        }

        const { Nombre_Real, Nombre_spiderman, Tierra, Habilidades, imagen } = req.body;
        let spidermanParam = req.params.nombre_spiderman;
        
        // Validación de campos
        const errores = [];
        if (!Nombre_Real?.trim()) errores.push("Nombre_Real es requerido");
        if (!Nombre_spiderman?.trim()) errores.push("Nombre_spiderman es requerido");
        if (!Tierra?.trim()) errores.push("Tierra es requerida");
        if (!Array.isArray(Habilidades)) errores.push("Habilidades debe ser un array");
        if (Habilidades?.length === 0) errores.push("Debe tener al menos una habilidad");
        
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
                nombreArchivo = await descargarImagenDesdeURL(imagen);
            } catch (error) {
                console.error("Error al descargar imagen:", error);
                return res.status(400).json({
                    error: "Error al procesar imagen",
                    mensaje: "No se pudo descargar la imagen desde la URL proporcionada"
                });
            }
        }

        const datosActualizacion = { 
            Nombre_Real, 
            Nombre_spiderman, 
            Tierra, 
            Habilidades 
        };

        if (nombreArchivo) {
            datosActualizacion.imagen = nombreArchivo;
        }

        const spidermanExistente = await Spidermans.findOne({ "Nombre_spiderman": spidermanParam });
        
        if (!spidermanExistente) {
            // Crear nuevo si no existe
            const spidermanNuevo = new Spidermans({ 
                Nombre_Real, 
                Nombre_spiderman, 
                Tierra, 
                Habilidades,
                imagen: nombreArchivo 
            });
            await spidermanNuevo.save();
            return res.status(201).json({ 
                msj: "Spiderman no existía, pero se creó uno nuevo", 
                spiderman: {
                    ...spidermanNuevo._doc,
                    imagen: construirUrlImagen(req, nombreArchivo)
                } 
            });
        }
        
        // Verificar si el nuevo nombre ya existe para otro Spiderman
        if (Nombre_spiderman !== spidermanParam) {
            const nombreExistente = await Spidermans.findOne({ 
                Nombre_spiderman, 
                _id: { $ne: spidermanExistente._id } 
            });
            if (nombreExistente) {
                return res.status(400).json({ 
                    error: "Conflicto de datos",
                    mensaje: "Ya existe otro Spiderman con ese nombre",
                    spiderman_existente: nombreExistente.Nombre_spiderman
                });
            }
        }
        
        // Actualizar el Spiderman existente
        const spidermanActualizado = await Spidermans.findOneAndUpdate(
            { "Nombre_spiderman": spidermanParam },
            datosActualizacion,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({ 
            msj: "Spiderman actualizado correctamente!",
            spiderman: {
                ...spidermanActualizado._doc,
                imagen: construirUrlImagen(req, spidermanActualizado.imagen)
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

// Eliminar Spiderman
const eliminar = async (req, res) => {
    try {
        if (req.user.rol !== 1) {
            return res.status(403).json({ 
                msj: "No tienes permisos para efectuar esta acción",
                rol_requerido: "Administrador (1)",
                rol_actual: req.user.rol
            });
        }

        let nombre_spiderman = req.params.nombre_spiderman;
        const spidermanExistente = await Spidermans.findOne({ "Nombre_spiderman": nombre_spiderman });
        
        if (!spidermanExistente) {
            return res.status(404).json({ 
                error: "Spiderman no encontrado",
                nombre_buscado: nombre_spiderman
            });
        }
        
        // Eliminar la imagen asociada si existe
        if (spidermanExistente.imagen) {
            await eliminarImagen(spidermanExistente.imagen);
        }
        
        await Spidermans.deleteOne({ "Nombre_spiderman": nombre_spiderman });
        
        res.status(200).json({ 
            msj: "Spiderman eliminado correctamente!",
            spiderman: {
                ...spidermanExistente._doc,
                imagen: construirUrlImagen(req, spidermanExistente.imagen)
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