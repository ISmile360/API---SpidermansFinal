import express from 'express';
import cors from 'cors';
import usuariosRouter from './routes/Web.js'; // Router de usuarios
import aliadosRouter from './routes/Aliados.js'
import spidermansRouter from './routes/spidermans.js';
import villanosRouter from './routes/villanos.js';
import Conexion from './config/Conexion.js';


const app = express();


app.use(express.urlencoded({ extended: true }));


// Middlewares
app.use(express.json()); 
app.use(cors());

// Conexión a la base de datos
Conexion();

// Routers (con prefijos)
app.use("/api/test",express.static("uploads/aliados"))
app.use('/api/usuarios', usuariosRouter); // Todas las rutas de usuarios empezarán con /api/usuarios
app.use('/api/aliados', aliadosRouter);
app.use('/api/spidermans', spidermansRouter);
app.use('/api/villanos', villanosRouter);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Bienvenido a la API de SpiderVerse',
        endpoints: {
            usuarios: '/api/usuarios',
            aliados: '/api/aliados',
            spidermans: '/api/spidermans',
            villanos: '/api/villanos'
        }
    });
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        estatus: "error",
        msj: "Ruta no encontrada",
        rutas_disponibles: {
            usuarios: {
                consulta: 'GET /api/usuarios',
                individual: 'GET /api/usuarios/usuario/:nombre',
                insertar: 'POST /api/usuarios/insercion',
                actualizar: 'PUT /api/usuarios/actualizar/:usuario',
                eliminar: 'DELETE /api/usuarios/eliminar/:usuario'
            },
            aliados: {
                consulta: 'GET /api/aliados',
                individual: 'GET /api/aliados/aliado/:alias',
                insertar: 'POST /api/aliados/insercion',
                actualizar: 'PUT /api/aliados/actualizar/:alias',
                eliminar: 'DELETE /api/aliados/eliminar/:alias'
            },
            spidermans: { // Añade las rutas de Spidermans
        consulta: "GET /api/spidermans",
        individual: "GET /api/spidermans/spiderman/:nombre_spiderman",
        insertar: "POST /api/spidermans/insercion",
        actualizar: "PUT /api/spidermans/actualizar/:nombre_spiderman",
        eliminar: "DELETE /api/spidermans/eliminar/:nombre_spiderman",
        imagen: "GET /api/spidermans/imagen/:nombreArchivo"
      }
            
        }
    });
});

// Configuración del puerto
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`El servidor está corriendo`);
    console.log(`URL: http://localhost:${PUERTO}`);
    console.log('\nEndpoints disponibles:');
    console.log(`- Usuarios: http://localhost:${PUERTO}/api/usuarios`);
    console.log(`- Aliados: http://localhost:${PUERTO}/api/aliados`);
    console.log(`- Spidermans: http://localhost:${PUERTO}/api/spidermans`);
    console.log(`- Villanos: http://localhost:${PUERTO}/api/villanos`);
});