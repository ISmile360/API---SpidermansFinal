import mongoose from "mongoose";

const AliadoModelo = new mongoose.Schema({
    nombre_real: { 
        type: String, 
        required: true,
        trim: true
    },
    alias: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    relacion: { 
        type: String, 
        required: true,
        trim: true
    },
    habilidades: { 
        type: [String], 
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: "Debe tener al menos una habilidad"
        }
    },
    primera_aparicion: { 
        type: String,  
        required: true,
        trim: true
    },
    imagen: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Aliados', AliadoModelo);