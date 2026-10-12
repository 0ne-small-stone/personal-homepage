"""Render the dated LSSH brand manual snapshot from the existing design system.

Usage: python build-brand-manual.py --font <Chinese TTF/TTC> --bold-font <TTF/TTC>
The arguments locate installed fonts. No font files are copied to the project.
"""
from pathlib import Path
import argparse
import json
import re
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

parser = argparse.ArgumentParser()
parser.add_argument('--font', required=True)
parser.add_argument('--bold-font', required=True)
parser.add_argument('--latin-font', required=True)
args = parser.parse_args()
BASE = Path(__file__).resolve().parent
DESIGN = BASE.parent
SYSTEM = (DESIGN / 'SYSTEM.md').read_text(encoding='utf-8')
pdfmetrics.registerFont(TTFont('CN', args.font, subfontIndex=0))
pdfmetrics.registerFont(TTFont('CNB', args.bold_font, subfontIndex=0))
pdfmetrics.registerFont(TTFont('LATIN', args.latin_font))
COLORS = {}
LIGHT = {}
for line in SYSTEM.splitlines():
    match = re.match(r'\| `--color-([\w-]+)` \| `(#[0-9A-Fa-f]+)` \| (?:`(#[0-9A-Fa-f]+)`|未指定)', line)
    if match:
        COLORS[match[1]] = match[2]
        if match[3]: LIGHT[match[1]] = match[3]
MOTION = {k: int(v) for k,v in re.findall(r'\| `--motion-(\w+)` \| (\d+)ms', SYSTEM)}
RADIUS = {k: int(v) for k,v in re.findall(r'\| `--radius-(\w+)` \| (\d+)px', SYSTEM)}
required = ['bg','surface','surface-active','text','muted','accent','border','divider']
assert all(k in COLORS for k in required)
LOGO = DESIGN / 'iterations/samples/u03-p01-2026-10-08-07/lssh-wordmark-white-transparent.png'
OUTPUT = BASE / 'lssh-brand-manual-v0.1.pdf'
W,H = 960,600
c = canvas.Canvas(str(OUTPUT), pagesize=(W,H), pageCompression=1)
c.setTitle('Little Stone Still Here | Brand Manual 0.1')
c.setAuthor('Little Stone Still Here')
c.setSubject('品牌概念、标志、字体、色彩与应用规范；2026-10-08 快照')
page = 0
islight = False
audit=[]

def col(key='text'):
    return (LIGHT if islight else COLORS).get(key, COLORS.get(key,key))
def rect(x,y,w,h,fill,stroke=None,r=0,lw=1):
    c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke or fill));c.setLineWidth(lw)
    if r:c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))
    else:c.rect(x,H-y-h,w,h,fill=1,stroke=bool(stroke))
def line(x1,y1,x2,y2,color=None,lw=1,dash=None):
    c.setStrokeColor(HexColor(color or col('border')));c.setLineWidth(lw);c.setDash(dash or [])
    c.line(x1,H-y1,x2,H-y2);c.setDash([])
def txt(s,x,y,size=12,color=None,font='CN',align='left'):
    c.setFont(font,size);c.setFillColor(HexColor(color or col()))
    fn={'left':c.drawString,'right':c.drawRightString,'center':c.drawCentredString}[align]
    fn(x,H-y-size*.82,s)
    audit.append({'page':page,'text':s,'x':x,'y':y,'size':size})
def para(s,x,y,width=300,size=12,color=None,leading=None,font='CN'):
    leading=leading or size*1.8
    cursor=y
    for block in s.split('\n'):
        row=''
        for char in block:
            if row and pdfmetrics.stringWidth(row+char,font,size)>width:
                txt(row,x,cursor,size,color,font);cursor+=leading;row=''
            row+=char
        if row:txt(row,x,cursor,size,color,font);cursor+=leading
    return cursor
def label(s,x,y,color=None):txt(s,x,y,9,color or col('muted'),'LATIN' if s.isascii() else 'CN')
def circle(x,y,r,stroke=None,fill=None,lw=1):
    c.setLineWidth(lw);c.setStrokeColor(HexColor(stroke or col('border')))
    if fill:c.setFillColor(HexColor(fill))
    c.circle(x,H-y,r,stroke=bool(stroke),fill=bool(fill))
def logo(x,y,w):
    # Place the unmodified source by its visible ink bounds (alpha > 200).
    scale=w/1188
    iw,ih=1536*scale,1024*scale
    c.drawImage(ImageReader(str(LOGO)),x-182*scale,H-y-ih+183*scale,iw,ih,mask='auto')
def begin(title,slug,light=False,source='SYSTEM / CONCEPT'):
    global page,islight
    if page:c.showPage()
    page+=1;islight=light
    rect(0,0,W,H,col('bg'))
    label('LSSH  /  BRAND MANUAL',44,27)
    label(slug.upper(),916,27) if False else txt(slug.upper(),916,27,9,col('muted'),'LATIN','right')
    line(44,50,916,50,col('border') if light else col('divider'),.5)
    txt(title,44,80,30,font='CNB')
    line(44,551,916,551,col('border') if light else col('divider'),.5)
    label('LITTLE STONE STILL HERE   /   0.1   /   2026.10.08',44,568)
    txt(f'{source}     {page:02d} / 16',916,568,8,col('muted'),'LATIN','right')
    c.bookmarkPage(f'p{page}')
    c.addOutlineEntry(f'{page:02d}  {title}',f'p{page}',0)
def note(s,x=44,y=519,w=870):para(s,x,y,w,10,col('muted'),15)
def heading(s,x,y):txt(s,x,y,15,font='CNB')
def tag(s,x,y,w=100):
    rect(x,y,w,22,col('surface'),r=4)
    txt(s,x+9,y+5,9)
def button(s,x,y,w=120,primary=False,focus=False):
    fill=col('text') if primary else col('surface')
    ink=col('bg') if primary else col('text')
    rect(x,y,w,44,fill,None if primary else col('border'),RADIUS['control'])
    txt(s,x+w/2,y+15,12,ink,align='center')
    if focus:
        c.setStrokeColor(HexColor(col('accent')));c.setLineWidth(2)
        c.roundRect(x-5,H-y-49,w+10,54,RADIUS['control']+4,stroke=1,fill=0)
def wall(x,y,w,h,dark=False):
    base=COLORS['bg'] if dark else LIGHT['bg']
    rect(x,y,w,h,base)
    c.saveState()
    clip=c.beginPath();clip.rect(x,H-y-h,w,h);c.clipPath(clip,stroke=0,fill=0)
    bh=52;bw=130
    for row in range(int(h/bh)+2):
        for j in range(-1,int(w/bw)+2):
            xx=x+j*bw+(row%2)*bw/2
            fill=COLORS['bg'] if dark else LIGHT['surface']
            stroke=COLORS['divider'] if dark else '#D4D0C8'
            rect(xx+2,y+row*bh+2,bw-4,bh-4,fill,stroke,3,.5)
    c.restoreState()
def prism(cx,cy,scale=1,ink=None):
    ink=ink or col('accent')
    line(cx-27*scale,cy+24*scale,cx,cy-25*scale,ink,1)
    line(cx,cy-25*scale,cx+29*scale,cy+24*scale,ink,1)
    line(cx+29*scale,cy+24*scale,cx-27*scale,cy+24*scale,ink,1)

# 01 — Cover.
begin('','IDENTITY & EXPERIENCE',source='APPROVED WORDMARK')
logo(230,130,500)
txt('品牌手册',44,504,17)
para('一个人留下的东西，让另一个人感到他的存在。',545,509,371,11,col('muted'),22)

# 02 — Essence.
begin('持续在场','01 / ESSENCE',True,'CONCEPT 1 / 1.4')
txt('留下的东西，',44,159,48,font='CNB')
txt('让人感觉你仍在这里。',44,221,48,font='CNB')
para('Little Stone 对应具体的主人；Still Here 表达内容留下的存在感。\n学习、作品、影像和歌曲，让一次陌生的访问逐渐变成认识。',48,312,730,14,col('muted'),25)
for i,(a,b,d) in enumerate([('01','留下','记录思考、时间与过程'),('02','靠近','让访客自己选择了解的深度'),('03','回应','让真实话语成为新的痕迹')]):
    x=48+i*292
    line(x,409,x+246,409,col('border'),.5)
    label(a,x,426);heading(b,x+30,422);para(d,x+30,453,225,11,col('muted'))
note('设计气质：圆润、克制；迷幻、辽阔、温柔。概念通过内容与行为持续出现。')

# 03 — Navigation identities.
begin('一个世界，四个方向','02 / ARCHITECTURE',source='SPEC / CONCEPT 1.1')
rows=[('Becoming','学习、资料、博客与数字花园','理解正在形成','P03 / P05 / P06'),('Afterimage','项目、作品、照片与社交展示','经历留下可见的痕迹','P08-P11'),('Elsewhere','常用网站与外部资源','私人世界向外保持开放','P12'),('Echoes','音乐展示、歌单与访客推歌','一次选择被另一个人接住','P13')]
for i,(name,func,meaning,p) in enumerate(rows):
    yy=152+i*72
    txt(f'{i+1:02d}',47,yy+4,10,col('muted'),'LATIN')
    txt(name,90,yy,27,font='LATIN')
    txt(func,350,yy+6,13)
    txt(meaning,660,yy+6,11,col('muted'))
    label(p,350,yy+30)
    line(90,yy+56,912,yy+56,col('divider'),.5)
rect(44,458,872,44,col('surface'),r=10)
txt('Someone · 关于我',62,473,12)
txt('Outside the Wall · 留言墙',375,473,12)
txt('全局菜单始终可达',755,473,11,col('muted'))
note('关于与留言是补充入口。英文承载栏目身份，中文说明功能；歌词仍按原文档保留为提案。')

# 04 — Primary wordmark.
begin('手写的身份','03 / WORDMARK',source='CONCEPT 1.3 / SYSTEM 1.2')
logo(100,188,450)
line(650,151,650,479,col('divider'),.5)
label('APPROVED  /  2026.10.08',688,157)
heading('little stone',688,198);heading('still here',688,221)
para('全小写，固定两行。\n长笔画保留向外伸展的势头；\n间距让名字有呼吸。',688,268,205,12,col('muted'),23)
heading('名称分层',688,375)
para('标准站名：\nLittle Stone Still Here\n紧凑简称：LSSH\n个人昵称：小石',688,410,214,11,leading=22)
note('字标是完整图像资产。页面标题与元信息使用标准站名；不设中文站名。')

# 05 — Clear space.
begin('给字标留出空间','04 / CLEAR SPACE',source='SYSTEM 1.3 / PROPOSED BASELINE')
x,y,w=126,216,386;h=w*686/1188;q=h/4
logo(x,y,w)
c.setStrokeColor(HexColor(col('border')));c.setLineWidth(.6);c.setDash([3,4])
c.rect(x-q,H-y-h-q,w+2*q,h+2*q,stroke=1,fill=0)
c.setDash([])
c.setStrokeColor(HexColor(col('muted')))
c.rect(x,H-y-h,w,h,stroke=1,fill=0)
label('VISIBLE INK / W',x+125,y-17)
line(x-q,y-28,x,y-28,col('accent'),1)
label('x',x-q/2-2,y-44)
line(x+w+25,y,x+w+25,y+h,col('accent'),.6)
label('H',x+w+32,y+h/2)
heading('x = H / 4',640,169)
para('H 取可见笔画的整体高度。\n四周至少保留一个 x。\n文字、按钮、线条与画面边缘\n均位于安全区之外。',640,211,253,13,leading=25)
heading('按笔画对齐',640,353)
para('透明 PNG 自带空白。\n布局时看字迹的视觉边界，\n不要直接按文件边框判断居中。',640,392,245,12,col('muted'),23)
note('本轮应用基线：W/H 约 1.732；原图保持不变。度量说明与透明边距换算见 SYSTEM 1.3。')

# 06 — Minimum sizes and restrictions.
begin('在合适的大小里，保留笔势','05 / SCALE & USE',source='SYSTEM 1.3')
for x,w,title in [(56,320,'320 / 主要身份区'),(438,240,'240 / 建议下限')]:
    label(title.split(' / ')[0]+' CSS PX',x,153)
    txt(title.split(' / ')[1],x+95,150,11,col('muted'))
    logo(x,193,w)
rect(739,151,177,222,col('surface'),r=16)
txt('LSSH',764,215,31,font='LATIN')
para('紧凑导航用文本简称\n全称图片不缩成 favicon',761,287,140,10,col('muted'),21)
line(44,416,916,416,col('divider'),.5)
for i,(h1,p1) in enumerate([('保持整体','不拉伸、不旋转、不拆行。'),('保持颜色','白字置于稳定深色背景。'),('保持轮廓','不描边、不加辉光和阴影。'),('保持角色','正文与按钮使用正常字族。')]):
    xx=44+i*224;heading(h1,xx,440);para(p1,xx,472,196,11,col('muted'))
note('尺寸指可见笔画宽度，示例用于比例比较；实际 CSS 像素检查另有截图。浅底黑字版与 favicon 尚未制作。')

# 07 — Palette.
begin('黑色是空间，灰色是层次','06 / COLOR',source='SYSTEM 2')
palette=[('bg','SPACE / 已确认'),('surface','SURFACE / 候选'),('surface-active','ACTIVE / 候选'),('text','TEXT / 基线'),('muted','MUTED / 基线')]
for i,(key,cap) in enumerate(palette):
    xx=44+i*177
    rect(xx,157,164,153,COLORS[key],COLORS['border'],8,.5)
    label(cap,xx,333)
    txt(COLORS[key],xx,357,18,font='LATIN')
    label('--color-'+key,xx,389)
rect(44,430,431,62,LIGHT['bg'],r=8)
txt('WALL   '+LIGHT['bg'],63,450,16,LIGHT['text'],'LATIN')
para('墙面的浅色只在对应空间出现。',269,451,188,10,LIGHT['muted'])
para('光谱是局部光学现象；成功与失败色只说明真实状态。\n常规页面保持黑灰，不给每个栏目另配一套主题色。',504,440,400,11,col('muted'),23)
note('灰值沿用当前施工候选，未宣称为 Codex 官方取样。文字对比度目标 4.5:1；关键边界目标 3:1。')

# 08 — Typography.
begin('署名有个性，阅读有秩序','07 / TYPOGRAPHY',True,'SYSTEM 3')
txt('苹方优先',44,157,52,font='CNB')
txt('Becoming',47,229,28)
para('学习资料、博客与笔记使用同一字体体系。\n标题、正文、目录与工具栏保持一致。',48,288,412,14,col('muted'),27)
for yy,cap,s,sz in [(154,'48 / 标题','沿着问题继续读',29),(229,'24 / 章节','理解仍在生长',21),(293,'18 / 正文','记录已知，也给未知留出位置。',14),(349,'14 / 控件','资料  /  文章  /  笔记',12)]:
    label(cap.split(' / ')[0]+' PX',530,yy)
    txt(s,603,yy-4,sz)
line(44,413,916,413,col('border'),.5)
para('网页字族顺序\nPingFang SC → Microsoft YaHei → Noto Sans CJK SC\n→ Noto Sans SC → system-ui → sans-serif',46,435,570,11,leading=20)
para('正文行高 1.8\n中文每行约 28–40 字\n代码使用等宽字族',685,435,214,11,leading=20)
note('本手册在 Windows 以微软雅黑绘制回退样本；字号标签为网页目标，未验证真实苹方设备。')

# 09 — Spacing and controls.
begin('圆润，发生在细节里','08 / ORDER',source='SYSTEM 4 / 5')
for i,(name,v) in enumerate(RADIUS.items()):
    xx=44+i*150
    rect(xx,155,118,93,col('surface'),col('border'),v,.6)
    txt(str(v),xx+59,180,26,font='LATIN',align='center')
    label(name.upper(),xx+59-27,223)
label('RADIUS / PX',684,167)
para('标签 4 · 媒体 8\n控件 10 · 面板 16',684,194,220,13,leading=26)
heading('间距用少量阶梯组织',44,298)
for i,v in enumerate([4,8,12,16,24,32,48,64,96]):
    xx=46+i*61;rect(xx,354-v*.55,32,v*.55,col('accent'),r=2)
    label(str(v),xx+8,368)
para('组件内部 8–16\n分组 24–32\n章节 48–96',684,302,203,12,col('muted'),25)
button('进入学习',44,433,134,True)
button('键盘焦点',217,433,142,False,True)
para('有效点击区以 44×44 CSS px 为目标。\n焦点用清晰外框；反馈保持布局稳定。',410,438,480,12,col('muted'),24)
note('线条、边缘与倒角按职责分配；三维块体另按尺度验证，不直接套二维像素圆角。')

# 10 — Graphic language.
begin('光线必须有去处','09 / GRAPHIC LANGUAGE',source='CONCEPT 3 / 6')
line(65,281,360,281,col('text'),1)
prism(391,282,1.6)
for endy,name in [(177,'Becoming'),(246,'Afterimage'),(315,'Elsewhere'),(384,'Echoes')]:
    line(420,282,649,endy,col('muted'),.65)
    circle(650,endy,3,fill=col('text'))
    txt(name,674,endy-9,20,font='LATIN')
label('DISCOVER',67,306)
label('CHOOSE',357,345)
label('ENTER',681,426)
line(44,458,916,458,col('divider'),.5)
para('线：指向真实入口。',44,479,250,12)
para('光：响应选择与焦点。',348,479,250,12)
para('棱镜：启用空间靠近。',652,479,260,12)
note('导航关系示意，不是最终场景。光不会替代按钮名称；颜色与辉光不承担唯一状态信息。')

# 11 — Wall and media.
begin('墙有体积，图像有出处','10 / MATERIAL & IMAGERY',True,'SYSTEM 7 / REFERENCES')
wall_reference=DESIGN/'iterations/evidence/u02-p01-2026-10-07-01-user-reference.png'
reference_image=ImageReader(str(wall_reference))
rw,rh=reference_image.getSize()
ref_h=330*rh/rw
c.drawImage(reference_image,44,H-153-ref_h,330,ref_h)
wall(392,153,200,ref_h)
rect(402,259,180,48,LIGHT['bg'],'#BDB9B1',4,.6)
txt('一段真实的回应',492,277,10,LIGHT['text'],align='center')
txt('用户选定的展览参考',44,417,11,LIGHT['muted'])
txt('块体与内容关系示意',392,417,11,LIGHT['muted'])
label('MATTE / QUIET / TANGIBLE',44,455,LIGHT['muted'])
heading('墙的识别来自块体',635,157)
para('平整哑光，规整错缝。\n近看厚度与细缝，远看安静轮廓。\n不靠污渍、破损和颗粒制造风格。',635,200,273,12,col('muted'),24)
heading('作品的识别来自真实',635,307)
para('优先用户照片、项目截图和作品。\n保留原色与内容比例；裁切先看主体。\n氛围图必须说明来源与用途。',635,350,273,12,col('muted'),24)
note('左图仅参考平整哑光墙体，不采用图中装置；右图为二维图解，文字为示例。三维材质仍待验证。')

# 12 — Motion.
begin('动作表达距离，也允许停下','11 / MOTION & SOUND',source='SYSTEM 6 / CONCEPT 5')
for i,(key,zh) in enumerate([('feedback','反馈'),('local','局部展开'),('page','跨页接续'),('space','按钮空间接续')]):
    xx=44+i*224;v=MOTION[key]
    txt(str(v),xx,153,40,font='LATIN')
    label('MS',xx+86,181)
    txt(zh,xx,213,12,col('muted'))
    line(xx,252,xx+190*(v/700),252,col('text'),2)
for i,p in enumerate([0,.25,.5,.75,1]):
    xx=44+i*178
    gray=round(p*65)
    rect(xx,302,160,102,'#'+('%02x'%gray)*3,r=8)
    size=18+45*p
    rect(xx+80-size/2,353-size/2,size,size,'#'+('%02x'%round(55+p*150))*3,r=3)
    label(f'p = {p:g}',xx,418)
para('滚轮改变目标进度 p；停下、反向与取消都有效。\n减少动画时直接到达，阅读和输入时背景静止。',44,462,551,12,leading=23)
para('声音默认关闭。\n访客主动播放后才开始发声。',652,462,264,12,col('muted'),23)
note('时长为现有初值；700ms 仅用于按钮动作，不规定滚轮总时长。方块序列为进度图解。')

# 13 — Voice.
begin('温和、具体，说明真实结果','12 / VOICE',True,'CONCEPT 1.4 / SYSTEM 5')
voice=[('身份','“我把正在学习、做过的东西和喜欢的歌留在这里。”','第一人称，表达个人经历；示例语气。'),('空结果','“暂时没有匹配内容。试试清空筛选。”','描述状态，并给出可执行的下一步。'),('播放受限','“播放暂不可用，可前往网易云查看。”','只说明当前能力，保持原站入口。'),('推荐已收到','“已收到推荐，审核后再同步。”','仅在真实提交成功后出现，不冒充同步完成。')]
for i,(cap,a,b) in enumerate(voice):
    yy=152+i*83
    txt(cap,45,yy+2,12,col('muted'))
    txt(a,175,yy,17)
    txt(b,183,yy+34,11,col('muted'))
    line(175,yy+66,916,yy+66,col('border'),.5)
note('栏目可以诗意；按钮使用“查看、播放、下载、返回”等直接动作。AI 与其他服务状态必须真实。')

# 14 — Home application.
begin('首页：先感到有人，再选择靠近','13 / APPLICATION',source='P01 / COMPOSITION STUDY')
rect(44,143,872,359,col('bg'),col('border'),12,.6)
wall(511,166,383,311,True)
logo(90,192,302)
txt('小石的学习、作品与声音。',91,423,11,col('muted'))
prism(558,324,1.1)
for endy,name,cn in [(205,'Becoming','学习'),(266,'Afterimage','展示'),(327,'Elsewhere','网站'),(388,'Echoes','电台')]:
    line(588,324,701,endy+12,col('border'),.6)
    txt(name,722,endy,18,font='LATIN')
    txt(cn,848,endy+4,10,col('muted'))
label('MENU',848,166)
txt('选择棱镜，走近留言墙',484,437,11)
txt('声音：关闭',794,465,10,col('muted'))
note('布局示意 · 非开发完成页。主页只保留一个主要空间焦点；四组功能始终具备文字入口。')

# 15 — Content applications.
begin('进入内容后，让表达安静下来','14 / APPLICATION',source='P03 / P13 / COMPOSITION STUDY')
rect(44,149,537,349,col('bg'),col('border'),12,.5)
txt('LSSH',66,169,15,font='LATIN')
txt('学习    展示    网站    电台',297,170,10,col('muted'))
line(66,201,559,201,col('divider'),.5)
txt('Becoming',76,225,30,font='LATIN')
txt('学习 · 资料、文章与笔记',77,269,11,col('muted'))
rect(77,307,234,30,col('surface'),r=10)
txt('全部     资料     文章     笔记',91,315,11)
for yy,title,meta in [(365,'沿着问题整理一次学习','笔记 · 示例内容'),(423,'从实现回到原理','文章 · 示例内容')]:
    txt(title,77,yy,15)
    txt(meta,77,yy+24,10,col('muted'))
    line(77,yy+48,548,yy+48,col('divider'),.5)
rect(613,149,303,349,col('surface'),r=16)
label('RADIO / ECHOES',639,174)
txt('Echoes',638,223,38,font='LATIN')
para('留下一首歌，\n也留下一点分享它的理由。',639,284,251,14,leading=27)
line(639,366,890,366,col('border'),.5)
txt('播放器与歌单尚待配置',639,387,11,col('muted'))
txt('推荐一首歌  →',639,439,13)
note('布局与语气示意 · 非真实内容或已接通服务。紧凑导航用 LSSH；正文、封面与歌曲成为主要信息。')

# 16 — Handoff.
begin('交付之后，保持同一个声音','15 / HANDOFF',True,'BRAND_MANUAL / PLAN')
heading('已经确定',44,154)
para('Little Stone Still Here / LSSH\n两行小写手写字标外观\n纯黑底色、灰色方向\n圆润克制、苹方优先\n黑色空间与白色留痕墙',44,196,310,13,leading=27)
heading('本轮可用',374,154)
para('黑底预览与白字透明 PNG\nLogo 安全区与尺寸基线\n16 页品牌手册\n可重新生成的编辑源\n现有设计文档的统一入口',374,196,280,13,leading=27)
heading('后续需落实',693,154)
para('矢量母版与 favicon\n实际网页使用尺寸\n真实苹方设备检查\n灰值与三维材质样本\n正式页面和服务接入',693,196,225,13,leading=27)
line(44,386,916,386,col('border'),.5)
txt('每轮只验证一个主要变量。',44,412,25,font='CNB')
para('选素材 → 静态构图 → 单控件 → 单段动作 → 页面组合 → 真实旅程\n规范源：CONCEPT · SYSTEM · SPEC · REFERENCES。版本与证据：PLAN。',46,457,868,12,col('muted'),24)
note('手册是 2026-10-08 的设计快照。新增使用基线与应用示意不等于用户已确认所有细节或工程已经完成。')

c.save()
assert page==16
(BASE/'manual-text-audit.json').write_text(json.dumps({'pages':page,'text':audit},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pdf':str(OUTPUT),'pages':page,'bytes':OUTPUT.stat().st_size},ensure_ascii=False))
