const express = require('express');
const router = express.Router();
const pool = require('../db');
const fetch = require('node-fetch');

function stringParaArray(texto) {
    if (!texto || texto.trim() === '') return [];
    return texto.split(',').map(id => id.trim());
}

function arrayParaString(arrayIds) {
    return arrayIds.join(',');
}

function adicionarId(campoTexto, novoId) {
    const arrayIds = stringParaArray(campoTexto);
    const novoIdStr = novoId.toString();
    if (!arrayIds.includes(novoIdStr)) {
        arrayIds.push(novoIdStr);
    }
    return arrayParaString(arrayIds);
}

router.post('/', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ sucesso: false, mensagem: 'ID da campanha é obrigatório.' });
    }

    try {
        const { rows: campanhas } = await pool.query('SELECT * FROM campanhas WHERE id = $1', [id]);
        if (campanhas.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: 'Campanha não encontrada.' });
        }
        const campanha = campanhas[0];

        const { rows: usuarios } = await pool.query('SELECT npswebhook FROM usuarios WHERE id = $1', [campanha.usuario_id]);
        if (usuarios.length === 0 || !usuarios[0].npswebhook) {
            return res.status(400).json({ sucesso: false, mensagem: 'URL do webhook não encontrada para este usuário.' });
        }
        const url = usuarios[0].npswebhook;

        let clientesRegistrados = stringParaArray(campanha.clientes_registrados);
        let clientesEnviados = stringParaArray(campanha.clientes_enviados);

        const { rows: clientesDisponiveis } = await pool.query(
            `SELECT id, nome, telefone FROM clientes 
             WHERE usuario_id = $1 AND ativo = true 
             AND NOT (id = ANY($2::int[]))`,
            [campanha.usuario_id, clientesEnviados.length ? clientesEnviados.map(Number) : [0]]
        );

        const totalDesejado = campanha.quantidadealeatoria || 0;
        const totalAtuais = clientesRegistrados.length;
        const novosClientes = [];

        for (const cliente of clientesDisponiveis) {
            if (clientesRegistrados.includes(cliente.id.toString())) continue;
            if (totalAtuais + novosClientes.length >= totalDesejado) break;
            novosClientes.push(cliente.id.toString());
        }

        clientesRegistrados = clientesRegistrados.concat(novosClientes);

        await pool.query(
            `UPDATE campanhas SET clientes_registrados = $1 WHERE id = $2`,
            [arrayParaString(clientesRegistrados), id]
        );

        const idsParaEnviar = clientesRegistrados.filter(c => !clientesEnviados.includes(c));

        if (idsParaEnviar.length === 0) {
            console.log(`[RODAR NPS] Campanha ${id} já foi enviada para todos os clientes.`);
            return res.json({ sucesso: true, mensagem: 'Campanha já foi enviada para todos os clientes.' });
        }

        console.log(`[RODAR NPS] Iniciando envio para ${idsParaEnviar.length} clientes da campanha ${id}...`);

        let index = 0;

        const intervalId = setInterval(async () => {
            if (index >= idsParaEnviar.length) {
                clearInterval(intervalId);
                console.log(`[RODAR NPS] Todos os envios da campanha ${id} foram concluídos.`);
                await pool.query(
                    `UPDATE campanhas SET clientes_enviados = $1 WHERE id = $2`,
                    [arrayParaString(clientesEnviados), id]
                );
                return;
            }

            const clientId = parseInt(idsParaEnviar[index]);

            try {
                const { rows: clienteRows } = await pool.query(
                    'SELECT id, nome, telefone FROM clientes WHERE id = $1',
                    [clientId]
                );

                if (clienteRows.length === 0) {
                    console.log(`[RODAR NPS] Cliente ${clientId} não encontrado, pulando.`);
                    index++;
                    return;
                }

                const cliente = clienteRows[0];

                console.log(`[RODAR NPS] Enviando cliente ${cliente.id} para ${url}`);

                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: cliente.id,
                        nome: cliente.nome,
                        telefone: cliente.telefone,
                    }),
                });

                console.log(`[RODAR NPS] Enviado com sucesso: ${cliente.id}`);

                await pool.query(
                    `UPDATE clientes SET pendente = true WHERE id = $1`,
                    [cliente.id]
                );

                clientesEnviados.push(cliente.id.toString());

                await pool.query(
                    `UPDATE campanhas SET clientes_enviados = $1 WHERE id = $2`,
                    [arrayParaString(clientesEnviados), id]
                );

            } catch (erro) {
                console.error(`[RODAR NPS] Erro ao enviar cliente ${clientId}:`, erro);
            }

            index++;
        }, 20000);

        res.json({ sucesso: true, mensagem: 'Envio iniciado. Verifique os logs para acompanhar o progresso.' });

    } catch (erro) {
        console.error('[RODAR NPS] Erro:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao rodar campanha.' });
    }
});

module.exports = router;
