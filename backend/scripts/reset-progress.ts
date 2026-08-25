import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lb = await prisma.leituraBase.updateMany({
    data: { concluido: false, concluidoEm: null },
  });
  const leg = await prisma.legislacaoItem.updateMany({
    data: { concluido: false },
  });
  const rc = await prisma.resumoConteudo.updateMany({
    data: { ultimaPaginaLida: null },
  });
  const qs = await prisma.questoesSessao.deleteMany({});

  console.log(`Leitura Base resetada: ${lb.count}`);
  console.log(`Legislação resetada: ${leg.count}`);
  console.log(`Resumo do Conteúdo resetado: ${rc.count}`);
  console.log(`Sessões de questões removidas: ${qs.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
