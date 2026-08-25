import re

SIDEBAR_X0 = 555  # anything at/after this x is the rotated sidebar text


def find_panorama_page(pdf):
    """Return page index (0-based) of the PANORAMA SEMANAL DE METAS page, or None."""
    for i, page in enumerate(pdf.pages[:4]):
        text = page.extract_text() or ""
        if "PANORAMA SEMANAL DE METAS" in text.upper():
            return i
    return None


def _cluster(vals, tol=1.5):
    vals = sorted(vals)
    out = []
    for v in vals:
        if out and v - out[-1] <= tol:
            continue
        out.append(v)
    return out


def get_col_bounds(page):
    """Derive column x-boundaries from the 5 header-row cell background rects.

    Several nested rects exist per header cell (outer cell + inner text-padding box); we
    group candidate rects by their (top, bottom) band and pick the band with the most
    members (one rect per column => 5 members) to get the true column grid.
    """
    candidates = [r for r in page.rects if 15 < (r["bottom"] - r["top"]) < 80 and r["top"] < page.height * 0.35]
    groups = {}
    for r in candidates:
        key = (round(r["top"]), round(r["bottom"]))
        groups.setdefault(key, []).append(r)
    if not groups:
        return []
    best_key = max(groups, key=lambda k: (len(groups[k]), k[1] - k[0]))
    best = groups[best_key]
    xs = set()
    for r in best:
        xs.add(round(r["x0"], 1))
        xs.add(round(r["x1"], 1))
    xs = _cluster(sorted(xs))
    return xs


def get_row_dividers(page, col1_x0, col1_x1):
    """Find y-positions of row boundaries: rects whose x-span matches the outer column-1 grid line
    (not the narrower inner text-padding boxes)."""
    ys = set()
    for r in page.rects:
        if abs(r["x0"] - col1_x0) <= 1.5 and abs(r["x1"] - col1_x1) <= 1.5:
            ys.add(round(r["top"], 1))
            ys.add(round(r["bottom"], 1))
    return sorted(ys)


def cluster_lines(words, tol=2.5):
    """Group words into text-lines by 'top' proximity. Returns list of (top, [words])."""
    words = sorted(words, key=lambda w: w["top"])
    lines = []
    for w in words:
        if lines and abs(w["top"] - lines[-1][0]) <= tol:
            lines[-1][1].append(w)
            lines[-1] = (lines[-1][0], lines[-1][1])
        else:
            lines.append((w["top"], [w]))
    return lines


def col_text(words, x0, x1):
    ws = [w for w in words if w["x0"] >= x0 - 1 and w["x0"] < x1 + 1]
    if not ws:
        return ""
    lines = cluster_lines(ws)
    out_lines = []
    for _, lws in lines:
        lws = sorted(lws, key=lambda w: w["x0"])
        out_lines.append(" ".join(w["text"] for w in lws))
    return "\n".join(out_lines).strip()


def parse_panorama_table(page):
    """Parse the PANORAMA SEMANAL DE METAS table on the given page. Returns list of rows (5 cells each)."""
    edges = get_col_bounds(page)
    if len(edges) != 6:
        return []
    col_ranges = list(zip(edges[:-1], edges[1:]))

    row_ys = get_row_dividers(page, edges[1], edges[2])
    if len(row_ys) < 2:
        return []

    all_words = [w for w in page.extract_words() if w["x0"] < SIDEBAR_X0]

    # row bands: between consecutive row_ys, but skip the header band (first one or two bands
    # containing the words 'META'/'DISCIPLINA'/'ASSUNTO'/'PERCENTUAL')
    header_bottom = None
    for i in range(len(row_ys) - 1):
        y0, y1 = row_ys[i], row_ys[i + 1]
        band_words = [w for w in all_words if y0 - 1 <= w["top"] <= y1 + 1]
        band_text = " ".join(w["text"] for w in band_words)
        if "META" in band_text and "DISCIPLINA" in band_text:
            header_bottom = y1

    if header_bottom is None:
        return []

    data_boundaries = [y for y in row_ys if y >= header_bottom - 0.5]

    rows = []
    for i in range(len(data_boundaries) - 1):
        y0, y1 = data_boundaries[i], data_boundaries[i + 1]
        band_words = [w for w in all_words if y0 + 0.5 <= w["top"] <= y1 - 0.3]
        if not band_words:
            continue
        cells = [col_text(band_words, cx0, cx1) for (cx0, cx1) in col_ranges]
        if not any(c.strip() for c in cells):
            continue
        rows.append(cells)
    return rows
