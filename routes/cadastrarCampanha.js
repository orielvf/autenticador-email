const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    try {
        const { nome, descricao, data_inicio, data_termino, quantidadeAleatoria, usuario_id } = req.body;

        const novaCampanha = await prisma.campanha.create({
            data: {
                nome,
                descricao,
                data_inicio: new Date(data_inicio),
                data_termino: new Date(data_termino),
                quantidadeAleatoria,
                usuario_id,
            },
        });

        res.status(201).json(novaCampanha);
    } catch (error) {
        console.error("Erro ao cadastrar campanha:", error);
        res.status(500).json({ error: "Erro ao cadastrar campanha" });
    }
});

module.exports = router;
