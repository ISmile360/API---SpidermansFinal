import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.header("Autorizacion");
    try{
        if (!token) return res.status(500).json({"msj":"se ha generado un error, no se ha proporcionado un token!"});
        const decodificado = jwt.verify(token.replace("Back ",""),process.env.JWT_SECRET);
        
        if(!decodificado) return res.status(500).json({"msj":"El token proporcionado no es valido"});

        req.user = decodificado;
        next();
    }catch(error) {
        res.status(500).json({"msj": "Se ha generado un error token no valido"})
    }
}
export default authMiddleware;