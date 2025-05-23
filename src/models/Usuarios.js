import mongoose from "mongoose";

const UsuarioModelo = new mongoose.Schema({
    nombre: { type: String, required: true },
    usuario: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    rol: { 
        type: Number, 
        required: true,
        enum: [1, 2, 3] 
    },
    estado: { 
        type: String, 
        required: true,
        enum: ["activo", "inactivo", "deshabilitado"],
        default: "inactivo"
    }
});

export default mongoose.model('Usuarios', UsuarioModelo);