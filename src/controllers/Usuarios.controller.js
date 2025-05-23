import Usuarios from "../models/Usuarios.js";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";

// Función para verificar token con formato personalizado
const verificarTokenPersonalizado = (req) => {
    const authHeader = req.headers.autorizacion;
    
    if (!authHeader) throw new Error('No se proporcionó header de autorización');
    if (!authHeader.startsWith('Back ')) throw new Error('Formato de autorización incorrecto');
    
    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Token no proporcionado');

    return jwt.verify(token, process.env.JWT_SECRET);
};

const consulta = async(req, res) => {
    try {
        const usuarios = await Usuarios.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({"error": error.message});
    }
};

const consulta_individual = async (req, res) => {
    try {
        const nombre = req.params.nombre;
        const usuario = await Usuarios.findOne({ nombre });
        
        if (!usuario) {
            return res.status(404).json({ "error": "El usuario no existe" });
        }
        
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ "error": error.message });
    }
};

const insercion = async(req, res) => {
    try {
        const { nombre, usuario, email, password, rol, estado } = req.body;
        
        if (!nombre || !usuario || !email || !password || !rol || !estado) {
            return res.status(400).json({"error": "Debes llenar todos los campos obligatorios"});
        }
        
        const existeUsuario = await Usuarios.findOne({ $or: [{nombre}, {usuario}, {email}] });
        if (existeUsuario) {
            return res.status(400).json({"error": "Ya existe un usuario con ese nombre, usuario o email"});
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const usuarioNuevo = new Usuarios({
            nombre, 
            usuario, 
            email, 
            password: hashedPassword,
            rol, 
            estado
        });
        
        await usuarioNuevo.save();
        res.status(201).json(usuarioNuevo);
    } catch (error) {
        res.status(500).json({"error": error.message});
    }
};

const actualizar = async (req, res) => {
    try {
        const { nombre, usuario, email, password, rol, estado } = req.body;
        const id = req.params.id;
        
        if (!nombre || !email || !rol || !estado) {
            return res.status(400).json({"error": "Nombre, email, rol y estado son obligatorios"});
        }
        
        const usuarioExistente = await Usuarios.findById(id);
        
        if (!usuarioExistente) {
            return res.status(404).json({"error": "Usuario no encontrado"});
        }
        
        const updateData = { nombre, email, rol, estado };
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        if (usuario && usuario !== usuarioExistente.usuario) {
            const usuarioExiste = await Usuarios.findOne({ usuario });
            if (usuarioExiste) {
                return res.status(400).json({"error": "El nombre de usuario ya está en uso"});
            }
            updateData.usuario = usuario;
        }
        
        const usuarioActualizado = await Usuarios.findByIdAndUpdate(
            id, 
            { $set: updateData },
            { new: true }
        ).select('-password');
        
        res.status(200).json({ 
            "msj": "Actualización correcta!",
            "usuario": usuarioActualizado
        });
    } catch (error) {   
        res.status(500).json({ "error": error.message });
    }
};

const eliminar = async (req, res) => {
    try {
        const id = req.params.id;
        const usuarioExistente = await Usuarios.findById(id);
        
        if (!usuarioExistente) {
            return res.status(404).json({"error": "El usuario no existe"});
        }
        
        await Usuarios.findByIdAndDelete(id);
        res.status(200).json({"msj": "Usuario eliminado correctamente!"});
    } catch (error) {
        res.status(500).json({"error": error.message});
    }
};

const registro_usuario = async (req, res) => {
    try {
        const { nombre, usuario, email, password } = req.body;
        
        if (!nombre || !usuario || !email || !password) {
            return res.status(400).json({"error": "Todos los campos son obligatorios"});
        }
        
        const existeUsuario = await Usuarios.findOne({ $or: [{usuario}, {email}] });
        if (existeUsuario) {
            return res.status(400).json({"error": "El usuario o email ya está registrado"});
        }
        
        const cifrado = await bcrypt.hash(password, 10);
        const registro = new Usuarios({
            nombre,
            usuario,
            email,
            password: cifrado,
            rol: 2,
            estado: "inactivo" // Nuevos usuarios inactivos por defecto
        });
        
        await registro.save();
        res.status(201).json({
            "msj": "Registro exitoso. Ya puedes iniciar sesión.",
            "registro": {
                nombre: registro.nombre,
                usuario: registro.usuario,
                email: registro.email,
                rol: registro.rol,
                estado: registro.estado
            }
        });
    } catch(error) {
        res.status(500).json({"error": error.message});  
    }
};

const iniciar_sesion = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuarios.findOne({ email });

        if (!usuario) {
            return res.status(401).json({ "msj": `El email ${email} no está registrado` });
        }

        // Verificar si está deshabilitado
        if (usuario.estado === 'deshabilitado') {
            return res.status(403).json({ 
                "msj": "Tu cuenta ha sido deshabilitada. Contacta al administrador." 
            });
        }

        const valido = await bcrypt.compare(password, usuario.password);
        if (!valido) {
            return res.status(401).json({ "msj": "Credenciales inválidas" });
        }
        
        // Actualizar a activo al iniciar sesión
        await Usuarios.findByIdAndUpdate(usuario._id, { estado: "activo" });

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol }, 
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        
        res.status(200).json({ 
            "msj": "Inicio de sesión exitoso", 
            "token": token,
            "email": email,
            "rol": usuario.rol,
            "nombre": usuario.nombre
        });
    } catch (error) {
        res.status(500).json({ "msj": "Error en el servidor" });
    }
};

const cerrar_sesion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuarios.findById(id);

        if (!usuario) {
            return res.status(404).json({ "msj": "Usuario no encontrado" });
        }

        // Actualizar estado solo si no está deshabilitado
        if (usuario.estado !== 'deshabilitado') {
            await Usuarios.findByIdAndUpdate(id, { estado: "inactivo" });
        }

        res.status(200).json({ "msj": "Sesión cerrada correctamente" });
    } catch (error) {
        res.status(500).json({ "msj": "Error en el servidor" });
    }
};

const listarUsuariosParaAdmin = async (req, res) => {
    try {
        const decoded = verificarTokenPersonalizado(req);
        
        if (decoded.rol !== 1) {
            return res.status(403).json({ error: "Se requieren privilegios de administrador" });
        }

        const usuarios = await Usuarios.find({}, { password: 0 });
        res.status(200).json(usuarios);
    } catch (error) {
        if (error.message.includes('Formato de autorización incorrecto') || 
            error.message.includes('No se proporcionó')) {
            return res.status(401).json({ error: error.message });
        }
        res.status(500).json({ error: "Error del servidor" });
    }
};

const cambiarEstadoUsuario = async (req, res) => {
    try {
        const decoded = verificarTokenPersonalizado(req);
        
        if (decoded.rol !== 1) {
            return res.status(403).json({ error: "Se requieren privilegios de administrador" });
        }

        const { id } = req.params;
        const { estado } = req.body;

        // Solo permitir cambiar entre inactivo y deshabilitado
        if (!['inactivo', 'deshabilitado'].includes(estado)) {
            return res.status(400).json({ error: "Solo puedes deshabilitar o reactivar cuentas" });
        }

        const usuario = await Usuarios.findByIdAndUpdate(
            id, 
            { estado }, 
            { new: true }
        ).select('-password');

        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        res.status(200).json({
            msj: `Estado del usuario actualizado a ${estado}`,
            usuario
        });
    } catch (error) {
        res.status(500).json({ error: "Error del servidor" });
    }
};


export { 
    consulta, 
    consulta_individual, 
    insercion, 
    actualizar, 
    eliminar,
    registro_usuario,
    iniciar_sesion,
    listarUsuariosParaAdmin,
    cambiarEstadoUsuario,
    cerrar_sesion
};