require('dotenv').config();
const express = require('express');
const cors = require('cors');

const enviarCodigoEmailRoutes = require('./routes/enviarCodigoEmail');
const cadastrarRoutes = require('./routes/cadastrar');
const loginRoutes = require('./routes/login');

const app = express();

app.use(cors());
app.use(express.json());

// Aqui! Middleware para logar todas as requisições:
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

app.use('/enviarCodigoEmail', enviarCodigoEmailRoutes);
app.use('/cadastrar', cadastrarRoutes);
app.use('/login', loginRoutes);

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
