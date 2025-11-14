import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import usuariosRouter from './routes/Web.js'; 
import aliadosRouter from './routes/Aliados.js'
import spidermansRouter from './routes/spidermans.js';
import villanosRouter from './routes/villanos.js';
import Conexion from './config/Conexion.js';


const app = express();
const PUERTO = process.env.PUERTO || 3016;
const allowedOrigins = [
  'https://noveno.codeseiryu.com.mx',
  'https://novenosis.xyz',
  'http://localhost:3000',
  'http://localhost:8081'
];
const corsOptions = {
  origin:(origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(' CORS bloqueado para:', origin);
      callback(new Error('CORS no permitido para este origen'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization','autorizacion'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Conexión a la base de datos
Conexion();

// Routers (con prefijos)
app.use("/api/test",express.static("uploads/aliados"))
app.use('/api/usuarios', usuariosRouter); 
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

 const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/novenosis.xyz/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/novenosis.xyz/fullchain.pem')
};

https.createServer(options, app).listen(PUERTO, () => {
  console.log(`Servidor HTTPS corriendo en puerto ${PUERTO}`);
});