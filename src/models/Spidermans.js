import mongoose from "mongoose";

const SpidermanModelo = new mongoose.Schema({
    Nombre_Real: { 
        type: String, 
        required: true,
        trim: true
    },
    Nombre_spiderman: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    Tierra: { 
        type: String, 
        required: true,
        trim: true
    },
    Habilidades: { 
        type: [String],  
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: "Debe tener al menos una habilidad"
        }
    },
    imagen: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Spidermans', SpidermanModelo);