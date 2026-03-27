# Feature Specification: GitHub CI/CD Audit and Rationalization

**Feature Branch**: `008-github-cicd-audit`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "깃허브 cicd를 점검하고 싶어 없앨건 없애고 추가할건 추가하고"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove or replace low-value workflows safely (Priority: P1)

프로젝트 유지보수자는 현재 GitHub CI/CD 구성을 검토해서, 실제 보호 가치가 없거나 placeholder 수준에 머물러 있는 workflow, job, step을 식별하고 제거 또는 대체하고 싶다. 이를 통해 CI가 신뢰 가능한 신호만 제공하도록 만들고 싶다.

**Why this priority**: 불필요하거나 오해를 부르는 CI 신호는 PR 신뢰도를 떨어뜨리고, 실패 원인 파악 시간을 늘린다. 먼저 정리 기준을 세워야 이후 추가 작업도 안전하게 진행할 수 있다.

**Independent Test**: 저장소의 기존 workflow들을 검토한 뒤, 유지 대상과 제거/대체 대상이 근거와 함께 구분되어 있고, 제거 후에도 필수 검증 흐름이 비지 않는지 확인하면 독립적으로 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 저장소에 여러 GitHub workflow가 존재할 때, **When** 유지보수자가 CI/CD 감사 결과를 확인하면, **Then** 각 workflow는 유지, 제거, 통합, 대체 중 하나의 결정과 근거를 가진다.
2. **Given** placeholder 단계나 실효성 없는 자동화가 있는 workflow가 있을 때, **When** 정리 작업이 완료되면, **Then** 해당 workflow는 제거되거나 실제 검증 가치를 제공하는 방식으로 대체된다.

---

### User Story 2 - Add missing repository guardrails (Priority: P2)

프로젝트 유지보수자는 PR과 배포 흐름에서 빠져 있는 핵심 검증을 찾아 추가하고 싶다. 이를 통해 코드 품질, 빌드 안정성, 배포 전 기본 안전장치를 일관되게 확보하고 싶다.

**Why this priority**: 정리만 하고 필요한 검증을 보강하지 않으면 CI는 더 가벼워질 수는 있어도 더 안전해지지는 않는다. 필수 guardrail을 정의하고 채우는 것이 두 번째 핵심 가치다.

**Independent Test**: 새로운 또는 보강된 workflow가 어떤 이벤트에서 실행되는지, 어떤 실패를 막는지, 어떤 브랜치 보호 또는 배포 조건을 만족시키는지 문서와 workflow 정의만으로 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** 현재 CI/CD에 누락된 필수 검증이 있을 때, **When** 개선안이 반영되면, **Then** PR 또는 배포 경로별 최소 검증 세트가 명시되고 자동 실행된다.
2. **Given** 보강된 workflow가 추가될 때, **When** 유지보수자가 설정을 검토하면, **Then** 각 workflow의 트리거, 성공/실패 조건, 필수 여부가 명확하게 드러난다.

---

### User Story 3 - Make CI/CD ownership and intent understandable (Priority: P3)

프로젝트 기여자는 어떤 workflow가 왜 존재하는지, 어느 브랜치나 이벤트에 적용되는지, 실패 시 어떻게 대응해야 하는지 빠르게 이해하고 싶다.

**Why this priority**: CI/CD가 명확해야 팀원이 워크플로우를 신뢰하고 유지할 수 있다. 구조를 개선하더라도 문서화와 운영 기준이 없으면 다시 복잡해진다.

**Independent Test**: 저장소 문서 또는 workflow 주석만 읽고도 각 자동화의 목적, 트리거, 소유 책임, 제거 기준을 파악할 수 있으면 독립적으로 검증된다.

**Acceptance Scenarios**:

1. **Given** 저장소에 여러 workflow가 존재할 때, **When** 새 기여자가 문서를 읽으면, **Then** 각 workflow의 목적과 필수 여부를 추가 설명 없이 이해할 수 있다.
2. **Given** workflow 실패가 발생했을 때, **When** 유지보수자가 대응 기준을 확인하면, **Then** 재시도, 수정, 무시가 가능한 경우가 구분되어 있다.

---

### Edge Cases

- 특정 workflow가 현재는 거의 쓰이지 않지만, 수동 실행이나 스케줄 기반 운영에서만 필요한 경우에도 제거 전에 유지 근거가 기록되어야 한다.
- 외부 시크릿이나 환경변수가 없으면 실행할 수 없는 job은, 실패 대신 명시적 skip 또는 조건부 실행으로 동작해야 한다.
- 성능 측정처럼 장기적으로 필요하지만 현재 구현이 placeholder인 자동화는, 즉시 삭제와 향후 대체 중 어느 경로를 택하는지 결정 기준이 필요하다.
- 브랜치별 요구사항이 다를 경우, 모든 push에 동일 검증을 강제하지 않고 PR 보호에 필요한 최소 집합을 우선 보장해야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 저장소의 모든 GitHub workflow, job, 주요 step을 인벤토리화하고 각각의 목적, 트리거, 의존 시크릿, 현재 상태를 식별해야 한다.
- **FR-002**: 시스템은 각 workflow를 유지, 제거, 통합, 대체 중 하나로 분류할 수 있어야 하며, 각 결정에는 저장소 기준의 근거가 포함되어야 한다.
- **FR-003**: 시스템은 placeholder, 중복, 미사용, 신뢰하기 어려운 자동화를 식별하고 제거 또는 대체 대상으로 표시해야 한다.
- **FR-004**: 시스템은 pull request 검증에 필요한 최소 필수 guardrail 세트를 정의해야 하며, 이 세트는 코드 품질, 타입 안정성, 테스트, 빌드 안정성을 포함해야 한다.
- **FR-005**: 시스템은 배포 또는 main 브랜치 보호에 필요한 검증이 무엇인지 명시해야 하며, pull request 전용 검증과 구분해야 한다.
- **FR-006**: 시스템은 비밀값이 없는 환경에서도 workflow가 오해를 주는 실패 대신 예측 가능한 조건부 실행 또는 명시적 skip 동작을 해야 한다.
- **FR-007**: 시스템은 동일한 목적을 가진 중복 setup, 버전 설정, 검증 순서를 가능한 범위에서 일관되게 정리해야 한다.
- **FR-008**: 시스템은 남겨두는 모든 workflow에 대해 존재 이유와 실패 시 대응 기준을 저장소 안에서 확인 가능하게 해야 한다.
- **FR-009**: 시스템은 제거하거나 바꾸는 workflow가 기존 브랜치 보호 또는 팀 운영에 미치는 영향을 검토하고, 필수 신호가 비지 않도록 해야 한다.
- **FR-010**: 시스템은 변경 후 CI/CD 구성이 현재 저장소 명령과 실제 프로젝트 구조를 기준으로 검증 가능해야 한다.

### Key Entities *(include if feature involves data)*

- **Workflow Inventory Item**: 각 GitHub workflow 또는 job을 나타내는 감사 단위. 목적, 트리거, 실행 조건, 필요 시크릿, 현재 신뢰도, 권장 조치를 가진다.
- **Guardrail Policy**: PR, main 브랜치, 배포 전후에 요구되는 최소 검증 규칙 집합. 어떤 이벤트에서 어떤 검증이 필수인지 정의한다.
- **Workflow Decision Record**: 유지, 제거, 통합, 대체 중 하나의 결정과 그 근거, 영향도, 후속 조치를 담는 기록 단위.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 저장소의 모든 GitHub workflow가 감사 결과표에서 100% 분류되고, 분류 근거가 누락되지 않는다.
- **SC-002**: pull request에 필요한 필수 검증 세트가 정의되고, 중복 또는 placeholder 검증 수가 현재 대비 감소한다.
- **SC-003**: 저장소 기여자가 CI/CD 문서 또는 workflow 설명만 읽고 각 자동화의 목적과 트리거를 5분 이내에 파악할 수 있다.
- **SC-004**: 변경 후 저장소의 표준 검증 명령이 GitHub CI 경로와 일치하며, 필수 검증 누락 없이 자동 실행된다.

## Assumptions

- 현재 감사 대상의 중심은 `.github/workflows/` 아래에 있는 저장소 레벨 GitHub Actions workflow들이다.
- 프로젝트의 표준 검증 명령은 저장소에 이미 정의된 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` 흐름을 우선 따른다.
- 별도 배포 플랫폼 통합이 있더라도, 이번 범위의 1차 초점은 저장소 안에서 관리되는 GitHub CI/CD 구성 정리와 보강이다.
- 외부 시크릿이 필요한 자동화는 완전 제거보다 조건부 실행과 명시적 문서화가 더 적절할 수 있다.
