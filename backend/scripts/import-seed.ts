import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedAssunto {
  id: string;
  semana: string;
  semanaOrdem: [number, string];
  metaNumero: string;
  disciplina: string;
  assunto: string;
  pdfSemanaArquivo: string;
  paginaInicio: number | null;
  paginaFim: number | null;
  leituraBase: { disponivel: boolean; nomePdfBase: string | null };
  legislacao: { texto: string }[];
  questoesFiltro: {
    banca: string;
    disciplina: string;
    assunto: string;
    nivel: string;
    area: string;
    modalidade: string;
    quantidadeSugerida: number | null;
  } | null;
  observacoes: string[];
  passoAPassoBruto: string;
}

interface Seed {
  disciplinas: string[];
  assuntos: SeedAssunto[];
}

async function main() {
  const seedPath = path.join(__dirname, "..", "..", "seed", "seed.json");
  const seed: Seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

  console.log(`Importando ${seed.assuntos.length} assuntos...`);

  for (const a of seed.assuntos) {
    await prisma.assunto.upsert({
      where: { id: a.id },
      update: {
        semana: a.semana,
        semanaOrdemNum: a.semanaOrdem[0],
        semanaOrdemSuf: a.semanaOrdem[1] || "",
        metaNumero: a.metaNumero,
        disciplina: a.disciplina,
        assunto: a.assunto,
        pdfSemanaArquivo: a.pdfSemanaArquivo,
        paginaInicio: a.paginaInicio,
        paginaFim: a.paginaFim,
        passoAPassoBruto: a.passoAPassoBruto,
      },
      create: {
        id: a.id,
        semana: a.semana,
        semanaOrdemNum: a.semanaOrdem[0],
        semanaOrdemSuf: a.semanaOrdem[1] || "",
        metaNumero: a.metaNumero,
        disciplina: a.disciplina,
        assunto: a.assunto,
        pdfSemanaArquivo: a.pdfSemanaArquivo,
        paginaInicio: a.paginaInicio,
        paginaFim: a.paginaFim,
        passoAPassoBruto: a.passoAPassoBruto,
      },
    });

    await prisma.leituraBase.upsert({
      where: { assuntoId: a.id },
      update: { disponivel: a.leituraBase.disponivel, nomePdfBase: a.leituraBase.nomePdfBase },
      create: {
        assuntoId: a.id,
        disponivel: a.leituraBase.disponivel,
        nomePdfBase: a.leituraBase.nomePdfBase,
      },
    });

    await prisma.resumoConteudo.upsert({
      where: { assuntoId: a.id },
      update: { paginaInicio: a.paginaInicio, paginaFim: a.paginaFim },
      create: { assuntoId: a.id, paginaInicio: a.paginaInicio, paginaFim: a.paginaFim },
    });

    if (a.questoesFiltro) {
      await prisma.questoesFiltro.upsert({
        where: { assuntoId: a.id },
        update: {
          banca: a.questoesFiltro.banca,
          disciplina: a.questoesFiltro.disciplina,
          assuntoCodigo: a.questoesFiltro.assunto,
          nivel: a.questoesFiltro.nivel,
          area: a.questoesFiltro.area,
          modalidade: a.questoesFiltro.modalidade,
          quantidadeSugerida: a.questoesFiltro.quantidadeSugerida,
        },
        create: {
          assuntoId: a.id,
          banca: a.questoesFiltro.banca,
          disciplina: a.questoesFiltro.disciplina,
          assuntoCodigo: a.questoesFiltro.assunto,
          nivel: a.questoesFiltro.nivel,
          area: a.questoesFiltro.area,
          modalidade: a.questoesFiltro.modalidade,
          quantidadeSugerida: a.questoesFiltro.quantidadeSugerida,
        },
      });
    }

    // legislacao itens: só cria na primeira importação. Reimportar não deve apagar o
    // progresso (concluido) que o usuário já marcou nos itens existentes.
    const existingLegislacao = await prisma.legislacaoItem.count({ where: { assuntoId: a.id } });
    if (existingLegislacao === 0 && a.legislacao.length) {
      await prisma.legislacaoItem.createMany({
        data: a.legislacao.map((item, idx) => ({
          assuntoId: a.id,
          texto: item.texto,
          ordem: idx,
        })),
      });
    }

    await prisma.observacao.deleteMany({ where: { assuntoId: a.id } });
    if (a.observacoes.length) {
      await prisma.observacao.createMany({
        data: a.observacoes.map((texto) => ({ assuntoId: a.id, texto })),
      });
    }
  }

  console.log("Importação concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
