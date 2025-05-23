import mongoose from "mongoose";

const VillanoSchema = new mongoose.Schema({
    nombre_real: { 
        type: String, 
        required: true,
        trim: true
    },      
    nombre_villano: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },   
    tierra: { 
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
    imagen: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

export default mongoose.model('villano', VillanoSchema);