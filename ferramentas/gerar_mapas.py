"""
Gera os 4 mapas de atuação da página Início (img/mapa-*.png).

Uso (na pasta front-end):
    python ferramentas/gerar_mapas.py PASTA_DOS_DADOS

PASTA_DOS_DADOS precisa conter:
  - world.geojson     -> Natural Earth 1:50m "admin 0 map units" (domínio público)
                         https://github.com/nvkelso/natural-earth-vector (geojson/ne_50m_admin_0_map_units.geojson)
  - brasil_uf.geojson -> malha dos estados do IBGE
                         https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=intermediaria&intrarregiao=UF

Para incluir/retirar um país ou estado, edite a lista MAPAS no fim deste arquivo.
Requer: Python 3, numpy e Pillow.
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ------------------------------------------------------------------
# Aparência
# ------------------------------------------------------------------
TAM = 1600          # tamanho final da imagem (quadrada)
SS = 2              # superamostragem (desenha em 2x e reduz -> bordas suaves)
FONTES = 'C:/Windows/Fonts/'
FONTE_SEMI = FONTES + 'seguisb.ttf'
FONTE_BOLD = FONTES + 'segoeuib.ttf'
FONTE_REG = FONTES + 'segoeui.ttf'

OCEANO_TOPO = (238, 245, 251)
OCEANO_BASE = (222, 235, 247)
GRADE = (210, 225, 239)
TERRA = (214, 222, 230)
TERRA_CONTEXTO = (234, 239, 244)
BORDA_TERRA = (255, 255, 255)
DESTAQUE_TOPO = (47, 133, 199)
DESTAQUE_BASE = (13, 82, 138)
BORDA_DESTAQUE = (10, 61, 102)
AZUL_TEXTO = (12, 76, 125)
CINZA_TEXTO = (118, 133, 148)


def S(v):
    """Converte medida da imagem final para a escala de desenho."""
    return int(round(v * SS))


def fonte(caminho, tamanho):
    return ImageFont.truetype(caminho, S(tamanho))


# ------------------------------------------------------------------
# Projeção azimutal de Lambert (área igual), centrada na região
# ------------------------------------------------------------------
class Projecao:
    def __init__(self, lon0, lat0):
        self.l0 = math.radians(lon0)
        self.p0 = math.radians(lat0)

    def __call__(self, lon, lat):
        lam = np.radians(np.asarray(lon, dtype=float))
        phi = np.radians(np.asarray(lat, dtype=float))
        cosc = math.sin(self.p0) * np.sin(phi) + math.cos(self.p0) * np.cos(phi) * np.cos(lam - self.l0)
        k = np.sqrt(2.0 / np.maximum(1.0 + cosc, 1e-9))
        x = k * np.cos(phi) * np.sin(lam - self.l0)
        y = k * (math.cos(self.p0) * np.sin(phi) - math.sin(self.p0) * np.cos(phi) * np.cos(lam - self.l0))
        return x, y, cosc


class Moldura:
    """Encaixa uma janela lon/lat na imagem quadrada, mantendo a proporção."""

    def __init__(self, proj, lon_min=None, lon_max=None, lat_min=None, lat_max=None, margem=40,
                 pontos=None, folga=0.12):
        self.proj = proj
        if pontos:
            # Enquadra uma lista de pontos (lon, lat) com uma folga proporcional ao redor
            arr = np.asarray(pontos, dtype=float)
            x, y, _ = proj(arr[:, 0], arr[:, 1])
            x0, x1, y0, y1 = x.min(), x.max(), y.min(), y.max()
            fx, fy = (x1 - x0) * folga, (y1 - y0) * folga
            x0, x1, y0, y1 = x0 - fx, x1 + fx, y0 - fy, y1 + fy
        else:
            lons = np.concatenate([np.linspace(lon_min, lon_max, 200)] * 2 + [np.full(200, lon_min), np.full(200, lon_max)])
            lats = np.concatenate([np.full(200, lat_min), np.full(200, lat_max)] + [np.linspace(lat_min, lat_max, 200)] * 2)
            x, y, _ = proj(lons, lats)
            x0, x1, y0, y1 = x.min(), x.max(), y.min(), y.max()
        util = TAM - 2 * margem
        self.escala = min(util / (x1 - x0), util / (y1 - y0)) * SS
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        self.ox = TAM * SS / 2 - cx * self.escala
        self.oy = TAM * SS / 2 + cy * self.escala

    def pontos(self, lon, lat):
        x, y, cosc = self.proj(lon, lat)
        px = self.ox + x * self.escala
        py = self.oy - y * self.escala
        return px, py, cosc

    def ponto(self, lon, lat):
        px, py, _ = self.pontos([lon], [lat])
        return float(px[0]), float(py[0])


def aneis(geom):
    """Lista de anéis (polígonos externos e buracos) de uma geometria GeoJSON."""
    if geom['type'] == 'Polygon':
        return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon':
        return geom['coordinates']
    return []


def poligonos_px(moldura, geom):
    """Converte a geometria em listas de pontos na imagem (descarta o lado oposto do globo)."""
    saida = []
    for poly in aneis(geom):
        for i, anel in enumerate(poly):
            arr = np.asarray(anel, dtype=float)
            px, py, cosc = moldura.pontos(arr[:, 0], arr[:, 1])
            if cosc.min() < -0.6:
                continue
            saida.append((i == 0, list(zip(px.tolist(), py.tolist()))))
    return saida


# ------------------------------------------------------------------
# Desenho
# ------------------------------------------------------------------
def fundo():
    lado = TAM * SS
    grad = np.linspace(0, 1, lado)[:, None]
    topo, base = np.array(OCEANO_TOPO), np.array(OCEANO_BASE)
    cores = (topo * (1 - grad) + base * grad).astype(np.uint8)
    arr = np.repeat(cores[:, None, :], lado, axis=1).reshape(lado, lado, 3)
    return Image.fromarray(arr, 'RGB')


def desenhar_grade(img, moldura, passo):
    d = ImageDraw.Draw(img)
    for lon in range(-180, 181, passo):
        lats = np.linspace(-85, 85, 400)
        px, py, cosc = moldura.pontos(np.full_like(lats, lon), lats)
        pts = [(x, y) for x, y, c in zip(px, py, cosc) if c > -0.3]
        if len(pts) > 1:
            d.line(pts, fill=GRADE, width=S(1.2))
    for lat in range(-80, 81, passo):
        lons = np.linspace(-180, 180, 800)
        px, py, cosc = moldura.pontos(lons, np.full_like(lons, lat))
        pts = [(x, y) for x, y, c in zip(px, py, cosc) if c > -0.3]
        if len(pts) > 1:
            d.line(pts, fill=GRADE, width=S(1.2))


def preencher(img, polys, cor, borda=None, largura=1.0):
    d = ImageDraw.Draw(img)
    for externo, pts in polys:
        if len(pts) < 3:
            continue
        d.polygon(pts, fill=cor if externo else None)
    if borda:
        for _, pts in polys:
            if len(pts) > 1:
                d.line(pts + [pts[0]], fill=borda, width=S(largura), joint='curve')


def mascara(polys):
    m = Image.new('L', (TAM * SS, TAM * SS), 0)
    d = ImageDraw.Draw(m)
    for externo, pts in polys:
        if len(pts) >= 3:
            d.polygon(pts, fill=255 if externo else 0)
    return m


def aplicar_destaque(img, polys, contorno=True):
    """Preenche as áreas atendidas com gradiente azul, sombra suave e contorno externo."""
    m = mascara(polys)
    lado = TAM * SS

    # sombra
    sombra = m.filter(ImageFilter.GaussianBlur(S(9)))
    sombra = Image.eval(sombra, lambda v: int(v * 0.45))
    deslocada = Image.new('L', m.size, 0)
    deslocada.paste(sombra, (0, S(5)))
    img.paste(Image.new('RGB', m.size, (8, 40, 70)), (0, 0), deslocada)

    # gradiente
    grad = np.linspace(0, 1, lado)[:, None]
    topo, base = np.array(DESTAQUE_TOPO), np.array(DESTAQUE_BASE)
    cores = (topo * (1 - grad) + base * grad).astype(np.uint8)
    arr = np.repeat(cores[:, None, :], lado, axis=1).reshape(lado, lado, 3)
    img.paste(Image.fromarray(arr, 'RGB'), (0, 0), m)

    if contorno:
        dilatada = m.filter(ImageFilter.MaxFilter(2 * S(1.5) + 1))
        anel = Image.eval(Image.fromarray(np.clip(np.asarray(dilatada, dtype=int) - np.asarray(m, dtype=int), 0, 255).astype(np.uint8)), lambda v: v)
        img.paste(Image.new('RGB', m.size, BORDA_DESTAQUE), (0, 0), anel)
    return m


def etiqueta(img, texto, centro, ancora=None, tamanho=40):
    """Etiqueta branca arredondada com sombra; com 'ancora', liga por uma linha a um ponto."""
    f = fonte(FONTE_SEMI, tamanho)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = d.textbbox((0, 0), texto, font=f)
    tw, th = x1 - x0, y1 - y0
    pad_x, pad_y = S(tamanho * 0.55), S(tamanho * 0.32)
    w, h = tw + 2 * pad_x, th + 2 * pad_y
    cx, cy = centro
    lado = TAM * SS
    cx = min(max(cx, w / 2 + S(12)), lado - w / 2 - S(12))
    cy = min(max(cy, h / 2 + S(12)), lado - h / 2 - S(12))
    caixa = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]

    if ancora:
        d.line([ancora, (cx, cy)], fill=AZUL_TEXTO, width=S(2.5))
        r = S(7)
        d.ellipse([ancora[0] - r - S(3), ancora[1] - r - S(3), ancora[0] + r + S(3), ancora[1] + r + S(3)], fill=(255, 255, 255))
        d.ellipse([ancora[0] - r, ancora[1] - r, ancora[0] + r, ancora[1] + r], fill=AZUL_TEXTO)

    sombra = Image.new('L', img.size, 0)
    ImageDraw.Draw(sombra).rounded_rectangle([caixa[0], caixa[1] + S(4), caixa[2], caixa[3] + S(4)], radius=h / 2, fill=110)
    sombra = sombra.filter(ImageFilter.GaussianBlur(S(7)))
    img.paste(Image.new('RGB', img.size, (10, 40, 70)), (0, 0), sombra)

    d = ImageDraw.Draw(img)
    d.rounded_rectangle(caixa, radius=h / 2, fill=(255, 255, 255), outline=(205, 222, 238), width=S(1.5))
    d.text((cx - tw / 2 - x0, cy - th / 2 - y0), texto, font=f, fill=AZUL_TEXTO)


def texto_centralizado(img, texto, centro, tamanho, cor, fonte_arq=FONTE_BOLD, halo=None):
    d = ImageDraw.Draw(img)
    f = fonte(fonte_arq, tamanho)
    x0, y0, x1, y1 = d.textbbox((0, 0), texto, font=f)
    pos = (centro[0] - (x1 - x0) / 2 - x0, centro[1] - (y1 - y0) / 2 - y0)
    if halo:
        d.text(pos, texto, font=f, fill=cor, stroke_width=S(2.5), stroke_fill=halo)
    else:
        d.text(pos, texto, font=f, fill=cor)


def legenda(img, titulo, linha2):
    """Cartão no canto inferior esquerdo: 'Onde atendemos' + contagem."""
    d = ImageDraw.Draw(img)
    f1, f2 = fonte(FONTE_SEMI, 46), fonte(FONTE_REG, 40)
    m = S(40)
    t1 = d.textbbox((0, 0), titulo, font=f1)
    t2 = d.textbbox((0, 0), linha2, font=f2)
    quadrado = S(40)
    w = max(t1[2] - t1[0] + quadrado + S(16), t2[2] - t2[0]) + S(56)
    h = (t1[3] - t1[1]) + (t2[3] - t2[1]) + S(64)
    lado = TAM * SS
    caixa = [m, lado - m - h, m + w, lado - m]

    sombra = Image.new('L', img.size, 0)
    ImageDraw.Draw(sombra).rounded_rectangle([caixa[0], caixa[1] + S(5), caixa[2], caixa[3] + S(5)], radius=S(22), fill=90)
    sombra = sombra.filter(ImageFilter.GaussianBlur(S(10)))
    img.paste(Image.new('RGB', img.size, (10, 40, 70)), (0, 0), sombra)

    d = ImageDraw.Draw(img)
    d.rounded_rectangle(caixa, radius=S(22), fill=(255, 255, 255), outline=(205, 222, 238), width=S(1.5))
    x, y = caixa[0] + S(28), caixa[1] + S(24)
    qy = y + ((t1[3] - t1[1]) - quadrado) / 2
    d.rounded_rectangle([x, qy, x + quadrado, qy + quadrado], radius=S(7), fill=DESTAQUE_TOPO, outline=BORDA_DESTAQUE, width=S(2))
    d.text((x + quadrado + S(16) - t1[0], y - t1[1]), titulo, font=f1, fill=AZUL_TEXTO)
    d.text((x - t2[0], y + (t1[3] - t1[1]) + S(18) - t2[1]), linha2, font=f2, fill=CINZA_TEXTO)


def credito(img, texto):
    d = ImageDraw.Draw(img)
    f = fonte(FONTE_REG, 24)
    x0, y0, x1, y1 = d.textbbox((0, 0), texto, font=f)
    lado = TAM * SS
    d.text((lado - S(24) - (x1 - x0) - x0, lado - S(20) - (y1 - y0) - y0), texto, font=f, fill=(150, 165, 180))


def finalizar(img, destino):
    final = img.resize((TAM, TAM), Image.LANCZOS)
    final.save(destino, optimize=True)
    print(f'{destino}: {os.path.getsize(destino) // 1024} KB')


# ------------------------------------------------------------------
# Mapas
# ------------------------------------------------------------------
def criar_moldura(cfg):
    proj = Projecao(*cfg['centro'])
    if 'pontos' in cfg:
        return Moldura(proj, pontos=cfg['pontos'], folga=cfg.get('folga', 0.12))
    return Moldura(proj, *cfg['janela'])


def mapa_paises(mundo, cfg, destino):
    mold = criar_moldura(cfg)
    img = fundo()
    desenhar_grade(img, mold, cfg.get('grade', 10))

    destaque, outros = [], []
    filtro = cfg.get('filtro_lon')  # mostra só países cujo centro está nessa faixa de longitude
    for feat in mundo['features']:
        p = feat['properties']
        if filtro and not (filtro[0] <= p.get('LABEL_X', 0) <= filtro[1]):
            continue
        polys = poligonos_px(mold, feat['geometry'])
        if not polys:
            continue
        alvo = any(p.get(campo) == valor for campo, valor in cfg['destaques'])
        (destaque if alvo else outros).append(polys)

    for polys in outros:
        preencher(img, polys, TERRA)
    for polys in outros + destaque:
        preencher(img, polys, None, borda=BORDA_TERRA, largura=1.4)
    todos = [anel for polys in destaque for anel in polys]
    aplicar_destaque(img, todos)
    # fronteiras internas entre áreas destacadas (ex.: Inglaterra x País de Gales) em branco suave
    for polys in destaque:
        preencher(img, polys, None, borda=(150, 190, 222), largura=1.0)

    for texto, ancora_ll, pos_ll in cfg['etiquetas']:
        ancora = mold.ponto(*ancora_ll) if pos_ll else None
        centro = mold.ponto(*(pos_ll or ancora_ll))
        etiqueta(img, texto, centro, ancora=ancora, tamanho=cfg.get('fonte', 60))

    legenda(img, 'Onde atendemos', cfg['legenda'])
    credito(img, 'Dados: Natural Earth')
    finalizar(img, destino)


UF = {
    '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
    '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
    '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR', '42': 'SC', '43': 'RS',
    '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
}

# Ponto (lon, lat) onde vai a sigla de cada estado
CENTRO_UF = {
    'AC': (-70.4, -9.3), 'AL': (-36.6, -9.6), 'AP': (-51.9, 1.3), 'AM': (-64.5, -4.3), 'BA': (-41.8, -12.4),
    'CE': (-39.5, -5.1), 'DF': (-47.8, -15.8), 'ES': (-40.35, -19.75), 'GO': (-50.2, -16.8), 'MA': (-45.2, -5.0),
    'MT': (-55.9, -12.8), 'MS': (-54.7, -20.4), 'MG': (-44.6, -18.4), 'PA': (-52.4, -3.9), 'PB': (-36.7, -7.15),
    'PR': (-51.6, -24.6), 'PE': (-38.0, -8.35), 'PI': (-42.9, -7.4), 'RJ': (-42.6, -22.2), 'RN': (-36.6, -5.75),
    'RS': (-53.3, -29.6), 'RO': (-62.8, -10.9), 'RR': (-61.4, 2.1), 'SC': (-50.4, -27.3), 'SP': (-48.5, -22.2),
    'SE': (-37.4, -10.6), 'TO': (-48.3, -10.2),
}


def mapa_brasil(mundo, estados, cfg, destino):
    mold = criar_moldura(cfg)
    img = fundo()
    desenhar_grade(img, mold, 5)

    # países vizinhos, em tom mais claro (contexto)
    for feat in mundo['features']:
        if feat['properties'].get('ADMIN') == 'Brazil':
            continue
        polys = poligonos_px(mold, feat['geometry'])
        if polys:
            preencher(img, polys, TERRA_CONTEXTO, borda=BORDA_TERRA, largura=1.4)

    polys_uf = {}
    for feat in estados['features']:
        sigla = UF[str(feat['properties']['codarea'])]
        polys_uf[sigla] = poligonos_px(mold, feat['geometry'])

    for sigla, polys in polys_uf.items():
        if sigla not in cfg['destaques']:
            preencher(img, polys, TERRA)
    todos = [anel for s, polys in polys_uf.items() if s in cfg['destaques'] for anel in polys]
    aplicar_destaque(img, todos)
    for polys in polys_uf.values():
        preencher(img, polys, None, borda=BORDA_TERRA, largura=1.8)

    # contorno do Brasil, para separar dos países vizinhos
    pais = mascara([anel for polys in polys_uf.values() for anel in polys])
    dilatado = pais.filter(ImageFilter.MaxFilter(2 * S(1.5) + 1))
    contorno = Image.fromarray(np.clip(np.asarray(dilatado, dtype=int) - np.asarray(pais, dtype=int), 0, 255).astype(np.uint8))
    img.paste(Image.new('RGB', img.size, (132, 156, 180)), (0, 0), contorno)

    # siglas
    for sigla, (lon, lat) in CENTRO_UF.items():
        if sigla in cfg['destaques'] or sigla in cfg['sem_sigla']:
            continue
        texto_centralizado(img, sigla, mold.ponto(lon, lat), 36, CINZA_TEXTO, FONTE_SEMI)
    for sigla in cfg['destaques']:
        if sigla in cfg['chamadas']:
            continue
        texto_centralizado(img, sigla, mold.ponto(*CENTRO_UF[sigla]), 52, (255, 255, 255), FONTE_BOLD,
                           halo=(13, 70, 118))
    for sigla, pos in cfg['chamadas'].items():
        etiqueta(img, sigla, mold.ponto(*pos), ancora=mold.ponto(*CENTRO_UF[sigla]), tamanho=46)

    legenda(img, 'Onde atendemos', cfg['legenda'])
    credito(img, 'Dados: IBGE e Natural Earth')
    finalizar(img, destino)


MAPAS = [
    ('mapa-asia.png', {
        'centro': (100, 25), 'grade': 10, 'folga': 0.16,
        # enquadra Índia e Coreia do Sul, com folga para o contexto ao redor
        'pontos': [(68.0, 36.0), (97.4, 28.5), (77.5, 7.5), (130.5, 38.6), (126.0, 33.2), (100.0, 5.0)],
        'destaques': [('ADMIN', 'India'), ('ADMIN', 'South Korea')],
        'etiquetas': [
            ('Índia', (78.8, 22.5), None),
            ('Coreia do Sul', (127.9, 36.3), (135.5, 27.0)),
        ],
        'legenda': '2 países',
    }),
    ('mapa-europa.png', {
        'centro': (6, 50), 'janela': (-17, 25, 35, 61), 'grade': 5, 'fonte': 52,
        'destaques': [('ADMIN', 'Ireland'), ('NAME', 'England'), ('ADMIN', 'Portugal'),
                      ('ADMIN', 'Belgium'), ('ADMIN', 'Germany')],
        'etiquetas': [
            ('Irlanda', (-8.0, 53.2), (-12.6, 56.9)),
            ('Inglaterra', (-1.6, 52.7), (2.6, 57.4)),
            ('Bélgica', (4.6, 50.6), (0.2, 48.6)),
            ('Alemanha', (12.2, 50.2), None),
            ('Portugal', (-8.1, 39.7), (-13.3, 40.2)),
        ],
        'legenda': '5 países',
    }),
    ('mapa-americas.png', {
        'centro': (-92, 12), 'grade': 10, 'folga': 0.04, 'filtro_lon': (-180, -25),
        # enquadra do Alasca à Terra do Fogo e do Pacífico ao leste do Brasil
        'pontos': [(-167.0, 65.5), (-141.0, 70.0), (-95.0, 60.0), (-60.0, 47.0), (-80.0, 25.0),
                   (-34.8, -7.2), (-68.0, -55.5), (-81.0, -4.0), (-125.0, 40.0)],
        'destaques': [('ADMIN', 'United States of America'), ('ADMIN', 'Brazil')],
        'etiquetas': [
            ('Estados Unidos', (-98.5, 39.0), None),
            ('Brasil', (-52.0, -10.0), None),
        ],
        'legenda': '2 países',
    }),
]

BRASIL = ('mapa-brasil.png', {
    'centro': (-53, -14), 'janela': (-75, -33, -34, 6),
    'destaques': ['BA', 'SE', 'CE', 'PI', 'PA', 'MT', 'GO', 'DF', 'MG', 'SP', 'RJ', 'SC', 'PR'],
    'chamadas': {'SE': (-34.2, -12.2), 'DF': (-49.4, -13.0), 'RJ': (-39.6, -24.4)},
    'sem_sigla': ['AL'],
    'legenda': '12 estados + Distrito Federal',
})


def main():
    dados = sys.argv[1] if len(sys.argv) > 1 else '.'
    destino = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'img')
    with open(os.path.join(dados, 'world.geojson'), encoding='utf-8') as f:
        mundo = json.load(f)
    with open(os.path.join(dados, 'brasil_uf.geojson'), encoding='utf-8') as f:
        estados = json.load(f)
    so = sys.argv[2] if len(sys.argv) > 2 else None
    for nome, cfg in MAPAS:
        if so in (None, nome):
            mapa_paises(mundo, cfg, os.path.join(destino, nome))
    if so in (None, BRASIL[0]):
        mapa_brasil(mundo, estados, BRASIL[1], os.path.join(destino, BRASIL[0]))


if __name__ == '__main__':
    main()
