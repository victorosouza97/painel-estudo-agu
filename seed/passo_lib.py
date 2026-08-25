import re

FOOTER_RE = re.compile(r"Acesse:\s*Ponto", re.IGNORECASE)
TRAILING_NUM_RE = re.compile(r"\s*\d+\s*$")

META_HEADER_RE = re.compile(
    r"(?:^|\n)(METAS?\s+\d+(?:\s*[,eE]\s*\d+)*)\n((?:[^\n]+\n){1,3}?)(?=PONTO DO EDITAL:|PASSO A PASSO)",
)

NUM_RE = re.compile(r"\d+")

# section headers that mark the end of the PASSO A PASSO block
END_MARKER_RE = re.compile(r"O QUE VOC[EÊ] (?:DEVE|PRECISA) SABER SOBRE O ASSUNTO")


def clean_page_text(text):
    if not text:
        return ""
    idx = text.find("Acesse:")
    if idx != -1:
        text = text[:idx]
    text = TRAILING_NUM_RE.sub("", text)
    return text.strip("\n")


def extract_full_text(pdf):
    """Return list of cleaned page texts and the full concatenated text with page offsets."""
    pages = []
    for page in pdf.pages:
        pages.append(clean_page_text(page.extract_text() or ""))
    full = "\n".join(pages)
    return pages, full


def find_metas(full_text):
    """Return list of dicts: {label, title, start, body_start} sorted by position."""
    metas = []
    for m in META_HEADER_RE.finditer(full_text):
        label = m.group(1).strip()
        numbers = [int(x) for x in NUM_RE.findall(label)]
        title = " ".join(line.strip() for line in m.group(2).strip().splitlines())
        metas.append({
            "label": label,
            "numbers": numbers,
            "title": title,
            "start": m.start(),
            "header_end": m.end(),
        })
    return metas


def find_passo_a_passo_blocks(full_text, metas):
    """For each meta, find the PASSO A PASSO block text that belongs to it."""
    results = []
    for i, meta in enumerate(metas):
        region_end = metas[i + 1]["start"] if i + 1 < len(metas) else len(full_text)
        region = full_text[meta["header_end"]:region_end]
        pidx = region.find("PASSO A PASSO")
        if pidx == -1:
            results.append({"label": meta["label"], "title": meta["title"], "passo_a_passo": ""})
            continue
        after = region[pidx + len("PASSO A PASSO"):]
        end_pos = len(after)
        em = END_MARKER_RE.search(after)
        if em:
            end_pos = em.start()
        block = after[:end_pos].strip("\n").strip()
        results.append({"label": meta["label"], "numbers": meta["numbers"], "title": meta["title"], "passo_a_passo": block})
    return results
