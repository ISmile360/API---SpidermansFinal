import { Router } from 'express';
import {
    actualizar,
    consulta, 
    consulta_individual, 
    insercion, 
    eliminar, 
    registro_usuario, 
    iniciar_sesion,
    listarUsuariosParaAdmin,
    cambiarEstadoUsuario,
    cerrar_sesion
} from "../controllers/Usuarios.controller.js";

const router = Router();

// Rutas públicas
router.post("/registro", registro_usuario);
router.post("/login", iniciar_sesion);

// Rutas protegidas
router.get("/", consulta);
router.get("/usuario/:nombre", consulta_individual);
router.post("/insercion", insercion);
router.put("/actualizar/:id", actualizar);
router.delete("/eliminar/:id", eliminar);

// Rutas de administrador
router.get('/admin', listarUsuariosParaAdmin);
router.put('/estado/:id', cambiarEstadoUsuario);

// Nueva ruta para cerrar sesión
router.put('/logout/:id', cerrar_sesion);

export default router;