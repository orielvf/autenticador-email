const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexão com o banco de dados
const router = express.Router();

// Rota de login
router.post('/', async (req, res) => {
    console.log('Requisição de login recebida:', req.body);
    const { email, senha } = req.body;

    try {
        // Consultar o banco para encontrar o usuário
        const query = 'SELECT * FROM usuarios WHERE email = $1';
        const { rows } = await pool.query(query, [email]);

        // Verificar se o usuário foi encontrado
        if (rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado',
            });
        }

        const user = rows[0];

        // Verificar se a senha fornecida corresponde à senha_hash no banco
        //console.log('Senha digitada:', senha);
        //console.log('Hash no banco:', user.senha_hash);


        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Credenciais inválidas',
            });
        }

        // Se tudo der certo, retorna a resposta de sucesso
        return res.json({
            sucesso: true,
            mensagem: 'Login bem-sucedido',
            user: { email: user.email, id: user.id },
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao autenticar o usuário',
        });
    }
});

module.exports = router;
