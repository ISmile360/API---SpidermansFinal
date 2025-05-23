import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config()

const Conexion = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            maxPoolSize:10, //numero maximo de conexiones
            minPoolSize: 5  //numero minimo de conexiones
        });
        console.log('✅ Conectado a MongoDB con Pooling');
    } catch (error){
        console.log('🚫 Error en la conexion a MongoDB:', error.message);
        process.exit(1)
    }
};

export default Conexion;