# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable
)

OUT_PATH = r"C:\Users\Usuario\Downloads\study-tracker\relatorio\Relatorio - Painel de Estudo AGU.pdf"

AZUL = colors.HexColor("#1F4E78")
AZUL_CLARO = colors.HexColor("#EAF1F8")
VERDE = colors.HexColor("#2E7D32")
VERDE_CLARO = colors.HexColor("#EAF6EC")
CINZA = colors.HexColor("#555555")

styles = getSampleStyleSheet()

titulo_capa = ParagraphStyle(
    "TituloCapa", parent=styles["Title"], fontSize=28, leading=34,
    textColor=AZUL, spaceAfter=10, alignment=TA_CENTER,
)
subtitulo_capa = ParagraphStyle(
    "SubtituloCapa", parent=styles["Normal"], fontSize=14, leading=20,
    textColor=CINZA, alignment=TA_CENTER, spaceAfter=6,
)
h1 = ParagraphStyle(
    "H1", parent=styles["Heading1"], fontSize=18, leading=22,
    textColor=AZUL, spaceBefore=18, spaceAfter=10,
    borderPadding=0,
)
h2 = ParagraphStyle(
    "H2", parent=styles["Heading2"], fontSize=13, leading=16,
    textColor=AZUL, spaceBefore=10, spaceAfter=6,
)
corpo = ParagraphStyle(
    "Corpo", parent=styles["Normal"], fontSize=11, leading=16.5,
    spaceAfter=8, alignment=4,  # justify
)
corpo_bold = ParagraphStyle(
    "CorpoBold", parent=corpo, fontName="Helvetica-Bold",
)
item = ParagraphStyle(
    "Item", parent=corpo, leftIndent=0, spaceAfter=4,
)
analogia_titulo = ParagraphStyle(
    "AnalogiaTitulo", parent=styles["Normal"], fontSize=10.5, leading=14,
    textColor=VERDE, fontName="Helvetica-Bold", spaceAfter=3,
)
analogia_corpo = ParagraphStyle(
    "AnalogiaCorpo", parent=styles["Normal"], fontSize=10.5, leading=15,
    textColor=colors.HexColor("#2B3A2E"),
)
rodape_capa = ParagraphStyle(
    "RodapeCapa", parent=styles["Normal"], fontSize=10, leading=14,
    textColor=CINZA, alignment=TA_CENTER,
)


def analogia(titulo, texto):
    p_titulo = Paragraph(f"[ {titulo} ]", analogia_titulo)
    p_corpo = Paragraph(texto, analogia_corpo)
    t = Table([[p_titulo], [p_corpo]], colWidths=[16.2 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), VERDE_CLARO),
        ("BOX", (0, 0), (-1, -1), 0.75, VERDE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def passo_num(numero, titulo):
    p_num = Paragraph(f"<b>{numero}</b>", ParagraphStyle(
        "PassoNum", parent=styles["Normal"], fontSize=16, leading=20,
        textColor=colors.white, alignment=TA_CENTER,
    ))
    p_titulo = Paragraph(titulo, ParagraphStyle(
        "PassoTitulo", parent=styles["Normal"], fontSize=13, leading=16,
        textColor=colors.white, fontName="Helvetica-Bold",
    ))
    t = Table([[p_num, p_titulo]], colWidths=[1.3 * cm, 14.9 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def bullets(itens):
    return ListFlowable(
        [ListItem(Paragraph(t, item), bulletColor=AZUL) for t in itens],
        bulletType="bullet", start="•", leftIndent=16, spaceBefore=2, spaceAfter=8,
    )


story = []

# ---------- CAPA ----------
story.append(Spacer(1, 5 * cm))
story.append(Paragraph("Como criamos o<br/>Painel de Estudo AGU", titulo_capa))
story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph("Um relatório simples, passo a passo, sobre tudo que foi feito", subtitulo_capa))
story.append(Spacer(1, 6 * cm))
story.append(HRFlowable(width="60%", thickness=1, color=AZUL, hAlign="CENTER"))
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph("Preparado para Victor · Agosto de 2026", rodape_capa))
story.append(PageBreak())

# ---------- INTRODUÇÃO ----------
story.append(Paragraph("Introdução", h1))
story.append(Paragraph(
    "Você me pediu para pegar um monte de PDFs de um curso de estudos para concurso e "
    "transformar tudo isso em um site pessoal, onde dá para acompanhar o progresso de estudo "
    "dia após dia. Esse relatório explica, com calma e sem termos técnicos difíceis, tudo o que "
    "fizemos — como se estivéssemos montando um quebra-cabeça grande, peça por peça.",
    corpo,
))
story.append(Paragraph(
    "No final, você vai entender por que cada etapa foi necessária, mesmo sem entender de "
    "programação.",
    corpo,
))

# ---------- PARTE 1 ----------
story.append(passo_num("1", "Organizando a bagunça: dos PDFs para uma planilha"))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Tudo começou com 29 apostilas em PDF, uma para cada semana de estudo. Cada uma tinha "
    "dezenas de páginas misturando várias informações: o que estudar, quais leis ler, quantas "
    "questões resolver, e por aí vai. Antes de pensar em qualquer site, era preciso organizar "
    "essa informação.",
    corpo,
))
story.append(analogia(
    "Analogia",
    "Imagine 29 caixas de sapato cheias de receitas de bolo escritas à mão, cada uma num "
    "formato diferente. Antes de montar um livro de receitas bonito, alguém precisa copiar "
    "tudo para um caderno organizado — uma receita por página, sempre no mesmo formato: "
    "ingredientes, modo de preparo, tempo de forno.",
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Eu escrevi um programa — um \"robozinho leitor\" — que abriu, sozinho, cada um dos 29 "
    "PDFs, entendeu onde estava cada pedaço de informação (qual matéria, qual assunto, em "
    "que página do PDF está o resumo, o que fazer primeiro) e organizou tudo numa planilha "
    "de Excel.",
    corpo,
))
story.append(Paragraph(
    "O resultado foi uma planilha com <b>243 linhas</b> — cada linha é uma \"meta\" de estudo "
    "(um assunto específico), com a matéria, o assunto, a página do resumo e o passo a passo "
    "de cada uma.",
    corpo,
))

# ---------- PARTE 2 ----------
story.append(passo_num("2", "Da planilha para o site: o plano antes da obra"))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Depois de ver a planilha pronta, você pediu algo mais ambicioso: um site para acompanhar "
    "tudo isso ao vivo, marcando o que já foi estudado. Antes de sair \"construindo às cegas\", "
    "conversamos sobre o que o site precisava ter — como um arquiteto que desenha a planta da "
    "casa antes de começar a obra.",
    corpo,
))
story.append(bullets([
    "Organizado por <b>matéria</b>, e dentro de cada matéria, os <b>assuntos</b> para estudar.",
    "Cada assunto com <b>4 partes</b>: Leitura Base, Legislação, Resumo do Conteúdo e Questões.",
    "Um lugar seguro para guardar o progresso, para nada se perder.",
    "Um endereço na internet, para acessar de qualquer lugar — até pelo celular.",
]))

# ---------- PARTE 3 ----------
story.append(passo_num("3", "Construindo o site: a cozinha e o salão"))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Todo site tem duas partes, mesmo que a gente só perceba uma delas.",
    corpo,
))
story.append(analogia(
    "Analogia",
    "Pense num restaurante. O <b>salão</b> é a parte bonita que você vê e usa — as mesas, o "
    "cardápio, os garçons. A <b>cozinha</b> é onde a comida é realmente preparada, escondida "
    "atrás do salão. Quando você faz um pedido, o garçom leva até a cozinha, o prato é "
    "preparado, e volta pronto até você. No site, o \"salão\" é o que você vê e clica na tela; "
    "a \"cozinha\" é onde as informações são guardadas e calculadas de verdade.",
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Cada assunto (por exemplo, \"Poder Executivo\") ganhou uma página própria, com 4 seções:",
    corpo,
))
story.append(bullets([
    "<b>1. Leitura Base (PDF)</b> — um simples \"já li o material base desse assunto\", como "
    "marcar uma tarefa como feita numa lista.",
    "<b>2. Legislação</b> — cada lei ou artigo que você precisa ler vira um item separado, "
    "que pode ser marcado individualmente. É como uma lista de compras, riscando cada item "
    "conforme você compra.",
    "<b>3. Resumo do Conteúdo</b> — mostra quantas páginas do resumo você já leu, com botões "
    "numerados para cada página. Funciona como um marcador de página de um livro digital.",
    "<b>4. Questões</b> — você anota quantas questões acertou e errou, e o site calcula "
    "sozinho seu percentual de aproveitamento, como um boletim que se atualiza automaticamente.",
]))

story.append(PageBreak())

# ---------- PARTE 4 ----------
story.append(passo_num("4", "Testando e ajustando, como um carro novo"))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Depois de construído, testamos tudo juntos, e você foi revisando e apontando o que "
    "precisava melhorar — é normal, todo carro novo passa por uma revisão antes da estrada. "
    "Alguns exemplos do que ajustamos:",
    corpo,
))
story.append(bullets([
    "O nome do material de leitura base não aparecia — corrigimos para mostrar o nome certo "
    "em cada assunto (ex.: \"PDF Base: Tributos, Conceitos e Espécies\").",
    "Marcar uma página lida não preenchia as páginas anteriores — ajustamos para funcionar "
    "como um marcador de progresso sequencial: se você chegou na página 20, as páginas 1 a "
    "19 já contam como lidas automaticamente.",
    "Se você \"voltasse\" uma página (desmarcando), o progresso agora recua corretamente, "
    "sem deixar buracos soltos no meio do caminho.",
]))

# ---------- PARTE 5 ----------
story.append(passo_num("5", "O medidor de progresso: como as porcentagens funcionam"))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Você pediu uma forma justa de medir o progresso de cada assunto. Decidimos que cada uma "
    "das 3 primeiras seções tem um \"peso\" diferente na nota final da meta:",
    corpo,
))
story.append(bullets([
    "<b>Leitura Base</b> vale 50% da meta.",
    "<b>Legislação</b> vale 25%.",
    "<b>Resumo do Conteúdo</b> vale 25%.",
    "<b>Questões</b> não entra nessa conta — mas o percentual de acerto aparece à parte, "
    "como uma informação extra.",
]))
story.append(analogia(
    "Analogia",
    "É como a média final de uma matéria na escola, onde a prova vale mais que o trabalho, "
    "que vale mais que o exercício de casa. Cada assunto vira uma \"nota\" assim, e todas as "
    "notas juntas formam o progresso da matéria inteira, e todas as matérias juntas formam o "
    "progresso total do curso.",
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Um detalhe importante que você pediu: <b>nada de esconder pequenos avanços</b>. Se você "
    "leu 1 página de um total de milhares no curso inteiro, o site não vai mostrar \"0%\" só "
    "porque o número é pequeno — ele mostra algo como \"0,004%\", para que todo esforço, por "
    "menor que seja, apareça de verdade.",
    corpo,
))

# ---------- PARTE 6 ----------
story.append(passo_num("6", "Colocando o site no ar, para sempre"))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Até esse ponto, o site só funcionava no seu computador, e só enquanto estava ligado — "
    "como cozinhar uma refeição só para comer na hora, na sua própria cozinha. Para você "
    "acessar de qualquer lugar, a qualquer hora, era preciso \"abrir um restaurante de "
    "verdade\": um endereço na internet que fica sempre aberto, mesmo com o seu computador "
    "desligado.",
    corpo,
))
story.append(Paragraph("Isso teve 3 partes:", corpo))
story.append(bullets([
    "<b>GitHub</b> — um cofre na nuvem onde guardamos todo o código do site, como enviar a "
    "planta de uma casa para um arquivo seguro, que pode ser lido por outros serviços.",
    "<b>Render</b> — o \"terreno\" onde a casa foi construída de verdade e ligada à internet. "
    "Ele lê os planos guardados no GitHub e monta o site sozinho, toda vez que enviamos uma "
    "atualização.",
    "<b>Neon (banco de dados)</b> — o arquivo onde ficam guardadas, de verdade, todas as "
    "informações: os assuntos, e o seu progresso. Continua existindo mesmo se o site "
    "reiniciar ou for atualizado.",
]))

# ---------- PARTE 7 ----------
story.append(passo_num("7", "Os probleminhas de estreia"))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Quando \"abrimos as portas\" do site pela primeira vez, apareceram três probleminhas de "
    "configuração — bem comuns, até restaurante novo passa por isso na inauguração. Resolvemos "
    "um por um:",
    corpo,
))
story.append(bullets([
    "O construtor (Render) estava \"economizando material\" durante a montagem e deixando de "
    "instalar algumas ferramentas necessárias — corrigido, forçando a instalação completa.",
    "O botão de \"ligar o site\" estava apontando para a prateleira errada, onde o arquivo "
    "principal não estava — corrigido, ajustando o endereço certo.",
    "O \"crachá de acesso\" (que lembra que você fez login) não estava sendo entregue "
    "corretamente por causa de como a conexão seguro (HTTPS) atravessa o Render — corrigido, "
    "ensinando o site a confiar nesse tipo de conexão.",
]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Depois desses três ajustes, testamos tudo de novo, do zero: login, salvar progresso, "
    "recarregar a página e ver se continuava lá. Funcionou perfeitamente.",
    corpo,
))

story.append(PageBreak())

# ---------- CONCLUSÃO ----------
story.append(Paragraph("Conclusão: o que você tem hoje", h1))
story.append(bullets([
    "Um site pessoal, no ar 24 horas por dia, acessível de qualquer lugar: "
    "<b>https://painel-estudo-agu.onrender.com</b>",
    "Organizado por matéria e assunto, com as 4 seções de progresso em cada um dos 243 "
    "assuntos do curso.",
    "Um sistema de porcentagem justo e detalhado, do assunto até o progresso total do curso.",
    "Login protegido, só para você.",
]))
story.append(Spacer(1, 10))
story.append(Paragraph(
    "Qualquer ajuste ou ideia nova que você tiver — adicionar algo, corrigir algo, mudar o "
    "visual — é só me pedir. As atualizações sobem automaticamente para o site no ar assim "
    "que terminamos.",
    corpo,
))

doc = SimpleDocTemplate(
    OUT_PATH, pagesize=A4,
    leftMargin=2.2 * cm, rightMargin=2.2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="Relatório - Painel de Estudo AGU",
)
doc.build(story)
print("Gerado:", OUT_PATH)
