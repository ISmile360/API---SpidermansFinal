import Aliados from "../models/Aliados.js";
import { descargarImagenDesdeURL, eliminarImagen } from "../../utils/fileUtils.js";

// Función para construir la URL de la imagen
const construirUrlImagen = (req, nombreArchivo) => {
    if (!nombreArchivo) return "";
    return `${req.protocol}://${req.get('host')}/api/aliados/imagen/${nombreArchivo}`;
};

const consulta = async (req, res) => {
    try {
        const aliados = await Aliados.find();
        const aliadosConImagen = aliados.map(aliado => ({
            ...aliado._doc,
            imagen: construirUrlImagen(req, aliado.imagen)
        }));
        res.json(aliadosConImagen);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            detalles: "Error al consultar todos los aliados"
        });
    }
};

const consulta_individual = async (req, res) => {
    try {
        const aliado = await Aliados.findOne({ "alias": req.params.alias });
        
        if (!aliado) {
            return res.status(404).json({ 
                error: "Aliado no encontrado",
                alias_buscado: req.params.alias
            });
        }
        
        res.json({
            ...aliado._doc,
            imagen: construirUrlImagen(req, aliado.imagen)
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            detalles: "Error al consultar aliado individual"
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

        const { nombre_real, alias, relacion, habilidades, primera_aparicion, imagen } = req.body;
        
        // Validación de campos
        const errores = [];
        if (!nombre_real?.trim()) errores.push("nombre_real es requerido");
        if (!alias?.trim()) errores.push("alias es requerido");
        if (!relacion?.trim()) errores.push("relacion es requerida");
        if (!Array.isArray(habilidades)) errores.push("habilidades debe ser un array");
        if (habilidades?.length === 0) errores.push("Debe tener al menos una habilidad");
        if (!primera_aparicion?.trim()) errores.push("primera_aparicion es requerida");
        
        if (errores.length > 0) {
            return res.status(400).json({ 
                error: "Validación fallida",
                detalles: errores
            });
        }

        // Verificar duplicados
        const existeAliado = await Aliados.findOne({ 
            $or: [
                { alias }, 
                { nombre_real }
            ] 
        });
        
        if (existeAliado) {
            return res.status(400).json({ 
                error: "Conflicto de datos",
                mensaje: "Ya existe un aliado con ese alias o nombre real",
                aliado_existente: existeAliado.alias
            });
        }

        // Manejo de imagen
        let nombreArchivo = "";
        if (imagen?.startsWith('http')) {
            try {
                nombreArchivo = await descargarImagenDesdeURL(imagen, 'aliados');
            } catch (error) {
                console.error("Error al descargar imagen:", error);
                return res.status(400).json({
                    error: "Error al procesar imagen",
                    mensaje: "No se pudo descargar la imagen desde la URL proporcionada"
                });
            }
        }

        // Crear nuevo aliado
        const aliadoNuevo = new Aliados({ 
            nombre_real, 
            alias, 
            relacion, 
            habilidades,
            primera_aparicion,
            imagen: nombreArchivo 
        });
        
        await aliadoNuevo.save();
        
        res.status(201).json({
            ...aliadoNuevo._doc,
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

        const { nombre_real, alias, relacion, habilidades, primera_aparicion, imagen } = req.body;
        const aliasParam = req.params.alias;
        
        // Validación de campos
        const errores = [];
        if (!nombre_real?.trim()) errores.push("nombre_real es requerido");
        if (!alias?.trim()) errores.push("alias es requerido");
        if (!relacion?.trim()) errores.push("relacion es requerida");
        if (!Array.isArray(habilidades)) errores.push("habilidades debe ser un array");
        if (habilidades?.length === 0) errores.push("Debe tener al menos una habilidad");
        if (!primera_aparicion?.trim()) errores.push("primera_aparicion es requerida");
        
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
                nombreArchivo = await descargarImagenDesdeURL(imagen, 'aliados');
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
            alias, 
            relacion, 
            habilidades,
            primera_aparicion
        };

        if (nombreArchivo) {
            datosActualizacion.imagen = nombreArchivo;
        }

        const aliadoExistente = await Aliados.findOne({ "alias": aliasParam });
        
        if (!aliadoExistente) {
            // Crear nuevo si no existe
            const aliadoNuevo = new Aliados({ 
                nombre_real, 
                alias, 
                relacion, 
                habilidades,
                primera_aparicion,
                imagen: nombreArchivo 
            });
            await aliadoNuevo.save();
            return res.status(201).json({ 
                msj: "Aliado no existía, pero se creó uno nuevo", 
                aliado: {
                    ...aliadoNuevo._doc,
                    imagen: construirUrlImagen(req, nombreArchivo)
                } 
            });
        }
        
        // Verificar si el nuevo alias ya existe para otro aliado
        if (alias !== aliasParam) {
            const aliasExistente = await Aliados.findOne({ 
                alias, 
                _id: { $ne: aliadoExistente._id } 
            });
            if (aliasExistente) {
                return res.status(400).json({ 
                    error: "Conflicto de datos",
                    mensaje: "Ya existe otro aliado con ese alias",
                    aliado_existente: aliasExistente.alias
                });
            }
        }
        
        // Eliminar imagen anterior si se está actualizando
        if (nombreArchivo && aliadoExistente.imagen) {
            await eliminarImagen(aliadoExistente.imagen, 'aliados');
        }
        
        // Actualizar el aliado existente
        const aliadoActualizado = await Aliados.findOneAndUpdate(
            { "alias": aliasParam },
            datosActualizacion,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({ 
            msj: "Aliado actualizado correctamente!",
            aliado: {
                ...aliadoActualizado._doc,
                imagen: construirUrlImagen(req, aliadoActualizado.imagen)
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

        const alias = req.params.alias;
        const aliadoExistente = await Aliados.findOne({ "alias": alias });
        
        if (!aliadoExistente) {
            return res.status(404).json({ 
                error: "Aliado no encontrado",
                alias_buscado: alias
            });
        }
        
        // Eliminar la imagen asociada si existe
        if (aliadoExistente.imagen) {
            await eliminarImagen(aliadoExistente.imagen, 'aliados');
        }
        
        await Aliados.deleteOne({ "alias": alias });
        
        res.status(200).json({ 
            msj: "Aliado eliminado correctamente!",
            aliado: {
                ...aliadoExistente._doc,
                imagen: construirUrlImagen(req, aliadoExistente.imagen)
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