require('dotenv').config();
const express = require('express');
const cors = require('cors');

const enviarCodigoEmailRoutes = require('../routes/enviarCodigoEmail');
const cadastrarLoginRoutes = require('../routes/cadastrarLogin');
const loginRoutes = require('../routes/login');
const cadastrarClienteRoutes = require('../routes/cadastrarCliente');
const lerClientesRoutes = require('../routes/lerCliente');
const lerCampanhaRoutes = require('../routes/lerCampanha');
const editarClienteRoutes = require('../routes/editarCliente');
const deletarClienteRoutes = require('../routes/deletarCliente');
const deletarCampanhaRoutes = require('../routes/deletarCampanha');
const cadastrarCampanhaRoutes = require('../routes/cadastrarCampanha');
const atualizarCampanhaRoutes = require('../routes/atualizarCampanha');
const promotorRoutes = require('../routes/promotor');
const rodarNPSRoutes = require('../routes/rodarNPS');

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
app.use('/lerCampanha', lerCampanhaRoutes);
app.use('/editarCliente', editarClienteRoutes);
app.use('/deletarCliente', deletarClienteRoutes);
app.use('/deletarCampanha', deletarCampanhaRoutes);
app.use('/cadastrarCampanha', cadastrarCampanhaRoutes);
app.use('/atualizarCampanha', atualizarCampanhaRoutes);
app.use('/promotor', promotorRoutes);
app.use('/rodarNPS', rodarNPSRoutes);



app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');

});
