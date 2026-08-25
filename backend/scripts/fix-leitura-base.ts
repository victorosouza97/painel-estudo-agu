import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedAssunto {
  id: string;
  leituraBase: { disponivel: boolean };
}
interface Seed {
  assuntos: SeedAssunto[];
}

// Itens de legislação que na verdade eram a leitura do PDF Base (extraídos antes do
// regex ser corrigido). Removemos qualquer item cujo texto contenha "PDF Base".
const PDF_BASE_RE = /PDF Base/i;

async function main() {
  const seedPath = path.join(__dirname, "..", "..", "seed", "seed.json");
  const seed: Seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

  let disponivelAtualizados = 0;
  let itensRemovidos = 0;

  for (const a of seed.assuntos) {
    if (a.leituraBase.disponivel) {
      const lb = await prisma.leituraBase.updateMany({
        where: { assuntoId: a.id, disponivel: false },
        data: { disponivel: true },
      });
      disponivelAtualizados += lb.count;
    }

    const bogus = await prisma.legislacaoItem.findMany({
      where: { assuntoId: a.id },
    });
    for (const item of bogus) {
      if (PDF_BASE_RE.test(item.texto)) {
        await prisma.legislacaoItem.delete({ where: { id: item.id } });
        itensRemovidos++;
      }
    }
  }

  console.log(`leituraBase.disponivel corrigido em ${disponivelAtualizados} assunto(s).`);
  console.log(`${itensRemovidos} item(ns) de legislação (PDF Base mal classificado) removido(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
