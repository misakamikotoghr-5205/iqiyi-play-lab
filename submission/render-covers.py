"""Original cover designs, using the apps' own motifs. These are not screenshots.

Optional authoring dependency: CairoSVG 2.8+. No dependency is added to the apps.
Run from any directory: python3 submission/render-covers.py
"""
from __future__ import annotations

import hashlib
import html
import json
from pathlib import Path

import cairosvg

ROOT = Path(__file__).resolve().parent
FONT = 'Noto Sans CJK SC, sans-serif'


def text(x, y, value, size=26, color='#e9e8da', weight=400, family=FONT):
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
        f'font-weight="{weight}" fill="{color}">{html.escape(value)}</text>'
    )


def rain_art():
    shapes = []
    for i in range(24):
        x = 6 + i * 28
        y = 18 + (i % 4) * 27
        shapes.append(f'<path d="M{x} {y}l-18 49" stroke="#729a9d" stroke-width="2" opacity=".4"/>')
    shapes.append('<circle cx="560" cy="78" r="43" fill="#c6d9cc"/>')
    for x, y, w, h in ((12, 188, 155, 183), (182, 128, 208, 243), (410, 169, 252, 202)):
        shapes.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#2f4850"/>')
        for row in range(2):
            for col in range(3):
                shapes.append(f'<rect x="{x+22+col*42}" y="{y+27+row*47}" width="19" height="28" fill="#c2ae7c" opacity=".7"/>')
    shapes.append('<path d="M0 373H680" stroke="#759093" stroke-width="2"/>')
    shapes.append('<ellipse cx="320" cy="397" rx="128" ry="12" fill="#729a9d" opacity=".35"/>')
    shapes.append('<path d="M227 279Q320 166 413 279Q387 254 366 279Q343 256 320 279Q296 256 273 279Q250 255 227 279Z" fill="#c78c78"/>')
    shapes.append('<path d="M320 220V363Q320 384 339 377" fill="none" stroke="#edd8bd" stroke-width="7" stroke-linecap="round"/>')
    return ''.join(shapes)


def cat(x, y, color, scale=1):
    return (
        f'<g transform="translate({x} {y}) scale({scale})">'
        f'<path d="M-24-6L-26-31-7-20Q0-23 7-20L26-31 24-6Q31 24 0 28Q-31 24-24-6" fill="{color}"/>'
        '<circle cx="-10" cy="0" r="3" fill="#28382d"/>'
        '<circle cx="10" cy="0" r="3" fill="#28382d"/>'
        '<path d="M-4 9L0 13 4 9M0 13v5" stroke="#28382d" fill="none" stroke-width="2"/>'
        '</g>'
    )


def cat_art():
    shapes = []
    walls = {6, 8, 16, 18}  # Actual first-level geometry; rendered as cover art.
    for row in range(5):
        for col in range(5):
            x, y = 110 + col * 81, row * 81
            fill = '#d8dfcb' if row * 5 + col in walls else '#eee7d8'
            shapes.append(f'<rect x="{x}" y="{y}" width="73" height="73" rx="12" fill="{fill}"/>')
            if row * 5 + col in walls:
                for dx, dy in ((-10, 0), (10, 0), (0, -10), (0, 10)):
                    shapes.append(f'<circle cx="{x+36+dx}" cy="{y+36+dy}" r="8" fill="#78997b"/>')
    shapes.append('<path d="M146 360V198H470V39" fill="none" stroke="#c8794c" stroke-width="5" stroke-dasharray="9 12" opacity=".65"/>')
    for x, color in ((146, '#6d8b73'), (470, '#c8794c')):
        shapes.append(f'<path d="M{x-20} 45V20L{x} 3l20 17v25Z" fill="none" stroke="{color}" stroke-width="5"/>')
    shapes.append(cat(146, 360, '#c8794c'))
    shapes.append(cat(470, 360, '#95b099'))
    return ''.join(shapes)


def frame_art():
    shapes = []
    colors = ['#9baa98', '#c7a16e', '#dacb9f']
    for i, color in enumerate(colors):
        x = 8 + i * 224
        shapes.append(f'<rect x="{x}" y="65" width="208" height="238" fill="#36382e" stroke="{color}" stroke-width="2"/>')
        for j in range(6):
            shapes.append(f'<rect x="{x+14+j*31}" y="44" width="15" height="10" fill="{color}"/>')
            shapes.append(f'<rect x="{x+14+j*31}" y="314" width="15" height="10" fill="{color}"/>')
        shapes.append(text(x + 17, 281, ['01 / 暗下', '02 / 点亮', '03 / 复明'][i], 21, color))
    shapes.append('<rect x="36" y="155" width="150" height="78" rx="8" fill="#9baa98"/><circle cx="73" cy="194" r="22" fill="#36382e"/><path d="M112 176h48M112 190h48M112 204h48" stroke="#36382e" stroke-width="5"/>')
    shapes.append('<rect x="322" y="169" width="31" height="68" fill="#dacb9f"/><path d="M338 161Q305 138 339 113Q367 143 338 161" fill="#e0a977"/><path d="M338 114V96" stroke="#dacb9f" stroke-width="2"/>')
    shapes.append('<path d="M558 113V169M509 169H607L584 206H532Z" fill="#dacb9f"/><path d="M528 221L509 245M558 229v27M589 221l20 24" stroke="#dacb9f" stroke-width="3"/>')
    shapes.append('<path d="M15 374H654" stroke="#9baa98" stroke-width="2"/><path d="M299 354l24 20-24 20" fill="none" stroke="#dacb9f" stroke-width="3"/>')
    return ''.join(shapes)


def echo_art():
    shapes = ['<rect x="91" y="6" width="494" height="393" rx="25" fill="#242944"/>']
    for y in range(22, 390, 38):
        shapes.append(f'<path d="M110 {y}H566" stroke="#42486b" stroke-width="1"/>')
    shapes.append('<path d="M338 20V388" stroke="#6a7195" stroke-width="2"/>')
    for y, r, color in ((58, 10, '#b7a3ed'), (138, 14, '#b7a3ed'), (218, 19, '#d8e79d'), (320, 25, '#d8e79d')):
        shapes.append(f'<circle cx="338" cy="{y}" r="{r+12}" fill="none" stroke="{color}" stroke-width="1" opacity=".35"/><circle cx="338" cy="{y}" r="{r}" fill="{color}"/>')
    shapes.append('<path d="M140 320H536" stroke="#d8e79d" stroke-width="4"/>')
    shapes.append(text(173, 369, '跟着光，轻敲一下', 24, '#d8e79d'))
    return ''.join(shapes)


APPS = [
    dict(id='rain-alley', title=['雨巷', '来信'], eyebrow='雾港故事集 / 原创分支推理', tagline='一场雨，三种真相', detail='六个时段 · 五处走访 · 证据手记', background='#19232c', accent='#c78c78', ink='#e4e8d9', art=rain_art),
    dict(id='cat-dispatch', title=['猫咪', '调度站'], eyebrow='MEOW TRANSIT / 原创网格谜题', tagline='少走一点，互相让一让', detail='四关原创 · 可撤回 · 最短路径提示', background='#f7f1e6', accent='#b46441', ink='#293c31', art=cat_art),
    dict(id='frame-director', title=['24帧', '导演'], eyebrow='独立电影练习室 / 叙事拼图', tagline='把因果接好，让故事成立', detail='四个短篇 · 镜头换序 · 连续试映', background='#23231f', accent='#dacb9f', ink='#e5e3ce', art=frame_art),
    dict(id='echo-rhythm', title=['回声', '节拍'], eyebrow='ECHO / 原创离线节奏游戏', tagline='声音关着，也能完整演奏', detail='三份谱面 · 节拍校准 · 纯视觉模式', background='#1c1e35', accent='#d8e79d', ink='#ede7e0', art=echo_art),
]


def cover(app, landscape=False):
    width, height = (1280, 720) if landscape else (720, 960)
    ink, accent = app['ink'], app['accent']
    items = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">', f'<rect width="100%" height="100%" fill="{app["background"]}"/>']
    items.append(text(52, 56, app['eyebrow'], 18, accent, 500))
    if landscape:
        items += [text(52, 215, app['title'][0], 112, ink, 800), text(52, 350, app['title'][1], 112, ink, 800), text(56, 436, app['tagline'], 28, accent), text(56, 490, app['detail'], 22, ink)]
        items.append(f'<g transform="translate(618 170) scale(.88)">{app["art"]()}</g>')
        footer_y = 671
    else:
        items += [text(52, 192, app['title'][0], 118, ink, 800), text(52, 328, app['title'][1], 118, ink, 800), text(56, 392, app['tagline'], 29, accent)]
        items.append(f'<g transform="translate(52 453) scale(.91)">{app["art"]()}</g>')
        items.append(text(56, 887, app['detail'], 23, ink))
        footer_y = 934
    items.append(text(56, footer_y, '原创封面设计 · 非应用截图', 18, accent))
    items.append('</svg>')
    return ''.join(items)


def main():
    records = []
    out = ROOT / 'covers'
    out.mkdir(parents=True, exist_ok=True)
    for app in APPS:
        for variant, landscape in [('portrait', False), ('landscape', True)]:
            stem = f'{app["id"]}-{variant}'
            svg_path = out / f'{stem}.svg'
            png_path = out / f'{stem}.png'
            svg_path.write_text(cover(app, landscape), encoding='utf-8')
            cairosvg.svg2png(url=str(svg_path), write_to=str(png_path))
            data = png_path.read_bytes()
            records.append(dict(app=app['id'], kind='original_cover_not_screenshot', variant=variant, file=f'covers/{png_path.name}', editable_source=f'covers/{svg_path.name}', width=1280 if landscape else 720, height=720 if landscape else 960, bytes=len(data), sha256=hashlib.sha256(data).hexdigest()))
    (ROOT / 'cover-manifest.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    print(f'Generated {len(records)} original covers and editable SVG sources; no screenshots generated.')


if __name__ == '__main__':
    main()
