const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')

const codes = {}

router.post('/send-code', async (req, res) => {
    const { email } = req.body
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    codes[email] = code

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Seu código de login',
        text: `Seu código é: ${code}`,
    })

    res.json({ ok: true })
})

router.post('/verify-code', (req, res) => {
    const { email, code } = req.body
    if (codes[email] && codes[email] === code) {
        delete codes[email]
        return res.json({ success: true })
    }

    res.json({ success: false })
})

module.exports = router
