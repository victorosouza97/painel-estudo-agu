-- CreateTable
CREATE TABLE "Assunto" (
    "id" TEXT NOT NULL,
    "semana" TEXT NOT NULL,
    "semanaOrdemNum" INTEGER NOT NULL,
    "semanaOrdemSuf" TEXT NOT NULL,
    "metaNumero" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "pdfSemanaArquivo" TEXT NOT NULL,
    "paginaInicio" INTEGER,
    "paginaFim" INTEGER,
    "passoAPassoBruto" TEXT NOT NULL,

    CONSTRAINT "Assunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeituraBase" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT false,
    "nomePdfBase" TEXT,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "LeituraBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegislacaoItem" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "concluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LegislacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumoConteudo" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "paginaInicio" INTEGER,
    "paginaFim" INTEGER,
    "ultimaPaginaLida" INTEGER,

    CONSTRAINT "ResumoConteudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestoesFiltro" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "banca" TEXT,
    "disciplina" TEXT,
    "assuntoCodigo" TEXT,
    "nivel" TEXT,
    "area" TEXT,
    "modalidade" TEXT,
    "quantidadeSugerida" INTEGER,

    CONSTRAINT "QuestoesFiltro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestoesSessao" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acertos" INTEGER NOT NULL,
    "erros" INTEGER NOT NULL,

    CONSTRAINT "QuestoesSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observacao" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "Observacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assunto_disciplina_idx" ON "Assunto"("disciplina");

-- CreateIndex
CREATE UNIQUE INDEX "LeituraBase_assuntoId_key" ON "LeituraBase"("assuntoId");

-- CreateIndex
CREATE INDEX "LegislacaoItem_assuntoId_idx" ON "LegislacaoItem"("assuntoId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumoConteudo_assuntoId_key" ON "ResumoConteudo"("assuntoId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestoesFiltro_assuntoId_key" ON "QuestoesFiltro"("assuntoId");

-- CreateIndex
CREATE INDEX "QuestoesSessao_assuntoId_idx" ON "QuestoesSessao"("assuntoId");

-- CreateIndex
CREATE INDEX "Observacao_assuntoId_idx" ON "Observacao"("assuntoId");

-- AddForeignKey
ALTER TABLE "LeituraBase" ADD CONSTRAINT "LeituraBase_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislacaoItem" ADD CONSTRAINT "LegislacaoItem_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumoConteudo" ADD CONSTRAINT "ResumoConteudo_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestoesFiltro" ADD CONSTRAINT "QuestoesFiltro_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestoesSessao" ADD CONSTRAINT "QuestoesSessao_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observacao" ADD CONSTRAINT "Observacao_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

