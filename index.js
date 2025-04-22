require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar as rotas com nomes diferentes
const enviarCodigoEmailRoutes = require('./routes/enviarCodigoEmail');
const cadastrarRoutes = require('./routes/cadastrar');

const app = express();

app.use(cors());
app.use(express.json());

// Usar as rotas com caminhos apropriados
app.use('/enviarCodigoEmail', enviarCodigoEmailRoutes);
app.use('/cadastrar', cadastrarRoutes);

app.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
