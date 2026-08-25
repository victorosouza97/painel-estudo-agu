# -*- coding: utf-8 -*-
"""Turns a raw 'Passo a Passo' text block into structured sections:
leitura base, legislacao (itens avulsos), and o filtro sugerido de questoes.
"""
import re

FILTRO_RE = re.compile(
    r"BANCA\s+(?P<banca>[^\n]+)\n"
    r"DISCIPLINA\s+(?P<disciplina>[^\n]+)\n"
    r"ASSUNTO\s+(?P<assunto>.+?)\n"
    r"N[ÍI]VEL\s+(?P<nivel>[^\n]+)\n"
    r"[ÁA]REA DE ATUA[ÇC][ÃA]O\s+(?P<area>[^\n]+)\n"
    r"MODALIDADE\s+(?P<modalidade>[^\n]+)",
    re.DOTALL,
)

QTD_RE = re.compile(r"(?:pelo menos,?|no m[íi]nimo,?)\s*(\d+)\s*quest[õo]es", re.IGNORECASE)

PDF_BASE_RE = re.compile(r"PDF Base", re.IGNORECASE)
JURISPRUDENCIA_RE = re.compile(r"compilado jurisprudencial", re.IGNORECASE)
QUESTOES_BULLET_RE = re.compile(r"\bquest[õo]es\b", re.IGNORECASE)
DICA_RE = re.compile(r"^Dica Estrat[ée]gica", re.IGNORECASE)
OBSERVACAO_RE = re.compile(r"^Observa[çc][ãa]o", re.IGNORECASE)

# tentativas, em ordem, de extrair o "nome" do material citado num bullet de leitura do PDF Base
PDF_BASE_NAME_PATTERNS = [
    re.compile(r"PDF Base do curso sobre\s+(.+?)\.?\s*$", re.IGNORECASE),
    re.compile(r"PDF Base\s+(.+?)\s+do curso", re.IGNORECASE),
    re.compile(
        r"Ler\s+(?:o\s+|a\s+|os\s+|as\s+)?(?:assunto\s+|tema\s+|temas\s+)?(.+?)\s+pelo PDF Base do curso",
        re.IGNORECASE,
    ),
]

_LOWER_WORDS_PT = {
    "a", "o", "as", "os", "e", "de", "da", "do", "das", "dos",
    "em", "no", "na", "nos", "nas", "à", "às", "ao", "aos", "com", "por", "para",
}


def _titlecase_pt(text):
    words = text.split(" ")
    out = []
    for i, w in enumerate(words):
        core = w.strip(",;:")
        if not core:
            out.append(w)
            continue
        lw = core.lower()
        new_core = lw if (i > 0 and lw in _LOWER_WORDS_PT) else (core[:1].upper() + core[1:].lower())
        out.append(w.replace(core, new_core, 1))
    return " ".join(out)


def extract_pdf_base_nome(bullet):
    for pat in PDF_BASE_NAME_PATTERNS:
        m = pat.search(bullet)
        if m:
            nome = m.group(1).strip().strip(".").strip()
            if nome:
                return _titlecase_pt(nome)
    return None


def split_bullets(passo_text):
    """Split the passo-a-passo block into top-level '•' bullets, keeping wrapped lines
    that belong to the same bullet joined with a space. Returns the leading bullets only
    (stops once the 'utilizando o seguinte filtro:' / BANCA block starts, since that's
    parsed separately by extract_filtro)."""
    if not passo_text:
        return []
    # cut off at the filtro block if present, so it isn't mistaken for bullet content
    cut_idx = len(passo_text)
    m = re.search(r"\nBANCA\s", passo_text)
    if m:
        cut_idx = m.start()
    head = passo_text[:cut_idx]

    raw_bullets = re.split(r"\n?•\s*", head)
    bullets = []
    for b in raw_bullets:
        b = b.strip()
        if not b:
            continue
        # join wrapped lines into one sentence (single '\n' = line wrap, not a new bullet)
        joined = re.sub(r"\s*\n\s*", " ", b).strip()
        bullets.append(joined)
    return bullets


def extract_filtro(passo_text):
    if not passo_text:
        return None
    m = FILTRO_RE.search(passo_text)
    if not m:
        return None
    assunto = re.sub(r"\s*\n\s*", " ", m.group("assunto")).strip()
    qtd_m = QTD_RE.search(passo_text)
    return {
        "banca": m.group("banca").strip(),
        "disciplina": m.group("disciplina").strip(),
        "assunto": assunto,
        "nivel": m.group("nivel").strip(),
        "area": m.group("area").strip(),
        "modalidade": m.group("modalidade").strip(),
        "quantidadeSugerida": int(qtd_m.group(1)) if qtd_m else None,
    }


def extract_sections(passo_text):
    """Classify each bullet into: leitura base / legislacao / questoes / dica / outros."""
    bullets = split_bullets(passo_text)
    tem_leitura_base = False
    nome_pdf_base = None
    legislacao = []
    dicas = []

    for b in bullets:
        if PDF_BASE_RE.search(b):
            tem_leitura_base = True
            if nome_pdf_base is None:
                nome_pdf_base = extract_pdf_base_nome(b)
            continue
        if JURISPRUDENCIA_RE.search(b):
            continue  # refers to the "Resumo do Conteudo" section itself
        if QUESTOES_BULLET_RE.search(b):
            continue  # handled by extract_filtro
        if DICA_RE.match(b) or OBSERVACAO_RE.match(b):
            dicas.append(b)
            continue
        legislacao.append(b)

    filtro = extract_filtro(passo_text)

    return {
        "temLeituraBase": tem_leitura_base,
        "nomePdfBase": nome_pdf_base,
        "legislacao": legislacao,
        "questoesFiltro": filtro,
        "observacoes": dicas,
    }
