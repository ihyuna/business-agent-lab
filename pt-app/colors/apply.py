# 2026-11-26 이현아: 키컬러를 진청록(colors/jincheongnok.html 그 색)으로 확정 (D118).
# make.py가 비교용 사본에 쓴 것과 똑같은 색 바꾸기를 소스(src/, build.sh, web/, brand/)에 그대로 적용한다. 한 번만 돌린다.
import re,os,glob,colorsys
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__));P=os.path.join(D,'..')
def rgb(h):return [int(h[i:i+2],16) for i in (0,2,4)]
def hx(c):return ''.join('%02x'%round(max(0,min(255,v))) for v in c)
def mix(a,b,t):return [x+(y-x)*t for x,y in zip(a,b)]
W,B=[255]*3,[0]*3
K=rgb('0b7a80');L=mix(K,W,.35)
M={'1f66f2':K,'2f7cf6':K,'007aff':K,'173a8a':mix(K,B,.35),'1f3d7a':mix(K,B,.3),
   'edf3fe':mix(K,W,.9),'eaf2ff':mix(K,W,.9),'e8f0fe':mix(K,W,.88),'f7faff':mix(K,W,.96),'c9d6ee':mix(K,W,.75),'c9d4e4':mix(mix(K,W,.78),[200]*3,.4),'9db0cf':mix(mix(K,W,.5),[160]*3,.4),
   '5b9bff':L,'7fb0ff':mix(K,W,.55),'0a84ff':L,'1a2a45':mix(K,[24]*3,.75),'1b2b47':mix(K,[24]*3,.75),'4e78b8':mix(K,[60]*3,.3),'081324':mix(K,B,.85)}
M={a:hx(c) for a,c in M.items()}
R={'31,102,242':K,'0,122,255':K,'10,132,255':L}
kh,kl,ks=colorsys.rgb_to_hls(*[v/255 for v in K])
def rot(m):
  h=m.group(2);r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)];H,Lh,Sh=colorsys.rgb_to_hls(r,g,b)
  if not(.56<H<.64 and Sh>.5):return m.group(0)
  return m.group(1)+hx([v*255 for v in colorsys.hls_to_rgb(kh,Lh,min(Sh,ks))])
def text(s):
  s=re.sub(r'(#|%23)('+'|'.join(M)+r')\b',lambda m:m.group(1)+M[m.group(2).lower()],s,flags=re.I)
  s=re.sub(r'rgba\(('+'|'.join(re.escape(x) for x in R)+r'),',lambda m:'rgba(%d,%d,%d,'%tuple(round(v) for v in R[m.group(1)]),s)
  return re.sub(r'(#|%23)([0-9a-fA-F]{6})\b',rot,s)
fs=glob.glob(P+'/src/*')+[P+'/build.sh',P+'/web/icon.svg',P+'/web/manifest.webmanifest']+glob.glob(P+'/brand/*.svg')
for f in fs:
  s=open(f,encoding='utf8').read();t=text(s)
  if t!=s:open(f,'w',encoding='utf8').write(t);print('text',os.path.relpath(f,P))
# 아이콘 PNG: 파랑 픽셀만 진청록으로 (흰색·검정은 그대로)
def png(f):
  im=Image.open(f).convert('RGBA');px=im.load();n=0
  for y in range(im.height):
    for x in range(im.width):
      r,g,b,a=px[x,y]
      if a and b>150 and b-r>80:
        t=(b-0)/242  # 파랑 농도 비율(안티에일리어싱 가장자리용)
        w=min(1,max(0,(255-b)/(255-242))) if b>242 else 1
        c=mix([255]*3,K,min(1,(255-r)/(255-31))) ;px[x,y]=tuple(round(v) for v in c)+(a,);n+=1
  if n:im.save(f);print('png',os.path.relpath(f,P),n)
for f in glob.glob(P+'/web/*.png')+glob.glob(P+'/brand/*.png'):png(f)
