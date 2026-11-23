/* 짐노트 웹앱 설정.
   Supabase 프로젝트의 Project URL 과 anon(public) 키를 넣으면, 트레이너마다 클라우드 계정으로 로그인하고
   어느 기기에서든 자기 기록만 봐요. 비워 두면 이 기기 안에서만 계정을 나눠요.
   anon 키는 공개해도 되는 키예요(기록은 supabase.sql 의 행 단위 보안으로 본인만 읽고 써요). service_role 키는 절대 넣지 마세요. */
window.JIMNOTE_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
