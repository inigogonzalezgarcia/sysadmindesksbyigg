# Draws public/assets/og.png (1200x630), the social preview image. Needs Pillow and the DejaVu fonts: python3 scripts/make-og.py
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1200,630
BG=(10,18,16); INK=(215,228,221); DIM=(138,161,151); OK=(94,224,160); ERR=(255,138,122); EV=(255,210,122)
img=Image.new("RGB",(W,H),BG)
# soft green glow
glow=Image.new("RGB",(W,H),BG); g=ImageDraw.Draw(glow)
g.ellipse((640,60,1260,560),fill=(26,70,52)); glow=glow.filter(ImageFilter.GaussianBlur(120))
img=Image.blend(img,glow,0.9)
d=ImageDraw.Draw(img)
F="/usr/share/fonts/truetype/dejavu/"
mono=lambda s:ImageFont.truetype(F+"DejaVuSansMono.ttf",s); monob=lambda s:ImageFont.truetype(F+"DejaVuSansMono-Bold.ttf",s)
sans=lambda s:ImageFont.truetype(F+"DejaVuSans.ttf",s); sansb=lambda s:ImageFont.truetype(F+"DejaVuSans-Bold.ttf",s)
# subtle grid
for x in range(0,W,40): d.line((x,0,x,H),fill=(14,25,22))
for y in range(0,H,40): d.line((0,y,W,y),fill=(14,25,22))
# brand
d.rounded_rectangle((70,80,190,150),radius=14,fill=(14,23,20),outline=(40,70,58),width=2)
d.text((88,86),">_",font=monob(48),fill=OK)
d.text((214,84),"SysAdmin Desks",font=sansb(58),fill=(255,255,255))
d.text((218,156),"by IGG",font=sans(26),fill=DIM)
d.text((72,236),"Simulador gratuito",font=sansb(46),fill=INK)
d.text((72,292),"de soporte IT",font=sansb(46),fill=INK)
d.text((72,366),"Free IT support simulator",font=sans(30),fill=DIM)
# chips
x=72
for c in ["Active Directory","Microsoft 365","Linux"]:
    w=d.textlength(c,font=mono(20))+28
    d.rounded_rectangle((x,430,x+w,470),radius=20,outline=(52,110,84),width=2,fill=(12,28,22))
    d.text((x+14,439),c,font=mono(20),fill=OK); x+=w+12
d.text((72,520),"sysadmindesksbyigg.pages.dev",font=mono(24),fill=DIM)
# terminal window
tx,ty,tw,th=700,190,440,270
d.rounded_rectangle((tx,ty,tx+tw,ty+th),radius=16,fill=(14,23,20),outline=(40,70,58),width=2)
for i,c in enumerate([(255,95,86),(255,189,46),(39,201,63)]): d.ellipse((tx+18+i*22,ty+16,tx+30+i*22,ty+28),fill=c)
lines=[(INK,"PS C:\\> nslookup intranet"),(ERR,"*** Non-existent domain"),(INK,"PS C:\\> Get-ADUser mgarcia"),(EV,"LockedOut : True"),(OK,"PS C:\\> _")]
for i,(c,t) in enumerate(lines): d.text((tx+22,ty+52+i*44),t,font=mono(21),fill=c)
# ticket card
cx,cy,cw,ch=730,440,380,120
shadow=Image.new("RGBA",(W,H),(0,0,0,0)); sd=ImageDraw.Draw(shadow); sd.rounded_rectangle((cx+6,cy+12,cx+cw+6,cy+ch+12),radius=16,fill=(0,0,0,150))
shadow=shadow.filter(ImageFilter.GaussianBlur(12)); img.paste(shadow,(0,0),shadow); d=ImageDraw.Draw(img)
d.rounded_rectangle((cx,cy,cx+cw,cy+ch),radius=16,fill=(244,246,245))
d.rounded_rectangle((cx+18,cy+20,cx+62,cy+64),radius=10,fill=(230,242,236)); d.text((cx+28,cy+24),"▤",font=sans(28),fill=(15,107,79))
d.text((cx+78,cy+18),"NUEVO TICKET · INC-20418",font=monob(14),fill=(93,107,100))
d.text((cx+78,cy+40),"La cuenta que se bloquea",font=sansb(19),fill=(24,33,29))
d.rounded_rectangle((cx+78,cy+80,cx+112,cy+102),radius=6,fill=(161,92,0)); d.text((cx+84,cy+81),"P2",font=sansb(16),fill=(255,255,255))
d.rounded_rectangle((cx+124,cy+87,cx+250,cy+95),radius=4,fill=(221,227,224)); d.rounded_rectangle((cx+260,cy+87,cx+305,cy+95),radius=4,fill=(221,227,224))
import os
img.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "og.png"), optimize=True)
print(img.size)
