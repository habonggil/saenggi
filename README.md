# 생기출판사 — 한정판 예약 시스템

『나는 끝내 나를 살아냈다』 한정판 예약 웹앱

**스택**: React 18 + Vite + Tailwind CSS + Supabase + 토스페이먼츠 + 솔라피 SMS + Resend 이메일 + Vercel

---

## 전체 세팅 순서

### 1단계 — Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 → 새 프로젝트 생성
2. 프로젝트 생성 완료 후 **SQL Editor** 탭 클릭
3. 이 프로젝트의 `supabase_setup.sql` 전체 내용 복사 → SQL Editor에 붙여넣기 → **Run**
4. 완료되면 테이블 3개(orders, cities, notifications)와 도시 10개 기본 데이터가 생성됨

### 2단계 — API 키 발급

| 서비스 | 발급 위치 | 용도 |
|--------|----------|------|
| Supabase | 프로젝트 Settings → API | DB 연결 |
| 토스페이먼츠 | [developers.tosspayments.com](https://developers.tosspayments.com) | 결제 |
| 솔라피 | [solapi.com](https://solapi.com) | SMS 발송 |
| Resend | [resend.com](https://resend.com) | 이메일 발송 |

### 3단계 — .env 파일 설정

프로젝트 루트에 `.env` 파일 생성 (`.env.example` 참고):

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...    # Edge Function 전용 (절대 공개 금지)

# 토스페이먼츠
VITE_TOSS_CLIENT_KEY=test_ck_...         # 테스트: test_ck_ / 라이브: live_ck_
TOSS_SECRET_KEY=test_sk_...              # 테스트: test_sk_ / 라이브: live_sk_

# 솔라피 SMS
SOLAPI_API_KEY=NCS...
SOLAPI_API_SECRET=...
SOLAPI_SENDER_NUMBER=01012345678         # 솔라피에 등록된 발신번호

# Resend 이메일
RESEND_API_KEY=re_...
FROM_EMAIL=saenggi@saenggi.kr            # Resend에서 인증한 도메인 이메일

# 관리자 (VITE_ 없이 — 브라우저 노출 방지)
ADMIN_PASSWORD=saenggi2025!
```

### 4단계 — 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 5단계 — Edge Function 배포 (Supabase CLI)

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# Edge Function 배포
supabase functions deploy confirm-payment --project-ref 프로젝트ID
supabase functions deploy send-reading --project-ref 프로젝트ID
supabase functions deploy send-shipping --project-ref 프로젝트ID
supabase functions deploy check-city --project-ref 프로젝트ID

# Edge Function 환경변수 등록 (Supabase 대시보드 → Edge Functions → Secrets에서도 가능)
supabase secrets set TOSS_SECRET_KEY=live_sk_...
supabase secrets set SOLAPI_API_KEY=NCS...
supabase secrets set SOLAPI_API_SECRET=...
supabase secrets set SOLAPI_SENDER_NUMBER=01012345678
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set FROM_EMAIL=saenggi@saenggi.kr
```

> 프로젝트ID는 Supabase 대시보드 URL에서 확인: `https://supabase.com/dashboard/project/[프로젝트ID]`

### 6단계 — Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 로그인
2. GitHub에 이 프로젝트 push
3. Vercel에서 **Add New Project** → GitHub 저장소 선택
4. **Environment Variables** 탭에서 `.env` 내용 동일하게 입력 (`VITE_` 접두사 붙은 것만)
5. **Deploy** 클릭 → 자동 빌드 완료

도메인 연결: Vercel 프로젝트 Settings → Domains → `saenggi.kr` 추가

---

## 페이지 구조

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 메인 랜딩 | `/` | 책 소개, 예약 현황, 도시별 바 차트 |
| 예약 신청 | `/apply` | 5단계 폼 (정보→주소→사주→도시→확인) |
| 결제 | `/payment` | 토스페이먼츠 위젯 |
| 결제 완료 | `/success` | 예약 확인, SNS 인증 유도 |
| 결제 실패 | `/fail` | 실패 사유, 재시도 |
| SNS 인증 | `/verify` | 사진 업로드 |
| 관리자 로그인 | `/admin/login` | 비밀번호 입력 |
| 관리자 대시보드 | `/admin` | 요약 카드, 도시 현황 |
| 주문 관리 | `/admin/orders` | 목록, 필터, CSV 다운로드 |
| 리딩 관리 | `/admin/reading` | 완료 처리 + 이메일 발송 |
| 배송 관리 | `/admin/shipping` | 운송장 입력 + SMS 발송 |
| 도시 관리 | `/admin/cities` | 콘서트 확정 + 전체 SMS |

---

## 테스트 결제 카드

| 카드 | 번호 | 결과 |
|------|------|------|
| 성공 | 4242 4242 4242 4242 | 결제 성공 |
| 실패 | 4000 0000 0000 0002 | 잔액 부족 시뮬레이션 |
| 카카오페이 | — | 테스트 환경 자동 성공 |

---

## Edge Function 목록

| 함수 | 트리거 | 처리 내용 |
|------|--------|----------|
| `confirm-payment` | 결제 완료 후 | 토스 승인 → DB 저장 → SMS 발송 |
| `send-reading` | 관리자 완료 처리 | Resend 이메일 발송 → DB 업데이트 |
| `send-shipping` | 운송장 입력 | SMS 발송 → 배송 상태 업데이트 |
| `check-city` | 도시 확정 시 | 해당 도시 전체 SMS 발송 |
