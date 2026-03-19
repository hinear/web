# Notifications Feature Spec

## 목적

사용자가 issue detail과 관련된 중요한 업데이트와 reminder를 웹 알림으로 받을 수 있게 한다.

## 범위

- PWA 환경에서 동작하는 웹 푸시
- Firebase Cloud Messaging 사용
- 데이터와 사용자 기준은 Supabase 사용

## 요구사항

- 알림 권한 요청은 사용자 액션 이후에만 한다.
- 허용 시 FCM registration token을 발급받아 저장한다.
- background notification은 service worker를 통해 표시한다.
- 알림 클릭 시 관련 issue detail 페이지로 이동한다.
- reminder 시각이 되면 푸시 알림을 보낼 수 있다.

## 비범위

- 네이티브 앱 수준의 알림 채널 제어
- 운영체제별 세밀한 notification customization

## 이벤트 예시

- assignee 지정
- 멘션 포함 코멘트 작성
- 상태 변경
- reminder 시각 도달

## 테스트 포인트

- 사용자 액션 없이 permission을 요청하지 않는다
- token 발급 후 저장 로직이 호출된다
- background notification 클릭 시 issue detail로 이동한다
- reminder 전송 함수가 대상 이슈를 조회한다
