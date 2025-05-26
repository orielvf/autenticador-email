const express = require('express');
const pool = require('../db');
const router = express.Router();

router.post('/atualizarNps', async (req, res) => {
    const { id, npswebhook } = req.body;

    if (!id || !npswebhook) {
        return res.status(400).json({ sucesso: false, mensagem: 'ID e npswebhook são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            'UPDATE usuarios SET npswebhook = $1 WHERE id = $2 RETURNING id, npswebhook',
            [npswebhook, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
        }

        res.json({
            sucesso: true,
            mensagem: 'Webhook NPS atualizado com sucesso!',
            usuario: result.rows[0],
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar webhook NPS.' });
    }
});

module.exports = router;
