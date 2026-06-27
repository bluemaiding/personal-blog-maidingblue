import sys, os
os.environ['PYTHONIOENCODING'] = 'utf-8'
from docx import Document

files = [
    r'C:\Users\bluem\Desktop\claude\blog\两种"伟大"的歧途：《了不起的盖茨比》与《远大前程》中"Great"寓意的再审视.docx',
    r'C:\Users\bluem\Desktop\claude\blog\谁守望谁？——《麦田里的守望者》中"守望者"意象的重释.docx'
]

for fpath in files:
    print("=" * 80)
    print(f"FILE: {os.path.basename(fpath)}")
    print("=" * 80)
    doc = Document(fpath)
    for p in doc.paragraphs:
        print(p.text)
    print()
