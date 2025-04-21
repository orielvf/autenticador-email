const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const codes = {};

router.post('/send-code', async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    codes[email] = code;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,  // Verifique se as variáveis estão corretamente configuradas no .env
            pass: process.env.EMAIL_PASS,  // Se estiver usando uma senha de app do Gmail, insira-a aqui
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Seu código de login',
            text: `Seu código é: ${code}`,
        });

        // Log do envio do e-mail (para depuração)
        console.log('Email enviado: ' + info.response);

        res.json({ ok: true, preview: nodemailer.getTestMessageUrl(info) });
    } catch (error) {
        console.error('Erro ao enviar o e-mail:', error);
        res.status(500).json({ error: 'Erro ao enviar o e-mail. Tente novamente.' });
    }
});

router.post('/verify-code', (req, res) => {
    const { email, code } = req.body;

    // Verifica se o código está presente e é válido
    if (codes[email] && codes[email] === code) {
        delete codes[email];  // Limpa o código após verificação bem-sucedida
        return res.json({ success: true });
    }

    res.status(400).json({ success: false, message: 'Código inválido' });
});

module.exports = router;
