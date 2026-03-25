# GitHub App Setup Guide

Hinear의 GitHub 연동을 GitHub App 기반으로 설정하는 실무 가이드입니다.

이 문서는 다음 범위를 다룹니다.

- GitHub App 생성
- 권한/설치 설정
- Hinear 서버 환경변수 구성
- 프로젝트별 연결 및 동기화 검증
- 운영 시 체크 포인트

## 1. 사전 조건

- Hinear 서버가 실행 중이어야 한다.
- `/auth/confirm` 경로가 외부에서 접근 가능해야 한다.
- GitHub App을 생성할 GitHub 계정 또는 Organization 권한이 있어야 한다.

## 2. 현재 구현 기준 요약

현재 코드 기준 동작은 다음과 같다.

- 사용자 GitHub OAuth 토큰은 "사용자가 해당 repo를 볼 수 있는지" 확인용
- 실제 issue create/update sync는 GitHub App installation token으로 수행
- 서버에 필요한 env:
  - `GITHUB_APP_ID`
  - `GITHUB_APP_PRIVATE_KEY`

관련 코드:

- [app-auth.ts](/Users/choiho/zerone/hinear/src/lib/github/app-auth.ts)
- [sync-service.ts](/Users/choiho/zerone/hinear/src/lib/github/sync-service.ts)
- [github route](/Users/choiho/zerone/hinear/src/app/api/projects/[projectId]/github/route.ts)

## 3. GitHub App 생성

1. GitHub에서 `Settings -> Developer settings -> GitHub Apps -> New GitHub App`으로 이동한다.
2. App Name을 입력한다. 예: `Hinear`
3. Homepage URL을 입력한다. 예: `https://hinear.vercel.app`
4. Callback URL을 입력한다.
   - `https://hinear.vercel.app/auth/confirm`

## 4. 권한 설정 (최소 권한 기준)

`Repository permissions`:

- `Issues`: `Read and write` (필수)
- `Metadata`: `Read-only` (기본 필수)

선택:

- `Pull requests`: `Read-only` (향후 PR 연동 계획 시)

그 외 권한은 우선 `No access` 권장.

## 5. 웹훅 설정

현재 구현은 one-way sync(Hinear -> GitHub) 중심이므로 웹훅이 필수는 아니다.

- 웹훅 URL/Secret은 지금 단계에서는 비활성 또는 추후 설정 가능
- 양방향 sync를 시작할 때 이벤트 구독을 확장한다
  - `issues`
  - `issue_comment`
  - `pull_request`
  - `push`

## 6. 설치 대상 설정

`Where can this GitHub App be installed?`에서 운영 정책에 맞게 선택한다.

- 보안 우선: `Only on this account`
- 멀티 조직 확장 계획: `Any account`

생성 후 반드시 대상 Organization 또는 계정에서 App을 설치하고, 연동할 repo를 설치 범위에 포함한다.

## 7. 서버 환경변수 설정

`.env.local` 또는 배포 환경 변수에 아래 값을 설정한다.

```env
APP_ORIGIN=https://hinear.vercel.app
GITHUB_APP_ID=1234567
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"
```

`GITHUB_APP_PRIVATE_KEY`는 다음 두 방식 모두 지원한다.

- PEM 원문
- PEM을 base64로 인코딩한 문자열

코드에서 자동으로 normalize한다.

## 8. Hinear에서 연결 절차

1. 프로젝트 설정 페이지로 이동:
   - `/projects/{projectId}/settings`
2. `GitHub Integration` 카드에서 `Connect with GitHub` 클릭
3. GitHub OAuth 승인 완료 후 복귀
   - `?github=select-repo` 쿼리로 복귀하면 저장소 선택 UI가 자동 오픈된다
4. 저장소를 선택하고 `Connect Repository` 클릭
5. 연결 성공 시 카드에 `Connected Repository` 상태가 표시된다

## 9. 검증 체크리스트

### 9.1 연결 검증

- 프로젝트 설정 화면에서 repo가 연결 상태로 표시되는가
- 연결 API가 200을 반환하는가

### 9.2 이슈 생성 sync 검증

- Hinear에서 이슈 생성 시 GitHub issue가 생성되는가
- DB에서 아래 필드가 채워지는가
  - `issues.github_issue_id`
  - `issues.github_issue_number`
  - `issues.github_sync_status = "synced"`
  - `issues.github_synced_at`

### 9.3 이슈 수정 sync 검증

- Hinear에서 제목/본문/상태 수정 시 GitHub issue에 반영되는가
- sync 성공 시 `github_sync_status`가 `synced`로 유지되는가

## 10. 트러블슈팅

### `GitHub App credentials are not configured...`

원인:

- `GITHUB_APP_ID` 또는 `GITHUB_APP_PRIVATE_KEY` 누락

대응:

- 서버 env 재확인 후 재시작

### repository 연결은 되는데 sync 실패

원인:

- App 설치 범위에 해당 repo가 빠져 있음
- `Issues` 권한 부족

대응:

- App 설치 대상 repo 확인
- 권한이 `Issues: Read and write`인지 확인

### Private key 포맷 에러

원인:

- PEM 줄바꿈이 깨졌거나 잘못 인코딩됨

대응:

- PEM 원문을 그대로 넣거나 base64로 인코딩해 저장

## 11. 운영 권장사항

- Production/Stage용 GitHub App을 분리한다.
- Private key rotation 절차를 정기적으로 수행한다.
- 설치 범위는 최소 repo만 허용한다.
- 로그에 토큰/키를 절대 출력하지 않는다.
