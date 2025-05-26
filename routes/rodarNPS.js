const express = require('express');
const router = express.Router();
const pool = require('../db'); // sua conexão com PostgreSQL
const fetch = require('node-fetch'); // se usar Node 18+ pode usar global fetch, senão instale node-fetch

function stringParaArray(texto) {
    if (!texto || texto.trim() === '') return [];
    return texto.split(',').map(id => id.trim());
}

function arrayParaString(arrayIds) {
    return arrayIds.join(',');
}

function adicionarId(campoTexto, novoId) {
    let arrayIds = stringParaArray(campoTexto);
    const novoIdStr = novoId.toString();
    if (!arrayIds.includes(novoIdStr)) {
        arrayIds.push(novoIdStr);
    }
    return arrayParaString(arrayIds);
}

router.post('/', async (req, res) => {
    const { idCampanha, url } = req.body;
    if (!idCampanha || !url) {
        return res.status(400).json({ sucesso: false, mensagem: 'idCampanha e url são obrigatórios.' });
    }

    try {
        // Pegar a campanha
        const { rows: campanhas } = await pool.query('SELECT * FROM campanhas WHERE id = $1', [idCampanha]);
        if (campanhas.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: 'Campanha não encontrada.' });
        }
        const campanha = campanhas[0];

        // Campos de IDs (clientes registrados e clientes enviados) — pode ser NULL
        let clientesRegistrados = stringParaArray(campanha.clientes_registrados);
        let clientesEnviados = stringParaArray(campanha.clientes_enviados);

        // Buscar clientes ativos do usuário da campanha que ainda não foram enviados
        const { rows: clientesDisponiveis } = await pool.query(
            `SELECT id, nome, telefone FROM clientes 
       WHERE usuario_id = $1 AND ativo = true 
       AND NOT (id = ANY($2::int[]))`,
            [campanha.usuario_id, clientesEnviados.map(id => parseInt(id))]
        );

        // Adicionar clientes novos até a quantidade aleatória da campanha
        const totalDesejado = campanha.quantidadealeatoria || 0;
        const totalAtuais = clientesRegistrados.length;
        let novosClientes = [];

        for (const cliente of clientesDisponiveis) {
            if (clientesRegistrados.includes(cliente.id.toString())) continue;
            if (totalAtuais + novosClientes.length >= totalDesejado) break;
            novosClientes.push(cliente.id.toString());
        }

        clientesRegistrados = clientesRegistrados.concat(novosClientes);

        // Atualizar clientes_registrados no banco (sem duplicação)
        await pool.query(
            `UPDATE campanhas SET clientes_registrados = $1 WHERE id = $2`,
            [arrayParaString(clientesRegistrados), idCampanha]
        );

        // Preparar lista de clientes para enviar: aqueles registrados que ainda não foram enviados
        const idsParaEnviar = clientesRegistrados.filter(id => !clientesEnviados.includes(id));

        if (idsParaEnviar.length === 0) {
            console.log(`[RODAR NPS] Campanha ${idCampanha} já enviou para todos os clientes.`);
            return res.json({ sucesso: true, mensagem: 'Campanha já foi enviada para todos os clientes.' });
        }

        console.log(`[RODAR NPS] Iniciando envio para ${idsParaEnviar.length} clientes da campanha ${idCampanha}...`);

        let index = 0;

        const intervalId = setInterval(async () => {
            if (index >= idsParaEnviar.length) {
                clearInterval(intervalId);
                console.log(`[RODAR NPS] Todos os envios da campanha ${idCampanha} foram concluídos.`);

                // Atualizar campanha marcando que todos os clientes foram enviados
                await pool.query(
                    `UPDATE campanhas SET clientes_enviados = $1 WHERE id = $2`,
                    [arrayParaString(clientesRegistrados), idCampanha]
                );

                return;
            }

            const clientId = parseInt(idsParaEnviar[index]);

            // Buscar dados do cliente para enviar
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

            try {
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

                // Atualizar clientes_enviados (sem duplicação)
                const atualClientesEnviados = await pool.query('SELECT clientes_enviados FROM campanhas WHERE id = $1', [idCampanha]);
                let enviadosAtuais = stringParaArray(atualClientesEnviados.rows[0].clientes_enviados);
                enviadosAtuais = adicionarId(arrayParaString(enviadosAtuais), cliente.id);
                await pool.query(
                    `UPDATE campanhas SET clientes_enviados = $1 WHERE id = $2`,
                    [enviadosAtuais, idCampanha]
                );
            } catch (erro) {
                console.error(`[RODAR NPS] Erro ao enviar cliente ${cliente.id}:`, erro);
            }

            index++;
        }, 20000); // 20 segundos entre envios

        res.json({ sucesso: true, mensagem: 'Envio iniciado. Verifique os logs para acompanhar o progresso.' });

    } catch (erro) {
        console.error('[RODAR NPS] Erro:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao rodar campanha.' });
    }
});

module.exports = router;
