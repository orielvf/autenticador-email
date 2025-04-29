require('dotenv').config();
const express = require('express');
const cors = require('cors');

const enviarCodigoEmailRoutes = require('./routes/enviarCodigoEmail');
const cadastrarLoginRoutes = require('./routes/cadastrarLogin');
const loginRoutes = require('./routes/login');
const cadastrarClienteRoutes = require('./routes/cadastrarCliente');
const lerClientesRoutes = require('./routes/lerCliente');
const editarClienteRoutes = require('./routes/editarCliente');
const deletarClienteRoutes = require('./routes/deletarCliente');

const app = express();

app.use(cors());
app.use(express.json());

// Aqui! Middleware para logar todas as requisições:
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    console.log('Body:', req.body);
    next();
});

app.use('/enviarCodigoEmail', enviarCodigoEmailRoutes);
app.use('/cadastrarLogin', cadastrarLoginRoutes);
app.use('/login', loginRoutes);
app.use('/cadastrarCliente', cadastrarClienteRoutes);
app.use('/lerClientes', lerClientesRoutes);
app.use('/editarCliente', editarClienteRoutes);
app.use('/deletarCliente', deletarClienteRoutes);


app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
