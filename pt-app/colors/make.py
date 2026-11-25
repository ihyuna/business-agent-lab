# 키컬러 비교용: 파랑 app.html에서 색만 바꾼 사본을 만든다 (python3 pt-app/colors/make.py). main 앱은 파랑 그대로.
import re,os,colorsys
D=os.path.dirname(os.path.abspath(__file__));SRC=open(os.path.join(D,'..','app.html'),encoding='utf8').read()
def rgb(h):return [int(h[i:i+2],16) for i in (0,2,4)]
def hx(c):return ''.join('%02x'%round(max(0,min(255,v))) for v in c)
def mix(a,b,t):return [x+(y-x)*t for x,y in zip(a,b)]
W,B=[255]*3,[0]*3
V=[('8-ocean','8 Ocean','016064'),('7-teal','7 Teal','48aaad'),('11-cerulean','11 Cerulean','0492c2'),('jincheongnok','진청록 (중간)','0b7a80')]
for slug,name,k in V:
  K=rgb(k);L=mix(K,W,.35)  # 다크 모드용 밝은 키컬러
  M={'1f66f2':K,'2f7cf6':K,'007aff':K,'173a8a':mix(K,B,.35),'1f3d7a':mix(K,B,.3),
     'edf3fe':mix(K,W,.9),'eaf2ff':mix(K,W,.9),'e8f0fe':mix(K,W,.88),'f7faff':mix(K,W,.96),'c9d6ee':mix(K,W,.75),'c9d4e4':mix(mix(K,W,.78),[200]*3,.4),'9db0cf':mix(mix(K,W,.5),[160]*3,.4),
     '5b9bff':L,'7fb0ff':mix(K,W,.55),'0a84ff':L,'1a2a45':mix(K,[24]*3,.75),'1b2b47':mix(K,[24]*3,.75),'4e78b8':mix(K,[60]*3,.3),'081324':mix(K,B,.85)}
  M={a:hx(c) for a,c in M.items()}
  R={'31,102,242':K,'0,122,255':K,'10,132,255':L}
  s=re.sub(r'(#|%23)('+'|'.join(M)+r')\b',lambda m:m.group(1)+M[m.group(2).lower()],SRC,flags=re.I)
  s=re.sub(r'rgba\(('+'|'.join(re.escape(x) for x in R)+r'),',lambda m:'rgba(%d,%d,%d,'%tuple(round(v) for v in R[m.group(1)]),s)
  # 위 표에 없는 진한 파랑(버튼 누름, 다크 모드 강조 등)은 밝기는 두고 색상만 키컬러 쪽으로
  kh,kl,ks=colorsys.rgb_to_hls(*[v/255 for v in K])
  def rot(m):
    h=m.group(2);r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)];H,Lh,Sh=colorsys.rgb_to_hls(r,g,b)
    if not(.56<H<.64 and Sh>.5):return m.group(0)
    return m.group(1)+hx([v*255 for v in colorsys.hls_to_rgb(kh,Lh,min(Sh,ks))])
  s=re.sub(r'(#|%23)([0-9a-fA-F]{6})\b',rot,s)
  s=s.replace('<title>','<title>['+name+'] ',1)
  open(os.path.join(D,slug+'.html'),'w',encoding='utf8').write(s);print(slug)
