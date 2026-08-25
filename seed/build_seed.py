# -*- coding: utf-8 -*-
"""Builds seed.json for the study-tracker app from the 29 weekly PDFs, and copies/renames
the PDFs into backend/public/pdfs so the backend can serve them as static assets.
"""
import sys, os, glob, re, json, shutil, unicodedata

sys.path.insert(0, os.path.dirname(__file__))
import pdfplumber
from passo_lib import extract_full_text, find_metas, find_passo_a_passo_blocks
from panorama_lib import find_panorama_page, parse_panorama_table
from enrich_lib import extract_sections

SRC_FOLDER = r'C:\Users\Usuario\OneDrive\Área de Trabalho\Planos de Estudo - PDFs'
PDF_OUT_DIR = r'C:\Users\Usuario\Downloads\study-tracker\backend\public\pdfs'
SEED_OUT_PATH = r'C:\Users\Usuario\Downloads\study-tracker\seed\seed.json'

WEEK_RE = re.compile(r"Semana\s+(\d+)(?:\s*-\s*Metas específicas)?\s*(PFN|PF|AU)?", re.IGNORECASE)
PAGE_NUM_RE = re.compile(r"P[áa]g\.\s*(\d+)")


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text


def week_label_and_sort_key(fname):
    m = WEEK_RE.search(fname)
    if not m:
        return fname, (999, "")
    num = int(m.group(1))
    suffix = (m.group(2) or "").upper()
    label = f"Semana {num}" + (f" {suffix}" if suffix else "")
    return label, (num, suffix)


def first_page_number(text):
    if not text:
        return None
    m = PAGE_NUM_RE.search(text)
    return int(m.group(1)) if m else None


def build_number_queue(meta_blocks):
    queue = {}
    for mb in meta_blocks:
        for n in mb["numbers"]:
            queue.setdefault(n, []).append(mb)
    return queue


def process_file(path, pdf_slug):
    fname = os.path.basename(path)
    week_label, sort_key = week_label_and_sort_key(fname)

    with pdfplumber.open(path) as pdf:
        idx = find_panorama_page(pdf)
        prows = parse_panorama_table(pdf.pages[idx]) if idx is not None else []
        pages, full = extract_full_text(pdf)
        metas = find_metas(full)
        blocks = find_passo_a_passo_blocks(full, metas)

    queue = build_number_queue(blocks)

    filled_keys = []
    last_num = None
    for cells in prows:
        meta_num_txt = cells[0].strip()
        if meta_num_txt:
            last_num = meta_num_txt
        try:
            key = int(meta_num_txt) if meta_num_txt else (int(last_num) if last_num else None)
        except ValueError:
            key = None
        filled_keys.append(key)

    key_row_count = {}
    for k in filled_keys:
        if k is not None:
            key_row_count[k] = key_row_count.get(k, 0) + 1

    assuntos = []
    for row_i, (cells, key) in enumerate(zip(prows, filled_keys)):
        meta_num_txt, disciplina, assunto, controle, percentual = cells
        display_num = str(key) if key is not None else meta_num_txt.strip()

        passo = ""
        if key is not None and queue.get(key):
            if key_row_count.get(key, 0) <= 1 and len(queue[key]) > 1:
                parts = [b["passo_a_passo"] for b in queue[key] if b["passo_a_passo"]]
                passo = "\n\n".join(parts)
                queue[key] = []
            else:
                block = queue[key].pop(0)
                passo = block["passo_a_passo"]

        sections = extract_sections(passo)
        assunto_clean = re.sub(r"\s*\n\s*", " ", assunto).strip()
        disciplina_clean = re.sub(r"\s*\n\s*", " ", disciplina).strip() if disciplina else ""
        if disciplina_clean in ("", "-"):
            disciplina_clean = "Outros"

        assuntos.append({
            "id": f"{slugify(week_label)}-{row_i+1:02d}",
            "semana": week_label,
            "semanaOrdem": list(sort_key),
            "metaNumero": display_num,
            "disciplina": disciplina_clean,
            "assunto": assunto_clean,
            "pdfSemanaArquivo": pdf_slug,
            "paginaInicio": first_page_number(controle),
            "paginaFim": None,  # filled in a second pass, per week
            "leituraBase": {"disponivel": sections["temLeituraBase"], "nomePdfBase": sections["nomePdfBase"]},
            "legislacao": [{"texto": t} for t in sections["legislacao"]],
            "questoesFiltro": sections["questoesFiltro"],
            "observacoes": sections["observacoes"],
            "passoAPassoBruto": passo,
        })

    # second pass: compute paginaFim = (next strictly-greater paginaInicio in this week) - 1
    for i, a in enumerate(assuntos):
        if a["paginaInicio"] is None:
            continue
        next_start = None
        for b in assuntos[i + 1:]:
            if b["paginaInicio"] is not None and b["paginaInicio"] > a["paginaInicio"]:
                next_start = b["paginaInicio"]
                break
        a["paginaFim"] = (next_start - 1) if next_start is not None else None

    return sort_key, week_label, assuntos


def main():
    os.makedirs(PDF_OUT_DIR, exist_ok=True)
    files = sorted(glob.glob(SRC_FOLDER + "\\*.pdf"))

    all_assuntos = []
    results = []
    for path in files:
        fname = os.path.basename(path)
        week_label, sort_key = week_label_and_sort_key(fname)
        pdf_slug = slugify(week_label) + ".pdf"
        try:
            sort_key, week_label, assuntos = process_file(path, pdf_slug)
            results.append((sort_key, week_label, assuntos))
            shutil.copyfile(path, os.path.join(PDF_OUT_DIR, pdf_slug))
            print(f"OK  {fname[:65]:65s} assuntos={len(assuntos)} -> {pdf_slug}")
        except Exception as e:
            print(f"ERR {fname[:65]:65s} {e}")
            raise

    results.sort(key=lambda x: x[0])
    for _, _, assuntos in results:
        all_assuntos.extend(assuntos)

    disciplinas = sorted({a["disciplina"] for a in all_assuntos if a["disciplina"] and a["disciplina"] != "-"})

    seed = {
        "disciplinas": disciplinas,
        "assuntos": all_assuntos,
    }

    with open(SEED_OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, indent=2)

    print()
    print("Disciplinas:", disciplinas)
    print("Total assuntos:", len(all_assuntos))
    print("Seed salvo em:", SEED_OUT_PATH)


if __name__ == "__main__":
    main()
