const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    const { clients, url } = req.body;

    if (!clients || !Array.isArray(clients) || !url) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Dados inválidos. Envie um array de clients e uma url.',
        });
    }

    console.log(`[RODAR NPS] Iniciando envio para ${clients.length} clientes...`);

    let index = 0;

    const intervalId = setInterval(async () => {
        if (index >= clients.length) {
            clearInterval(intervalId);
            console.log('[RODAR NPS] Todos os envios foram concluídos.');
            return;
        }

        const client = clients[index];
        console.log(`[RODAR NPS] Enviando cliente ${client.id} para ${url}`);

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: client.id,
                    nome: client.nome,
                    telefone: client.telefone,
                }),
            });

            console.log(`[RODAR NPS] Enviado com sucesso: ${client.id}`);
        } catch (erro) {
            console.error(`[RODAR NPS] Erro ao enviar cliente ${client.id}:`, erro);
        }

        index++;
    }, 20000); // 20 segundos

    res.json({ sucesso: true, mensagem: 'Disparo iniciado.' });
});

module.exports = router;
