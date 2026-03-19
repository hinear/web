# PWA, Firebase, Notifications

## 목표

앱을 설치 가능한 PWA로 제공하고, `Supabase` 기반 데이터 저장 위에 `Firebase Cloud Messaging`을 이용한 웹 푸시 알림과 리마인더 알람을 지원한다.

## 아키텍처

- 프론트엔드: `Next.js`
- 설치/앱 셸: `PWA manifest + service worker`
- 인증: `Supabase Auth`
- 데이터: `Supabase Postgres`
- 서버 작업: `Supabase Edge Functions`
- 예약 작업: `Supabase Cron`
- 푸시: `Firebase Cloud Messaging`

상위 도메인 경계는 `project`이며, 모든 알림은 특정 프로젝트와 그 프로젝트에 속한 이슈를 기준으로 동작한다.

## 왜 이 조합인가

- `issue detail`의 source of truth를 `Supabase` 하나로 유지할 수 있다
- 프로젝트별 권한 관리와 RLS 구성이 단순하다
- PWA로 설치 경험을 제공할 수 있다
- FCM으로 foreground/background 알림 처리가 가능하다
- Supabase 함수와 cron으로 reminder 알람을 만들 수 있다
- Firebase는 알림 전송 계층으로만 써서 복잡도를 줄일 수 있다

## PWA 요구사항

브라우저가 설치 가능한 앱으로 다루려면 최소한 아래가 필요하다.

- manifest 연결
- HTTPS 또는 localhost 제공
- 적절한 아이콘과 `start_url`, `display` 설정

이 부분은 MDN의 PWA installability 가이드를 기준으로 잡는다.

## 알림 요구사항

- 알림 권한 요청은 반드시 사용자 액션 이후에만 한다
- 모바일 타깃까지 고려하면 service worker 기반 notification 표시를 사용한다
- FCM 웹 SDK는 HTTPS 환경에서 동작한다
- background 메시지 처리는 `firebase-messaging-sw.js`에서 수행한다
- 앱의 사용자 기준과 이슈 데이터 기준은 `Supabase`를 source of truth로 유지한다

## 알림 종류

### 1. 이벤트 알림

이슈 변경에 반응해서 보내는 알림.

예:

- 담당자로 지정됨
- 코멘트 멘션됨
- 상태가 변경됨

### 2. 리마인더 알람

특정 시간에 맞춰 보내는 알림.

예:

- 오늘 처리해야 하는 이슈
- 설정한 reminder 시각 도달
- overdue 이슈 알림

## 데이터 모델 초안

### projects

- `key`
- `name`
- `type`
- `issueSeq`
- `createdBy`
- `createdAt`
- `updatedAt`

### project_members

- `projectId`
- `userId`
- `role`
- `createdAt`

### issues

- `projectId`
- `title`
- `status`
- `priority`
- `assigneeId`
- `labelIds`
- `description`
- `reminderAt`
- `createdAt`
- `updatedAt`

### comments

- `issueId`
- `authorId`
- `body`
- `createdAt`

### activityLogs

- `issueId`
- `type`
- `actorId`
- `field`
- `from`
- `to`
- `summary`
- `createdAt`

상태 변경 알림은 activity log의 `from/to` 값을 사용해 메시지를 구성할 수 있다.

### notification_tokens

- `userId`
- `token`
- `deviceLabel`
- `createdAt`
- `updatedAt`

## 알림 흐름

### 권한 및 토큰 등록

1. 사용자가 알림 허용 버튼을 누른다.
2. 브라우저 permission을 요청한다.
3. 허용되면 FCM registration token을 발급받는다.
4. 토큰을 `notification_tokens`에 저장한다.

### 이벤트 알림

1. 이슈 변경 발생
2. Supabase write 또는 함수 호출
3. Edge Function이 수신자 계산
4. FCM 전송
5. service worker가 background notification 표시

### 리마인더 알람

1. 이슈에 `reminderAt` 저장
2. Supabase Cron이 주기적으로 전송 함수 호출
3. 현재 시각 기준 전송 대상 필터링
4. FCM 전송

## 구현 원칙

- permission prompt는 앱 진입 시 자동으로 띄우지 않는다
- notification click은 해당 이슈 상세 페이지로 연결한다
- foreground와 background 처리 로직을 분리한다
- 알림 전송 실패는 재시도 가능한 서버 로직으로 둔다
- 토큰 폐기와 갱신을 고려한다
- 사용자 인증과 권한 판정은 Supabase 기준으로 수행한다
- FCM 토큰은 사용자별 다중 디바이스를 고려한다
- 알림 대상도 프로젝트 접근 권한이 있는 사용자만 포함한다
- 프로젝트 멤버 역할은 `owner`와 `member`만 고려한다

## 주의할 점

- service worker 파일 경로가 잘못되면 FCM이 동작하지 않는다
- notification click 동작은 service worker 쪽에서 명확히 정의해야 한다
- 웹 알림은 브라우저와 플랫폼 정책 영향을 받으므로 graceful degradation이 필요하다
- 알림은 필수 기능이 아니라 enhancement로 취급한다
- Firebase를 데이터 저장에 쓰지 않도록 경계를 명확히 유지해야 한다
- 프로젝트에서 제거된 사용자는 알림 대상에서도 제외되어야 한다

## MVP 기준

- 앱 설치 가능
- 알림 opt-in 가능
- 이슈 링크가 포함된 웹 푸시 수신 가능
- reminder 시각 기반 알람 전송 가능
- Supabase 데이터와 사용자 기준이 단일 source of truth로 유지됨

## 공식 문서 기준

- Firebase Cloud Messaging 웹 시작 가이드
- Firebase Cloud Messaging 웹 수신 가이드
- Supabase Edge Functions 가이드
- Supabase Cron 가이드
- MDN PWA installability 가이드
- MDN Notifications API 가이드
