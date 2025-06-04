const express = require('express');
const router = express.Router();
const pool = require('../db');

function stringParaArray(texto) {
    if (!texto || texto.trim() === '') return [];
    return texto.split(',').map(id => id.trim());
}

function arrayParaString(arrayIds) {
    return arrayIds.join(',');
}

router.post('/', async (req, res) => {
    const { idCampanha } = req.body;
    if (!idCampanha) {
        return res.status(400).json({ sucesso: false, mensagem: 'idCampanha é obrigatório.' });
    }

    try {
        const { rows: campanhas } = await pool.query('SELECT * FROM campanhas WHERE id = $1', [idCampanha]);
        if (campanhas.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: 'Campanha não encontrada.' });
        }
        const campanha = campanhas[0];

        let clientesRegistrados = stringParaArray(campanha.clientes_registrados);

        const { rows: clientesDisponiveis } = await pool.query(
            `SELECT id FROM clientes 
             WHERE usuario_id = $1 
             AND ativo = true 
             AND pendente = false 
             AND apoiador = false 
             AND promotor = false 
             AND retrator = false
             AND NOT (id = ANY($2::int[]))`,
            [campanha.usuario_id, clientesRegistrados.map(id => parseInt(id))]
        );

        const totalDesejado = campanha.quantidadealeatoria || 0;
        const totalAtuais = clientesRegistrados.length;
        let novosClientes = [];

        for (const cliente of clientesDisponiveis) {
            if (totalAtuais + novosClientes.length >= totalDesejado) break;
            novosClientes.push(cliente.id.toString());
        }

        clientesRegistrados = clientesRegistrados.concat(novosClientes);

        await pool.query(
            `UPDATE campanhas SET clientes_registrados = $1 WHERE id = $2`,
            [arrayParaString(clientesRegistrados), idCampanha]
        );

        console.log(`[POPULA CAMPANHA] Clientes registrados atualizados na campanha ${idCampanha}.`);

        // 🔥 Chamar a outra rota "rodarNPS" usando fetch
        await fetch("https://autenticador-email-production.up.railway.app/rodarCampanhaNPS", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idCampanha })
        });

        res.json({ sucesso: true, mensagem: 'Clientes registrados atualizados e NPS iniciado.' });

    } catch (erro) {
        console.error('[POPULA CAMPANHA] Erro:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar clientes registrados.' });
    }
});

module.exports = router;
