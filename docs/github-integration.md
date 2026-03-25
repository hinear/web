# GitHub Integration Plan

## Overview

Hinear와 GitHub를 연동하여 이슈 관리와 개발 워크플로우를 통합합니다.

## Current Status

2026-03-26 기준 현재 구현/적용 상태는 아래와 같다.

- 프로젝트 설정 화면에서 GitHub OAuth로 리포지토리를 선택하고 연결할 수 있다.
- GitHub OAuth 완료 후 설정 화면으로 돌아오면 저장소 선택 UI가 자동으로 열린다.
- 연결 정보는 `projects.github_repo_owner`, `projects.github_repo_name`, `projects.github_integration_enabled` 에 저장된다.
- Hinear 이슈 생성 시 연결된 프로젝트라면 GitHub Issue 생성 시도를 한다.
- 이미 GitHub Issue가 연결된 이슈는 Hinear 수정 시 GitHub update도 백그라운드 시도한다.
- 이슈 동기화 결과는 `issues.github_issue_id`, `issues.github_issue_number`, `issues.github_synced_at`, `issues.github_sync_status` 에 기록된다.
- 서버 동기화 토큰은 GitHub App installation token을 런타임 발급해서 사용한다.
- 서버 환경변수는 `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`를 사용한다.
- GitHub webhook 수신 엔드포인트는 아직 구현되지 않았다.

현재 문서는 아래 두 레이어를 함께 담는다.

- 이미 구현된 범위: 리포지토리 연결, 프로젝트/이슈 GitHub 메타데이터 저장, Hinear → GitHub one-way issue sync 기반
- 아직 계획 단계인 범위: webhook 기반 역방향 sync, commit/PR integration, GitHub App 기반 시크릿 관리

## Core Features

### 1. Issue ↔ GitHub Issue Synchronization

**Bidirectional Sync:**
- Hinear 이슈 생성 시 GitHub Issue 자동 생성
- GitHub Issue 생성/수정 시 Hinear에 반영 (webhook)
- 상태 매핑:
  - `Triage`/`Backlog`/`Todo`/`In Progress` → `open`
  - `Done` → `closed`
  - `Canceled` → `closed`
- 라벨 동기화 (Hinear Labels ↔ GitHub Labels)
- 담당자 매핑 (Hinear assignee → GitHub assignee)

**Linking:**
- Hinear 이슈에 GitHub Issue URL 표시
- GitHub Issue에 Hinear 이슈 URL을 본문 또는 comment로 추가
- `github_issue_id`, `github_issue_number`, `github_repo` 필드 추가

### 2. Commit/PR Integration

**Commit Message Parsing:**
- 이슈 ID 추출: `WEB-123`, `PROJ-456` 형식
- 예시: `feat: implement login (WEB-123)`
- 예시: `fix: resolve navigation bug [PROJ-456]`
- 커밋을 이슈 활동 로그에 추가

**Branch Name Parsing:**
- 이슈 ID 추출: `feature/WEB-123-login`, `bugfix/PROJ-456`
- 브랜치 생성 시 자동으로 관련 이슈에 표시

**PR Integration:**
- PR 생성 시 관련 이슈에 활동 로그 추가
- PR 본문에서 `Fixes #123`, `Closes #456` 키워드 감지
- PR 머지 시 자동으로 이슈 상태를 `Done`으로 변경 (optional)
- PR 링크를 이슈에 표시

### 3. Webhook Events

현재 상태:
- 이 섹션은 계획 문서다.
- `/api/github/webhooks` 엔드포인트는 아직 코드베이스에 없다.

**Supported Events:**
- `issues`: created, edited, deleted, closed, reopened
- `issue_comment`: created, edited, deleted
- `pull_request`: opened, edited, closed, merged
- `push`: commit 정보 추출

**Webhook Endpoint:**
- `/api/github/webhooks`
- GitHub webhook secret으로 서명 확인

## Architecture

### Database Schema Changes

```sql
-- projects 테이블에 GitHub 정보 추가
ALTER TABLE projects ADD COLUMN github_repo_owner TEXT;
ALTER TABLE projects ADD COLUMN github_repo_name TEXT;
ALTER TABLE projects ADD COLUMN github_integration_enabled BOOLEAN DEFAULT false;

-- issues 테이블에 GitHub 정보 추가
ALTER TABLE issues ADD COLUMN github_issue_id INTEGER;
ALTER TABLE issues ADD COLUMN github_issue_number INTEGER;
ALTER TABLE issues ADD COLUMN github_synced_at TIMESTAMP;
ALTER TABLE issues ADD COLUMN github_sync_status TEXT DEFAULT 'pending'; -- pending, synced, error

-- activity_log 테이블에 GitHub 이벤트 추가
-- 기존 summary 컬럼에 GitHub 관련 메시지 저장
```

참고:
- `github_access_token`, `github_webhook_secret` 같은 비밀값은 평문 DB 컬럼에 저장하지 않는다.
- 현재 구현 기준으로는 서버 환경변수 또는 Supabase Vault 같은 별도 비밀 저장소를 사용한다.
- 현재 one-way sync 구현은 GitHub App installation token을 사용한다.

### API Routes

```
GET  /api/github/repositories              # 구현됨: OAuth 후 리포지토리 목록 조회
GET  /api/projects/[projectId]/github      # 구현됨: 프로젝트 GitHub 연결 상태 조회
POST /api/projects/[projectId]/github      # 구현됨: 프로젝트 리포지토리 연결
DELETE /api/projects/[projectId]/github    # 구현됨: 프로젝트 리포지토리 연결 해제
POST /api/github/webhooks                  # 계획: webhook 수신
POST /api/github/sync                      # 계획: 수동 동기화
POST /api/github/install                   # 계획: GitHub App 설치
```

### Background Jobs

- Issue synchronization queue (Vercel Cron 또는 similar)
- Webhook event processing
- GitHub API rate limit handling

## Implementation Phases

### Phase 1: GitHub OAuth & Repository Connection (MVP)

**Goal:** 사용자가 GitHub 리포지토리를 연결할 수 있게 함

**Tasks:**
1. GitHub OAuth 앱 등록
2. OAuth flow 구현 (`/api/auth/github`)
3. 리포지토리 연결 UI (프로젝트 설정 페이지)
4. `projects` 테이블에 GitHub 정보 저장
5. GitHub API 클라이언트 구현 (octokit 또는 fetch)

**Deliverables:**
- GitHub 로그인 기능
- 프로젝트 설정에서 리포지토리 연결
- 연결된 리포지토리 정보 표시

구현 메모:
- OAuth 시작은 Supabase social login (`provider: "github"`) 기반이다.
- 연결 시 사용자 OAuth 토큰으로 repo 접근 가능 여부를 확인한 뒤, GitHub App 설치 토큰으로 같은 repo 접근 가능 여부를 추가 검증한다.

### Phase 2: Hinear → GitHub Issue Sync (One-way)

**Goal:** Hinear 이슈를 생성하면 GitHub Issue도 생성

**Tasks:**
1. `issues` 테이블 스키마 업데이트
2. 이슈 생성 시 GitHub API 호출 로직
3. 라벨 동기화 (Hinear Labels → GitHub Labels)
4. 담당자 매핑 (GitHub username 매핑 테이블)
5. 에러 핸들링 및 재시도 로직
6. GitHub Issue URL을 Hinear에 표시

**Deliverables:**
- 이슈 생성 시 GitHub Issue 자동 생성
- Hinear에서 GitHub Issue로 링크
- 동기화 상태 표시 (synced, error)

구현 메모:
- 현재는 create path에서 background sync를 시도한다.
- issue update path에서도 GitHub update 메서드가 백그라운드로 호출된다.
- label-only update는 별도 action 경로라서 GitHub label update와 완전히 동기화되는지는 추가 확인이 필요하다.

### Phase 3: GitHub → Hinear Issue Sync (Webhook)

**Goal:** GitHub Issue를 생성/수정하면 Hinear에도 반영

**Tasks:**
1. Webhook endpoint 구현 (`/api/github/webhooks`)
2. Webhook secret 검증
3. GitHub 이벤트 파싱
4. 이슈 생성/수정 로직
5. 라벨/담당자 역방향 매핑
6. 중복 이벤트 처리 (idempotency)

**Deliverables:**
- GitHub Issue 생성 시 Hinear 이슈 자동 생성
- GitHub Issue 수정 시 Hinear 이슈 업데이트
- GitHub Issue 닫기/다시 열기 시 상태 동기화

### Phase 4: Commit & PR Integration

**Goal:** 커밋과 PR을 이슈에 연동

**Tasks:**
1. 커밋 메시지 파서 구현
2. 브랜치 이름 파서 구현
3. GitHub API로 commit/PR 정보 조회
4. 이슈 활동 로그에 commit/PR 추가
5. PR 본문에서 `Fixes #` 키워드 파싱
6. PR 머지 시 이슈 상태 자동 변경

**Deliverables:**
- 커밋 메시지에서 이슈 ID 추출
- 브랜치 이름에서 이슈 ID 추출
- PR 생성/머지 시 이슈에 활동 로그 추가
- PR에서 이슈 자동 완료 옵션

### Phase 5: Advanced Features (Future)

- GitHub Actions 연동
- Release Notes 자동 생성
- Code Review 요청 통합
- GitHub Project Board 연동
- Deployment status 표시

## Technical Considerations

### Security

1. **GitHub Token Storage:**
   - Supabase Vault 또는 환경변수에 저장
   - PAT (Personal Access Token) 또는 GitHub App Token 사용
   - 현재 구현은 GitHub App (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`) 기반
   - 프로젝트별 평문 토큰 저장은 사용하지 않음

2. **Webhook Security:**
   - HMAC signature 검증
   - Rate limiting
   - IP whitelist (GitHub IPs)

3. **Rate Limiting:**
   - GitHub API: 5,000 requests/hour (authenticated)
   - Exponential backoff for retries
   - Request queue for bulk operations

### Error Handling

1. **Sync Failures:**
   - `github_sync_status` 필드로 추적
   - 재시도 큐 (background job)
   - 사용자에게 에러 표시

2. **Conflicts:**
   - 양쪽에서 동시에 수정된 경우
   - Last-write-wins 또는 manual resolution
   - Conflict notification

### Data Mapping

**Status Mapping:**
```
Hinear              → GitHub
----------------------------------------
Triage              → open
Backlog             → open
Todo                → open
In Progress         → open
Done                → closed
Canceled            → closed

GitHub              → Hinear
----------------------------------------
open                → Triage (default for new)
closed              → Done
```

**Label Mapping:**
- Color similarity matching (optional)
- Manual mapping table (user config)
- Auto-create missing labels

**Assignee Mapping:**
- GitHub username → Hinear member ID
- Mapping table: `github_username` column in `project_members`

## User Interface Changes

### Project Settings Page

```
GitHub Integration
├─ Connected Repository: owner/repo
├─ Connection Status: ✅ Connected
├─ OAuth 후 repository selector
├─ Connect Repository button
└─ [Disconnect] button
```

### Issue Detail Page

```
Issue Header
├─ GitHub Issue: #123 → [Link to GitHub]
├─ Sync Status: ✅ Synced 2 hours ago
└─ [Resync] button

Activity Log
├─ 🎉 Opened by @user
├─ 💬 Comment by @user
├─ 🔄 PR #45 opened by @developer
├─ ✅ PR #45 merged
└─ 📝 Commit abc123 pushed by @developer
```

## Dependencies

### Required Packages

```json
{
  "octokit": "^4.0.0",           // GitHub API client
  "crypto": "node:crypto"        // Webhook signature verification
}
```

### GitHub App Configuration

1. Create GitHub App (https://github.com/settings/apps)
2. Set permissions:
   - Issues: Read & Write
   - Pull requests: Read & Write
   - Contents: Read (for commit info)
   - Metadata: Read-only
3. Generate Webhook Secret
4. Install App to user/organization account

## Testing Strategy

### Unit Tests

- Commit message parser
- Branch name parser
- Status mapping logic
- Label mapping logic
- Webhook signature verification

### Integration Tests

- GitHub API client (msw mocking)
- Webhook endpoint
- Issue sync flow
- PR integration flow

### E2E Tests

- OAuth flow
- Repository connection
- Issue creation → GitHub sync
- GitHub Issue creation → Hinear sync
- PR creation → Issue activity log

## Migration Plan

### Database Migration

```sql
-- Phase 1
ALTER TABLE projects ADD COLUMN github_repo_owner TEXT;
ALTER TABLE projects ADD COLUMN github_repo_name TEXT;
ALTER TABLE projects ADD COLUMN github_integration_enabled BOOLEAN DEFAULT false;

-- Phase 2
ALTER TABLE issues ADD COLUMN github_issue_id INTEGER;
ALTER TABLE issues ADD COLUMN github_issue_number INTEGER;
ALTER TABLE issues ADD COLUMN github_synced_at TIMESTAMP;
ALTER TABLE issues ADD COLUMN github_sync_status TEXT DEFAULT 'pending';

-- Phase 3
ALTER TABLE project_members ADD COLUMN github_username TEXT;
```

### Data Migration

- 기존 이슈들에 대해 GitHub Issue 생성 (optional)
- 기존 라벨들을 GitHub에 동기화 (optional)
- GitHub username 매핑 초기화

## Rollback Plan

If issues occur:
1. Disable `github_integration_enabled` flag
2. Stop webhook processing
3. Keep `github_*` columns for manual cleanup
4. Provide data export functionality

## Success Metrics

- Integration adoption rate (projects with GitHub connected)
- Sync success rate (>95%)
- Webhook processing latency (<5s)
- User satisfaction (feedback)

## Timeline Estimate

- Phase 1: 1-2 weeks (OAuth + Repo connection)
- Phase 2: 2-3 weeks (Hinear → GitHub sync)
- Phase 3: 2-3 weeks (GitHub → Hinear webhook)
- Phase 4: 2-3 weeks (Commit/PR integration)
- **Total: 7-11 weeks**

## Next Steps

1. `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` 운영 환경 설정
2. issue update path에서 GitHub update 실제 연결 여부 점검
3. webhook 수신 방식을 Supabase Vault 또는 GitHub App 방식으로 설계
4. 이후 역방향 sync와 PR/commit integration 진행
