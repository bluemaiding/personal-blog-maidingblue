"""Pandoc conversion with OOXML font inheritance preserved. Standard library only."""
import base64
import html
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from html.parser import HTMLParser

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
NS = {'w': W[1:-1], 'a': A[1:-1]}
for prefix, uri in [('w', W[1:-1]), ('a', A[1:-1]),
                    ('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'),
                    ('m', 'http://schemas.openxmlformats.org/officeDocument/2006/math')]:
    ET.register_namespace(prefix, uri)


def font_css(name):
    # CSS escapes survive HTML serialization and cannot terminate the attribute.
    return 'font-family: "' + ''.join(c if c.isalnum() or c in ' -_' else '\\%x ' % ord(c) for c in name) + '", serif;'


class CleanHTML(HTMLParser):
    """Keep document markup/fonts; imported content must not run in the publisher origin."""
    allowed = set('p div span h1 h2 h3 h4 h5 h6 a img figure figcaption blockquote ul ol li dl dt dd table thead tbody tfoot tr td th caption colgroup col pre code em strong b i u s del sub sup br hr section aside details summary small mark q cite abbr'.split())
    blocked = set('script style iframe object embed form input button textarea select link meta base svg math'.split())

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.parts, self.depth = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in self.blocked:
            if tag not in {'input', 'embed', 'link', 'meta', 'base'}:
                self.depth += 1
            return
        if self.depth or tag not in self.allowed:
            return
        clean = []
        for key, value in attrs:
            if value is None or key not in {'class', 'id', 'href', 'src', 'alt', 'title', 'style', 'width', 'height', 'colspan', 'rowspan', 'start', 'type'}:
                continue
            if key in {'href', 'src'}:
                compact = re.sub(r'[\x00-\x20]', '', html.unescape(value))
                if re.match(r'(?i)(?:javascript|vbscript|data|file):', compact) and not re.match(r'(?i)data:image/(?:png|jpeg|gif|webp);base64,', compact):
                    continue
            if key == 'style':
                # Fonts, alignment and emphasis only. No CSS resource loading.
                value = ';'.join(rule for rule in value.split(';') if re.match(r'^\s*(?:font-family|font-size|font-weight|font-style|text-align|text-decoration|vertical-align|color)\s*:', rule) and not re.search(r'(?i)url\s*\(|expression|@|[<>]', rule))
            clean.append(' %s="%s"' % (key, html.escape(value, quote=True)))
        self.parts.append('<' + tag + ''.join(clean) + '>')

    def handle_endtag(self, tag):
        if tag in self.blocked:
            self.depth = max(0, self.depth - 1)
        elif not self.depth and tag in self.allowed:
            self.parts.append('</' + tag + '>')

    def handle_data(self, value):
        if not self.depth:
            self.parts.append(value.replace('<', '&lt;').replace('>', '&gt;'))

    def handle_entityref(self, name):
        if not self.depth:
            self.parts.append('&' + name + ';')

    def handle_charref(self, name):
        if not self.depth:
            self.parts.append('&#' + name + ';')


def annotate_docx(src, dst):
    with zipfile.ZipFile(src) as z:
        if sum(i.file_size for i in z.infolist()) > 160 * 1024 * 1024:
            raise ValueError('Word 解压后过大，请拆分文档。')
        document = ET.fromstring(z.read('word/document.xml'))
        styles = ET.fromstring(z.read('word/styles.xml')) if 'word/styles.xml' in z.namelist() else ET.Element('styles')
        theme = ET.fromstring(z.read('word/theme/theme1.xml')) if 'word/theme/theme1.xml' in z.namelist() else ET.Element('theme')
        style_map = {s.get(W + 'styleId'): s for s in styles.findall('w:style', NS)}
        default_style = next((s.get(W + 'styleId') for s in styles.findall('w:style', NS)
                              if s.get(W + 'type') == 'paragraph' and s.get(W + 'default') == '1'), 'Normal')

        def properties(rpr):
            if rpr is None:
                return {}
            fonts = rpr.find('w:rFonts', NS)
            result = {}
            if fonts is not None:
                for key in ['ascii', 'hAnsi', 'eastAsia', 'cs']:
                    # A direct typeface at this level overrides inherited theme declarations.
                    direct = fonts.get(W + key)
                    themed = fonts.get(W + (key + 'Theme' if key != 'eastAsia' else 'eastAsiaTheme'))
                    if direct:
                        result[key] = direct
                    elif themed:
                        group = 'majorFont' if themed.startswith('major') else 'minorFont'
                        family = theme.find('.//a:fontScheme/a:' + group, NS)
                        if family is not None:
                            leaf = family.find('a:ea' if key == 'eastAsia' else 'a:latin', NS)
                            value = leaf.get('typeface') if leaf is not None else ''
                            if key == 'eastAsia' and not value:
                                value = next((f.get('typeface') for f in family.findall('a:font', NS) if f.get('script') == 'Hans'), '')
                            if value:
                                result[key] = value
            return result

        defaults = properties(styles.find('w:docDefaults/w:rPrDefault/w:rPr', NS))

        def inherited(style_id, visited=None):
            visited = set() if visited is None else visited
            if style_id not in style_map or style_id in visited:
                return {}
            visited.add(style_id)
            s = style_map[style_id]
            parent = s.find('w:basedOn', NS)
            result = inherited(parent.get(W + 'val'), visited) if parent is not None else {}
            result.update(properties(s.find('w:rPr', NS)))
            return result

        markers, fonts, title, title_style, title_runs = {}, set(), '', '', []
        sequence = 0
        for part_name in z.namelist():
            if not re.match(r'word/(document|footnotes|endnotes)\.xml$', part_name):
                continue
            part = document if part_name == 'word/document.xml' else ET.fromstring(z.read(part_name))
            for paragraph in part.findall('.//w:p', NS):
                pstyle = paragraph.find('w:pPr/w:pStyle', NS)
                pfonts = {**defaults, **inherited(default_style), **inherited(pstyle.get(W + 'val') if pstyle is not None else default_style)}
                pfonts.update(properties(paragraph.find('w:pPr/w:rPr', NS)))
                paragraph_text = ''.join(t.text or '' for t in paragraph.findall('.//w:t', NS)).strip()
                is_title = not title and paragraph_text and part_name == 'word/document.xml'
                if is_title:
                    title = paragraph_text
                for run in paragraph.findall('.//w:r', NS):
                    rstyle = run.find('w:rPr/w:rStyle', NS)
                    rfonts = {**pfonts, **inherited(rstyle.get(W + 'val') if rstyle is not None else '')}
                    rfonts.update(properties(run.find('w:rPr', NS)))
                    for text in run.findall('w:t', NS):
                        chunks = re.findall(r'[\u2e80-\ua4cf\uac00-\ud7af\uf900-\ufaff\ufe30-\uffef]+|[^\u2e80-\ua4cf\uac00-\ud7af\uf900-\ufaff\ufe30-\uffef]+', text.text or '')
                        output = []
                        for chunk in chunks:
                            eastern = '\u2e80' <= chunk[0] <= '\uffef'
                            name = rfonts.get('eastAsia' if eastern else 'ascii') or rfonts.get('hAnsi') or rfonts.get('ascii')
                            if not name:
                                output.append(chunk)
                                if is_title:
                                    title_runs.append({'text': chunk, 'font': ''})
                                continue
                            fonts.add(name)
                            if is_title and not title_style and chunk.strip():
                                title_style = font_css(name)
                            if is_title:
                                title_runs.append({'text': chunk, 'font': name})
                            sequence += 1
                            opening, closing = 'BLOGFONT%dOPEN' % sequence, 'BLOGFONT%dCLOSE' % sequence
                            markers[opening] = '<span style="%s">' % html.escape(font_css(name), quote=True)
                            markers[closing] = '</span>'
                            output.extend([opening, chunk, closing])
                        text.text = ''.join(output)
            if part_name == 'word/document.xml':
                document = part
            markers['_part:' + part_name] = ET.tostring(part, encoding='utf-8', xml_declaration=True)
        with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as out:
            for entry in z.infolist():
                out.writestr(entry, markers.get('_part:' + entry.filename, z.read(entry.filename)))
        markers = {k: v for k, v in markers.items() if not k.startswith('_part:')}
        return markers, title, title_style, sorted(fonts), title_runs


def convert(request):
    data = base64.b64decode(request['data'], validate=True)
    ext = Path(request['name']).suffix.lower()
    with tempfile.TemporaryDirectory(prefix='blog-convert-') as temp:
        folder = Path(temp)
        source = folder / ('input' + ext)
        source.write_bytes(data)
        markers, title, title_style, fonts, title_runs = {}, '', '', [], []
        if ext == '.docx':
            prepared = folder / 'fonts.docx'
            markers, title, title_style, fonts, title_runs = annotate_docx(source, prepared)
            source = prepared
        elif ext in ['.md', '.markdown', '.txt']:
            text = data.decode('utf-8-sig')
            if '\x00' in text:
                raise ValueError('文件包含二进制内容，请保存为 UTF-8 文本。')
            source.write_text(text, encoding='utf-8')
        else:
            raise ValueError('仅支持 .md、.markdown、.txt、.docx。')

        def pandoc(writer):
            reader = 'docx' if ext == '.docx' else 'markdown-smart+tex_math_dollars+tex_math_single_backslash+east_asian_line_breaks'
            args = [request['pandoc'], str(source), '-f', reader, '-t', writer, '--wrap=none']
            if ext == '.docx':
                args.append('--extract-media=media')
            if writer == 'html5':
                args.append('--mathjax')
            if ext == '.txt':
                # Plain text stays literal, including punctuation and newlines.
                return '\n'.join('<p>' + html.escape(p).replace('\n', '<br>\n') + '</p>' for p in source.read_text(encoding='utf-8').split('\n\n')) if writer == 'html5' else source.read_text(encoding='utf-8')
            run = subprocess.run(args, cwd=temp, capture_output=True, creationflags=0x08000000 if os.name == 'nt' else 0, timeout=90)
            if run.returncode:
                raise ValueError('转换失败：' + run.stderr.decode('utf-8', errors='replace')[:2000])
            result = run.stdout.decode('utf-8')
            for marker, value in markers.items():
                result = result.replace(marker, value)
            return result

        body = pandoc('html5')
        cleaner = CleanHTML()
        cleaner.feed(body)
        body = ''.join(cleaner.parts)
        markdown = pandoc('markdown+raw_html+tex_math_dollars') if ext == '.docx' else source.read_text(encoding='utf-8')
        assets = []
        for file in (folder / 'media').rglob('*') if (folder / 'media').exists() else []:
            if file.is_file():
                assets.append({'name': file.relative_to(folder).as_posix(), 'data': base64.b64encode(file.read_bytes()).decode('ascii')})
        return {'html': body, 'markdown': markdown, 'title': title, 'titleStyle': title_style, 'titleRuns': title_runs, 'fonts': fonts, 'assets': assets}


if __name__ == '__main__':
    try:
        result = convert(json.loads(sys.stdin.buffer.read().decode('utf-8')))
        sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
    except Exception as error:
        sys.stderr.buffer.write(str(error).encode('utf-8', errors='replace'))
        sys.exit(1)
