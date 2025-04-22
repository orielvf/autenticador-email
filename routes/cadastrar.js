const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexão com o banco de dados
const router = express.Router();

router.post('/', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const senhaHash = await bcrypt.hash(senha, 10);

        await pool.query(
            'INSERT INTO usuarios (email, senha_hash) VALUES ($1, $2)',
            [email, senhaHash]
        );

        res.status(201).json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar usuário.' });
    }
});

module.exports = router;
