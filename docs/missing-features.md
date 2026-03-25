# 누락된 기능 분석

> **분석 일자**: 2026-03-25
> **범위**: Hinear 프로젝트의 모든 도메인 기능
> **목적**: MVP 완료에 필요한 누락된 기능 추적

## 개요

이 문서는 모든 도메인 기능의 누락된 기능을 카탈로그화하여, 문서화된 요구사항과 현재 구현 상태를 비교합니다. 코드베이스 탐색 및 문서 검토를 기반으로 분석되었습니다.

---

## 요약 통계

| 도메인 | 누락 파일 | 누락 메서드 | 누락 액션 | 우선순위 |
|--------|--------------|-----------------|-----------------|----------|
| Comments | 0 files ✅ | 0 methods ✅ | 0 actions ✅ | **MVP 1** |
| ProjectMember | 0 files ✅ | 0 methods ✅ | 0 actions ✅ | **MVP 1** |
| Issues | 0 files | 7 methods | 6 actions | **MVP 1** |
| Projects | 0 files ✅ | 0 methods ✅ | 0 actions ✅ | **MVP 1** |
| Notifications | 0 files | 5 methods | 3 actions | **MVP 2** |

---

## 1. Comment 도메인

**상태**: ✅ **도메인 구조 완성됨 (2026-03-25)**

### 현재 상태
Comment 관련 코드가 독립 도메인으로 구조화되었습니다:
- `src/features/comments/` 도메인 완전히 구현됨
- `SupabaseCommentsRepository` - 모든 메서드 구현됨
- Server Actions - 모든 액션 구현됨
- Components - 모든 UI 컴포넌트 구현됨

### 구현된 도메인 구조

```
src/features/comments/
├── contracts.ts           ✅ Input/output 타입 정의
├── types.ts               ✅ Comment 도메인 모델
├── lib/
│   ├── comment-validation.ts      ✅ 검증 로직
│   ├── comment-sanitization.ts    ✅ 입력 정제
│   └── thread-management.ts       ✅ 스레드/답글 로직
├── repositories/
│   └── SupabaseCommentsRepository.ts  ✅ 데이터 접근 계층
├── actions/
│   ├── create-comment-action.ts    ✅ 댓글 생성
│   ├── update-comment-action.ts    ✅ 댓글 수정
│   ├── delete-comment-action.ts    ✅ 댓글 삭제
│   ├── list-comments-action.ts     ✅ 댓글 목록
│   └── get-comment-thread-action.ts ✅ 스레드 조회
└── components/
    ├── CommentList.tsx             ✅ 목록 뷰
    ├── CommentItem.tsx             ✅ 단일 댓글
    ├── CommentForm.tsx             ✅ 생성/편집 폼
    ├── CommentThread.tsx           ✅ 스레드 뷰
    └── CommentMarkdown.tsx         ✅ 마크다운 렌더러
```

### 구현된 Repository 메서드

```typescript
interface ICommentsRepository {
  // 핵심 CRUD - 모두 구현됨 ✅
  createComment(input: CreateCommentInput): Promise<Comment>
  updateComment(input: UpdateCommentInput): Promise<Comment>
  deleteComment(input: DeleteCommentInput): Promise<void>
  getCommentById(commentId: string): Promise<Comment | null>

  // 쿼리 작업 - 모두 구현됨 ✅
  listCommentsByIssueId(input: ListCommentsInput): Promise<Comment[]>
  getCommentThread(input: GetCommentThreadInput): Promise<CommentThread>
  listReplies(commentId: string): Promise<Comment[]>
  searchComments(input: SearchCommentsInput): Promise<Comment[]>

  // 권한 확인 - 모두 구현됨 ✅
  canEditComment(commentId: string, userId: string): Promise<boolean>
  canDeleteComment(commentId: string, userId: string): Promise<boolean>
}
```

### 구현된 Server Actions

```typescript
// create-comment-action.ts ✅
"use server"
export async function createCommentAction(input: CreateCommentInput)

// update-comment-action.ts ✅
"use server"
export async function updateCommentAction(input: UpdateCommentInput)

// delete-comment-action.ts ✅
"use server"
export async function deleteCommentAction(input: DeleteCommentInput)

// list-comments-action.ts ✅
"use server"
export async function listCommentsAction(input: ListCommentsInput)

// get-comment-thread-action.ts ✅
"use server"
export async function getCommentThreadAction(input: GetCommentThreadInput)
```

### 비즈니스 로직 (lib/)

**구현된 파일:**
- ✅ `comment-validation.ts` - 댓글 내용, 형식, 권한 검증
- ✅ `comment-sanitization.ts` - XSS 방지, HTML 정제, 멘션 추출
- ✅ `thread-management.ts` - 중첩 답글, 스레드 구조 관리

**추가 기능:**
- ✅ `extractMentions()` - @멘션 파싱
- ✅ `isEditedComment()` - 편집 여부 확인
- ✅ `truncateComment()` - 미리보기용 텍스트 자름
- ✅ `buildCommentTree()` - 계층 구조 빌드
- ✅ `getThreadStats()` - 스레드 통계

### 데이터베이스 마이그레이션

**구현됨:**
- ✅ `0011_add_comment_thread_support.sql` - 스레드 지원 컬럼 추가
  - `parent_comment_id` - 중첩 답글 지원
  - `thread_id` - 스레드 그룹화
  - `updated_at` - 편집 추적

---

## 2. ProjectMember 도메인

**상태**: ✅ **도메인 구조 완성됨 (2026-03-25)**

### 현재 상태
프로젝트 멤버십 및 접근 제어를 위한 독립 도메인이 구현되었습니다:
- `src/features/project-members/` 도메인 완전히 구현됨
- `SupabaseProjectMembersRepository` - 모든 메서드 구현됨
- Server Actions - 모든 액션 구현됨
- RBAC (Role-Based Access Control) - 완전히 구현됨
- Components - 모든 UI 컴포넌트 구현됨

### 구현된 도메인 구조

```
src/features/project-members/
├── contracts.ts           ✅ CRUD 작업 인터페이스
├── types.ts               ✅ 멤버 타입, DTO, 권한 매트릭스
├── lib/
│   ├── membership-validation.ts     ✅ 멤버십 검증
│   ├── permission-checker.ts        ✅ 권한 로직
│   ├── role-manager.ts              ✅ 역할 관리
│   └── access-control.ts            ✅ 접근 제어
├── repositories/
│   └── SupabaseProjectMembersRepository.ts  ✅ 데이터 접근
├── actions/
│   ├── add-member-action.ts       ✅ 멤버 추가
│   ├── remove-member-action.ts    ✅ 멤버 제거
│   ├── update-role-action.ts      ✅ 역할 업데이트
│   ├── check-access-action.ts     ✅ 접근 유효성 검사
│   ├── list-members-action.ts     ✅ 멤버 목록
│   └── get-member-role-action.ts  ✅ 역할 조회
└── components/
    ├── MemberList.tsx             ✅ 목록 뷰
    ├── MemberItem.tsx             ✅ 단일 멤버
    ├── AddMemberForm.tsx          ✅ 추가 폼
    ├── RoleSelector.tsx           ✅ 역할 선택
    └── MemberManagement.tsx       ✅ 멤버 관리
```

### 구현된 Repository 메서드

```typescript
interface IProjectMembersRepository {
  // 핵심 CRUD - 모두 구현됨 ✅
  addMember(input: AddMemberInput): Promise<ProjectMember>
  removeMember(input: RemoveMemberInput): Promise<void>
  updateRole(input: UpdateRoleInput): Promise<ProjectMember>
  listMembers(input: ListMembersInput): Promise<ProjectMember[]>

  // 인증에 필수적 - 모두 구현됨 ✅
  isProjectMember(projectId: string, userId: string): Promise<boolean>
  hasProjectPermission(projectId: string, userId: string, permission: string): Promise<boolean>
  getMemberRole(input: GetMemberRoleInput): Promise<MemberRole | null>
  getMemberById(projectId: string, userId: string): Promise<ProjectMember | null>

  // 사용자 대상 - 모두 구현됨 ✅
  listUserProjects(userId: string): Promise<Project[]>
  listUserMemberships(userId: string): Promise<ProjectMember[]>

  // 유효성 검사 헬퍼 - 모두 구현됨 ✅
  isLastOwner(projectId: string): Promise<boolean>
  canUserBeAdded(projectId: string, userId: string): Promise<boolean>
}
```

### 구현된 Server Actions

```typescript
// add-member-action.ts ✅
"use server"
export async function addMemberAction(input: AddMemberInput)

// remove-member-action.ts ✅
"use server"
export async function removeMemberAction(projectId: string, userId: string, removedBy: string)

// update-role-action.ts ✅
"use server"
export async function updateRoleAction(input: UpdateRoleInput)

// check-access-action.ts ✅
"use server"
export async function checkAccessAction(input: CheckAccessInput): Promise<boolean>

// list-members-action.ts ✅
"use server"
export async function listMembersAction(input: ListMembersInput)

// get-member-role-action.ts ✅
"use server"
export async function getMemberRoleAction(input: GetMemberRoleInput): Promise<MemberRole | null>
```

### 비즈니스 로직 (lib/)

**구현된 파일:**
- ✅ `membership-validation.ts` - 추가/업데이트/제거 작업 검증
- ✅ `permission-checker.ts` - 역할별 권한 매트릭스 정의
- ✅ `role-manager.ts` - 역할 전환, 제한 처리, UI 표시 함수
- ✅ `access-control.ts` - 세분화된 접근 제어 로직

**권한 매트릭스:**
```typescript
const PERMISSIONS = {
  owner: ['read', 'write', 'delete', 'manage_members', 'settings'],
  member: ['read', 'write'],
} as const;
```

**주요 기능:**
- ✅ 마지막 소유자 보호 (제거/역할 변경 방지)
- ✅ 소유자 중복 방지 (프로젝트당 1명)
- ✅ 자기 자신 제거 방지
- ✅ RBAC 기반 권한 확인
- ✅ 역할 전환 유효성 검사

---

## 3. Issue 도메인

**상태**: ⚠️ **핵심 존재, 고급 기능 누락**

### 누락된 Repository 메서드

```typescript
interface IIssuesRepository extends IIssuesRepository {
  // 기존: create, update, delete, getById, listByProject

  // 누락됨 - 필터링
  listIssuesByStatus(projectId: string, status: IssueStatus): Promise<Issue[]>
  listIssuesByAssignee(projectId: string, assigneeId: string): Promise<Issue[]>
  listIssuesByPriority(projectId: string, priority: IssuePriority): Promise<Issue[]>
  listIssuesByLabel(projectId: string, labelId: string): Promise<Issue[]>

  // ✅ 구현됨 - 상태 전환 유효성 검사
  // isValidStatusTransition(status, newStatus): boolean

  // 누락됨 - 검색 및 페이지네이션
  searchIssues(projectId: string, query: string): Promise<Issue[]>
  getIssuesByProjectPage(
    projectId: string,
    page: number,
    limit: number
  ): Promise<PaginatedIssues>

  // 누락됨 - 유틸리티
  countIssuesByProject(projectId: string): Promise<number>
  countIssuesByStatus(projectId: string): Promise<Record<IssueStatus, number>>
  getIssueByIdentifier(projectId: string, identifier: string): Promise<Issue | null>
  getIssuesDueBeforeDate(projectId: string, date: string): Promise<Issue[]>
}
```

### 누락된 Server Actions

```typescript
// update-issue-status-action.ts
"use server"
export async function updateIssueStatusAction(
  issueId: string,
  status: IssueStatus,
  version: number
)

// update-issue-priority-action.ts
"use server"
export async function updateIssuePriorityAction(
  issueId: string,
  priority: IssuePriority,
  version: number
)

// update-issue-assignee-action.ts
"use server"
export async function updateIssueAssigneeAction(
  issueId: string,
  assigneeId: string | null,
  version: number
)

// search-issues-action.ts
"use server"
export async function searchIssuesAction(
  projectId: string,
  query: string
)

// batch-update-issues-action.ts
"use server"
export async function batchUpdateIssuesAction(
  updates: BatchIssueUpdate[]
)

// update-issue-due-date-action.ts
"use server"
export async function updateIssueDueDateAction(
  issueId: string,
  dueDate: string | null,
  version: number
)
```

### 비즈니스 로직 (lib/)

**구현된 파일:**
- ✅ `issue-state-machine.ts` - 상태 전환 검증 (Closed 포함)
- ✅ `issue-validation.ts` - 이슈 입력 검증

**상태 머신 (업데이트됨):**
```typescript
const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Triage: ['Backlog', 'Todo', 'Canceled'],
  Backlog: ['Todo', 'In Progress', 'Canceled'],
  Todo: ['In Progress', 'Done', 'Canceled'],
  InProgress: ['Done', 'Todo', 'Canceled'],
  Done: ['Closed'],                    // 완료 후 닫기만 가능
  Closed: ['In Progress'],             // 재오픈 시
  Canceled: [],                        // 취소된 이슈는 상태 변경 불가
};
```

**누락된 파일:**
- `issue-identifier-generator.ts` - 강력한 PROJECTKEY-n 생성
- `issue-filter-builder.ts` - 복잡한 필터 쿼리 빌드
- `issue-pagination.ts` - 페이지네이션 로직

**상태 머신 예시:**
```typescript
const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Triage: ['Backlog', 'Todo', 'Canceled'],
  Backlog: ['Todo', 'In Progress', 'Canceled'],
  Todo: ['In Progress', 'Done', 'Canceled'],
  InProgress: ['Done', 'Todo', 'Canceled'],
  Done: ['Closed'],                    // 완료 후 닫기만 가능
  Closed: ['In Progress'],             // 재오픈 시
  Canceled: [],                        // 취소된 이슈는 상태 변경 불가
};
```

---

## 4. Project 도메인

**상태**: ✅ **핵심 완성, 접근 제어 추가됨 (2026-03-25)**

### 현재 상태
프로젝트 관리를 위한 누락된 기능들이 구현되었습니다:
- 조회 메서드 추가 완료
- 접근 제어 로직 구현 완료
- Server Actions 추가 완료
- 비즈니스 로직 (lib/) 구현 완료

### 구현된 Repository 메서드

```typescript
interface IProjectsRepository extends IProjectsRepository {
  // 기존: create, update, delete, getById, list

  // ✅ 구현됨 - 조회
  getProjectByKey(key: string): Promise<Project | null>
  listUserProjects(userId: string): Promise<Project[]>
  listProjectsByType(type: ProjectType): Promise<Project[]>

  // ✅ 구현됨 - 접근 제어 (필수)
  checkProjectAccess(projectId: string, userId: string): Promise<boolean>
  validateProjectKey(key: string): Promise<boolean>
  projectExists(key: string): Promise<boolean>
}
```

### 구현된 Server Actions

```typescript
// get-projects-by-user-action.ts ✅
"use server"
export async function getProjectsByUserAction(userId: string): Promise<Project[]>

// project-exists-action.ts ✅
"use server"
export async function projectExistsAction(projectKey: string): Promise<boolean>

// check-project-access-action.ts ✅
"use server"
export async function checkProjectAccessAction(projectId: string, userId: string): Promise<boolean>

// transfer-ownership-action.ts ✅
"use server"
export async function transferOwnershipAction(projectId: string, newOwnerId: string, currentOwnerId: string)

// archive-project-action.ts ✅ (미래 구현 예정)
"use server"
export async function archiveProjectAction(projectId: string, userId: string)
```

### 비즈니스 로직 (lib/)

**구현된 파일:**
- ✅ `project-key.ts` - 키 형식 검증 (2-10자, 대문자+숫자), 자동 생성 제안 (기존 파일 확장)
- ✅ `project-name-sanitizer.ts` - 프로젝트 이름 정제
- ✅ `project-access-control.ts` - 접근 유효성 검사 로직
- ✅ `project-query-builder.ts` - 복잡한 필터링 유틸리티

**주요 기능:**
- ✅ 프로젝트 키 유효성 검사 (대문자, 2-10자, 문자로 시작)
- ✅ 키 중복 확인
- ✅ 키 자동 생성 제안
- ✅ 접근 레벨 시스템 (read, write, admin, owner)
- ✅ 작업별 권한 확인
- ✅ 페이지네이션 지원

---

## 5. Notifications 도메인

**상태**: ⚠️ **저장소 존재, 전달 누락**

### 누락된 Repository 메서드

```typescript
interface INotificationsRepository {
  // 누락됨 - 알림 전달
  sendNotification(notification: Notification): Promise<void>
  sendBulkNotifications(notifications: Notification[]): Promise<void>

  // 누락됨 - 사용자 설정
  getUserNotificationPreferences(userId: string): Promise<NotificationPreferences>
  updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences>

  // 누락됨 - 쿼리
  getUnreadNotifications(userId: string): Promise<Notification[]>
  getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>

  // 누락됨 - 푸시 구독
  getPushSubscription(userId: string): Promise<PushSubscription | null>
  savePushSubscription(userId: string, subscription: PushSubscription): Promise<void>
  deletePushSubscription(userId: string): Promise<void>
}
```

### 누락된 Server Actions

```typescript
// update-notification-preferences-action.ts
"use server"
export async function updateNotificationPreferencesAction(
  preferences: Partial<NotificationPreferences>
)

// subscribe-to-notifications-action.ts
"use server"
export async function subscribeToNotificationsAction(
  subscription: PushSubscription
)

// unsubscribe-from-notifications-action.ts
"use server"
export async function unsubscribeFromNotificationsAction()

// send-push-notification-action.ts
"use server"
export async function sendPushNotificationAction(
  userId: string,
  notification: Notification
)
```

### 비즈니스 로직 (lib/)

**누락된 파일:**
- `notification-templates.ts` - 알림 타입별 템플릿 시스템
- `notification-scheduler.ts` - 예약/지연 알림
- `notification-channel-manager.ts` - 다중 채널 전달
- `notification-preference-resolver.ts` - 사용자 설정 해결

**알림 템플릿:**
```typescript
const TEMPLATES = {
  ISSUE_ASSIGNED: {
    title: "{issueIdentifier}에 배정되었습니다",
    body: "{projectName}의 {issueTitle}",
  },
  ISSUE_UPDATED: {
    title: "{issueIdentifier} 업데이트됨",
    body: "{changedBy}님이 {field}을(를) 변경했습니다",
  },
  COMMENT_ADDED: {
    title: "{issueIdentifier}에 새 댓글",
    body: "{author}: {commentPreview}",
  },
} as const;
```

---

## 6. UI 컴포넌트

### 누락된 기능 컴포넌트

#### Issue 관리
```
src/features/issues/components/
├── IssueFilters.tsx           ❌ 고급 필터 패널
├── IssueSearch.tsx            ❌ 검색 인터페이스
├── IssueBulkActions.tsx       ❌ 일괄 작업
├── IssuePagination.tsx        ❌ 페이지네이션 컨트롤
└── IssueStatusBadge.tsx       ❌ 상태 표시
```

#### Project 관리
```
src/features/projects/components/
├── ProjectSettings.tsx        ❌ 설정 폼
├── ProjectKeyInput.tsx        ❌ 검증이 포함된 키 입력
└── ProjectTypeSelector.tsx    ❌ 개인/팀 선택
```

#### Project Members
```
src/features/project-members/components/
├── MemberManagement.tsx       ✅ 멤버 목록/추가/제거
├── MemberList.tsx             ✅ 목록 뷰
├── MemberItem.tsx             ✅ 단일 멤버
├── AddMemberForm.tsx          ✅ 추가 폼
└── RoleSelector.tsx           ✅ 역할 선택
```

#### Comments
```
src/features/comments/components/
├── CommentList.tsx            ✅ 목록 뷰
├── CommentItem.tsx            ✅ 작업이 포함된 단일 댓글
├── CommentForm.tsx            ✅ 생성/편집 폼
├── CommentThread.tsx          ✅ 스레드 뷰
└── CommentMarkdown.tsx        ✅ 마크다운 렌더러
```

---

## 7. API 라우트

### 누락된 엔드포인트

```
/app/api/
├── projects/
│   ├── [userId]/route.ts              ❌ GET 사용자 프로젝트
│   └── [projectId]/
│       └── members/route.ts           ❌ 멤버 관리
├── issues/
│   ├── search/route.ts                ❌ POST 이슈 검색
│   └── [issueId]/
│       └── comments/route.ts          ❌ 댓글 작업
├── notifications/
│   ├── preferences/route.ts           ❌ GET/PUT 설정
│   ├── subscribe/route.ts             ❌ POST 푸시 구독
│   └── unsubscribe/route.ts          ❌ DELETE 구독
└── members/
    └── check-access/route.ts          ❌ POST 접근 유효성 검사
```

---

## 8. 중요한 보안 이슈

### ⚠️ 문서화되었지만 구현되지 않음

`CLAUDE.md`에서:

> **현재 보안 경고**
> Repository 구현체(`SupabaseProjectsRepository`, `SupabaseIssuesRepository`)는 현재 빠른 개발을 위해 `service-role` 클라이언트를 기본으로 사용합니다. 이는 **RLS를 우회**하며 프로덕션 사용 전 세션 인식 서버 클라이언트로 교체해야 합니다. Server Actions는 임시로 `HINEAR_ACTOR_ID` 환경 변수를 액터 폴백으로 사용합니다.

### 필수 변경사항

**모든 Repository:**
```typescript
// 현재 (RLS 우회)
private client = createClient(supabaseUrl, serviceRoleKey)

// 필수 (세션 인식)
private client = await createClient(supabaseUrl, anonKey, {
  auth: { storage: cookies() }
})
```

**Server Actions:**
```typescript
// 현재 (임시 폴백)
const actorId = process.env.HINEAR_ACTOR_ID || userId

// 필수 (세션에서)
const { data: { user } } = await supabase.auth.getUser()
const actorId = user.id
```

---

## 우선순위 매트릭스

### 🔴 MVP 1 - 필수 (차단)

| 기능 | 도메인 | 파일 | 메서드 | 액션 |
|---------|--------|-------|---------|---------|
| Comment 도메인 구조 | comments | 0 ✅ | 0 ✅ | 0 ✅ |
| ProjectMember 도메인 | project-members | 0 ✅ | 0 ✅ | 0 ✅ |
| Issue 검색/필터 | issues | 0 | 7 | 6 |
| Project 접근 제어 | projects | 0 ✅ | 0 ✅ | 0 ✅ |
| Issue Closed 상태 | issues | 0 ✅ | 0 ✅ | 0 ✅ |
| 보안: 세션 인식 repo | All | 4 | - | - |

### 🟡 MVP 2 - 중요

| 기능 | 도메인 | 영향 |
|---------|--------|--------|
| 일괄 Issue 작업 | issues | 일괄 업데이트 |
| 알림 전달 | notifications | 푸시/이메일 |
| RBAC 구현 | project-members | 세분화된 권한 |
| Issue 템플릿 | issues | 빠른 생성 |
| 고급 필터링 | issues | 복잡한 쿼리 |

### 🟢 MVP 3 - 좋은 기능

| 기능 | 도메인 | 영향 |
|---------|--------|--------|
| 리마인더 시스템 | issues | 마감일 알림 |
| 고급 리포팅 | issues | 분석 |
| 통합 API | projects | 외부 도구 |
| 고급 분석 | all | 인사이트 |

---

## 구현 순서

### Phase 1: 기초 (1-2주)
1. ✅ Comment 도메인 구조
2. ✅ ProjectMember 도메인 구조
3. ✅ Project 접근 제어
4. ✅ 세션 인식 repository 리팩토링 (1단계 완료)

### Phase 2: 핵심 기능 (3-4주)
5. ⬜ Issue 검색 및 필터링
6. ✅ Issue Closed 상태
7. ✅ Comment 컴포넌트

### Phase 3: 고급 기능 (5-6주)
8. ⬜ 일괄 작업
9. ⬜ 알림 전달
10. ✅ RBAC 구현 (ProjectMember 도메인에 포함)

### Phase 4: 다듬기 (7-8주)
10. ⬜ UI 컴포넌트
11. ⬜ API 라우트
12. ⬜ 테스트

---

## 의존성

```
project-members (접근 제어)
    ↓
issues (필터링, 검색)
    ↓
comments (UI)
    ↓
notifications (전달)
    ↓
고급 기능
```

**핵심 경로:**
1. ✅ ProjectMember 도메인 → 접근 제어에 필수
2. 세션 인식 repo → 보안에 필수
3. Issue 필터링 → UI에 필수
4. ✅ Comment 도메인 → 이슈 상세에 필수 ✅

---

## 테스트 격차

### 누락된 테스트 커버리지

**단위 테스트:**
- [ ] Repository 메서드
- [ ] 비즈니스 로직 (lib/)
- [ ] 검증 유틸리티
- [ ] 상태 머신

**통합 테스트:**
- [ ] Server actions
- [ ] API 라우트
- [ ] 데이터베이스 작업

**E2E 테스트:**
- [ ] 완전한 사용자 워크플로우
- [ ] 권한 시나리오
- [ ] 동시 편집

---

## 관련 문서

- [Issue Detail 개요](./issue-detail/overview.md) - 기능 범위
- [로드맵](./issue-detail/roadmap.md) - MVP 단계
- [구현 계획](./issue-detail/implementation-plan.md) - 기술적 접근
- [낙관적 잠금](./issue-detail/optimistic-locking.md) - MVP 2 기능
- [세션 인수인계](./session-handoff.md) - 현재 상태

---

## 다음 단계

1. **완료됨**: Comment 도메인 구조 구현 ✅
2. **완료됨**: ProjectMember 도메인 구조 구현 ✅
3. **완료됨**: Project 접근 제어 구현 ✅
4. **완료됨**: Issue Closed 상태 추가 ✅
5. **이번 주**: 세션 인식 클라이언트를 사용하도록 repository 리팩토링
6. **다음 주**: Issue 검색/필터링 구현
7. **그 후**: 누락된 repository 메서드 및 액션 구현

---

*마지막 업데이트: 2026-03-25*
*분석: Explore Subagent (a591d49ffa8fd5d80)*
*Comment 도메인 구현: 2026-03-25*
*ProjectMember 도메인 구현: 2026-03-25*
*Project 접근 제어 구현: 2026-03-25*
*Issue Closed 상태 추가: 2026-03-25*
