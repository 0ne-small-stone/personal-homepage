"""Regenerate the public functional sample; website builds use the committed PDF.

Requires reportlab, pypdf and fonttools. Supply the upstream OFL Noto Sans SC
variable TrueType font with --font; never copy a machine-specific path into the site.
"""
import argparse
import hashlib
import json
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont as FontFile
from fontTools.varLib.instancer import instantiateVariableFont
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'public/materials/lssh-pdf-reading-check.pdf'
PAGES = [
    ('从一个入口开始', [
        ('PDF 阅读验证说明', '这是 Little Stone Still Here 的功能样本，用于检查阅读与下载，不是课程讲义或个人原创学习笔记。'),
        ('找到一份内容', '在学习总览选择资料、文章或笔记，再选择主题。结果同时满足两项条件。没有结果时，可以调整条件或清空筛选。'),
        ('打开后直接阅读', 'PDF 条目打开后直接显示阅读器。资料说明、文件信息和关联内容放在阅读区之后。外部笔记在作者原站阅读。'),
        ('先试一次', '翻到第 3 页，选择 125% 缩放，然后刷新。浏览器存储可用时，应回到同一页和缩放状态。'),
    ]),
    ('使用阅读器', [
        ('翻页与缩放', '在页码框输入页码并确认，或使用上一页、下一页。缩放菜单可以选择比例，也可以适应页面宽度。放大后可在阅读区内滚动。'),
        ('在文档里查找', '打开阅读器的搜索框，输入“阅读验证”。这份样本有可选择的中文文字。扫描件是否能查找文字，要看原文件有没有文字层。'),
        ('全屏与下载', '全屏阅读在新标签打开完整阅读器。下载 PDF 得到同一份文件，可用浏览器或本机阅读软件打开。'),
        ('加载失败时', '阅读区会显示失败说明，可重新加载或下载原文件。附件尚未接入时，页面会明确说明当前无法阅读。'),
    ]),
    ('回到刚才的位置', [
        ('阅读验证', '本页是页码和中文搜索的验证目标。你现在位于第 3 页，可以设为 125% 后刷新。'),
        ('回到筛选列表', '使用正文前的返回入口回到来处。主题、内容类型和原列表位置应保持，键盘焦点回到刚才打开的条目。'),
        ('继续读关联内容', '阅读页之后的关联链接可进入另一份资料、文章或笔记。返回后，继续使用原来的 PDF 阅读位置。'),
        ('从搜索进入', '搜索结果可以打开正文或章节。返回搜索后，原关键词和对应结果应恢复。直接粘贴详情地址也有明确的栏目返回入口。'),
    ]),
    ('记录一次验证', [
        ('逐项观察', '确认标题和页数正确；翻到第 3 页；选择 125%；刷新；返回学习总览；再次打开；下载并检查文件。每一步观察实际结果。'),
        ('记下差异', '记录打开地址、设备、浏览器，以及哪一步发生了变化。截图可以帮助比较，但不能代替实际翻页、返回和下载。'),
        ('阅读历史的范围', '历史保存在当前浏览器和站点地址下。清除存储、禁用存储、换设备或换地址后，可能从第 1 页开始。文件本身始终可独立阅读。'),
        ('样本与使用条件', '生成日期：2026-10-08。样本正文使用 CC0-1.0；嵌入 Noto Sans SC 字体采用 SIL Open Font License 1.1，许可独立保留。'),
    ]),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font', required=True, type=Path)
    args = parser.parse_args()
    font_bytes = args.font.read_bytes()
    font = FontFile(BytesIO(font_bytes), recalcTimestamp=False)
    families = sorted({n.toUnicode() for n in font['name'].names if n.nameID in (1, 16)})
    versions = sorted({n.toUnicode() for n in font['name'].names if n.nameID == 5})
    if 'glyf' not in font or 'fvar' not in font or 'Noto Sans SC' not in families:
        raise ValueError('Supply the OFL Noto Sans SC variable TrueType font.')
    for name, weight in [('ReadingBody', 400), ('ReadingHeading', 600)]:
        static = instantiateVariableFont(font, {'wght': weight}, inplace=False)
        static.recalcTimestamp = False
        buffer = BytesIO()
        static.save(buffer)
        buffer.seek(0)
        pdfmetrics.registerFont(TTFont(name, buffer))

    styles = {
        'eyebrow': ParagraphStyle('eyebrow', fontName='ReadingBody', fontSize=9, leading=14, textColor=colors.HexColor('#596067'), spaceAfter=16),
        'title': ParagraphStyle('title', fontName='ReadingHeading', fontSize=23, leading=32, textColor=colors.HexColor('#292C2E'), spaceAfter=22, wordWrap='CJK'),
        'heading': ParagraphStyle('heading', fontName='ReadingHeading', fontSize=12, leading=19, textColor=colors.HexColor('#345B63'), spaceAfter=5, wordWrap='CJK'),
        'body': ParagraphStyle('body', fontName='ReadingBody', fontSize=10.5, leading=18, textColor=colors.HexColor('#292C2E'), spaceAfter=17, wordWrap='CJK'),
    }
    story = []
    for number, (title, sections) in enumerate(PAGES, 1):
        if number > 1:
            story.append(PageBreak())
        story.append(Paragraph(f'LITTLE STONE STILL HERE / {number:02}', styles['eyebrow']))
        story.append(Paragraph(escape(title), styles['title']))
        for heading, body in sections:
            story.append(Paragraph(escape(heading), styles['heading']))
            story.append(Paragraph(escape(body), styles['body']))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#CDD2D2'))
        canvas.line(38, 38, A5[0] - 38, 38)
        canvas.setFillColor(colors.HexColor('#596067'))
        canvas.setFont('ReadingBody', 8)
        canvas.drawString(38, 24, 'LSSH · 功能样本 · 2026-10-08')
        canvas.drawRightString(A5[0] - 38, 24, f'{doc.page} / 4')
        canvas.restoreState()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A5, leftMargin=38, rightMargin=38, topMargin=42, bottomMargin=55,
                            invariant=1, pageCompression=1, title='PDF 阅读验证说明（功能样本）', author='Little Stone Still Here project',
                            subject='CC0-1.0 text; embedded Noto Sans SC under SIL OFL 1.1')
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    reader = PdfReader(OUTPUT)
    if len(reader.pages) != 4:
        raise ValueError(f'Expected 4 pages, got {len(reader.pages)}')
    for page, (title, _) in zip(reader.pages, PAGES):
        if title not in page.extract_text():
            raise ValueError(f'Missing Chinese text: {title}')
    data = OUTPUT.read_bytes()
    print(json.dumps({'file': OUTPUT.relative_to(ROOT).as_posix(), 'pages': len(reader.pages), 'bytes': len(data),
                      'sha256': hashlib.sha256(data).hexdigest(), 'fontFamilies': families, 'fontVersions': versions,
                      'fontSha256': hashlib.sha256(font_bytes).hexdigest(), 'textLicense': 'CC0-1.0', 'fontLicense': 'OFL-1.1'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
