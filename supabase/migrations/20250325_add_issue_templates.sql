-- 이슈 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS issue_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  title_template TEXT NOT NULL DEFAULT '{title}',
  default_status TEXT NOT NULL DEFAULT 'Triage',
  default_priority TEXT DEFAULT 'No Priority',
  default_labels TEXT[] DEFAULT '{}',
  default_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 활성화
ALTER TABLE issue_templates ENABLE ROW LEVEL SECURITY;

-- 프로젝트 멤버는 템플릿을 조회할 수 있음
CREATE POLICY "Project members can view templates"
  ON issue_templates
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

-- 프로젝트 오너는 템플릿을 생성할 수 있음
CREATE POLICY "Project owners can create templates"
  ON issue_templates
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 프로젝트 오너는 템플릿을 수정할 수 있음
CREATE POLICY "Project owners can update templates"
  ON issue_templates
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 프로젝트 오너는 템플릿을 삭제할 수 있음
CREATE POLICY "Project owners can delete templates"
  ON issue_templates
  FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_issue_templates_project_id ON issue_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_templates_is_active ON issue_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_issue_templates_created_by ON issue_templates(created_by);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_issue_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issue_templates_updated_at
  BEFORE UPDATE ON issue_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_templates_updated_at();

-- 기본 템플릿 데이터 (선택적)
-- 버그 리포트 템플릿
INSERT INTO issue_templates (project_id, name, description, title_template, default_priority, default_description)
SELECT
  p.id,
  'Bug Report',
  'Report a bug or issue',
  'Bug: {title}',
  'High',
  '## Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to ''...''
2. Click on ''....''
3. Scroll down to ''....''
4. See error

## Expected Behavior
A concise description of what you expected to happen.

## Actual Behavior
A concise description of what actually happened.

## Environment
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 22]'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM issue_templates it
  WHERE it.project_id = p.id AND it.name = 'Bug Report'
)
LIMIT 1;

-- 기능 요청 템플릿
INSERT INTO issue_templates (project_id, name, description, title_template, default_priority, default_description)
SELECT
  p.id,
  'Feature Request',
  'Request a new feature',
  'Feature: {title}',
  'Medium',
  '## Problem Statement
What problem does this feature solve?

## Proposed Solution
What is your proposed solution?

## Alternatives
What are the alternatives you''ve considered?

## Additional Context
Add any other context or screenshots about the feature request here.'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM issue_templates it
  WHERE it.project_id = p.id AND it.name = 'Feature Request'
)
LIMIT 1;
