/**
 * Project name sanitization utilities
 * Sanitize project names for storage and display
 */

/**
 * Sanitize project name
 * - Trim whitespace
 * - Remove extra whitespace
 * - Prevent malicious content
 */
export function sanitizeProjectName(name: string): string {
  let sanitized = name.trim();

  // Replace multiple whitespace with single space
  sanitized = sanitized.replace(/\s+/g, " ");

  // Filter out control characters using character codes
  sanitized = sanitized
    .split("")
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      // Keep printable characters and tab, newline, carriage return
      return (
        code === 9 ||
        code === 10 ||
        code === 13 ||
        (code >= 32 && code <= 126) ||
        code >= 128
      );
    })
    .join("");

  return sanitized;
}

/**
 * Validate project name
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateProjectName(name: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({ field: "name", message: "프로젝트 이름은 필수입니다." });
    return errors;
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    errors.push({
      field: "name",
      message: "프로젝트 이름은 최소 2자 이상이어야 합니다.",
    });
  }

  if (trimmedName.length > 100) {
    errors.push({
      field: "name",
      message: "프로젝트 이름은 최대 100자까지 가능합니다.",
    });
  }

  // Check for whitespace-only name
  if (trimmedName.length === 0 && name.length > 0) {
    errors.push({
      field: "name",
      message: "프로젝트 이름은 공백만으로 구성할 수 없습니다.",
    });
  }

  return errors;
}

/**
 * Truncate project name for display
 */
export function truncateProjectName(
  name: string,
  maxLength: number = 30
): string {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength - 3).trim()}...`;
}

/**
 * Generate project initials from name
 */
export function generateProjectInitials(
  name: string,
  maxLength: number = 2
): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, maxLength);
  }

  return words
    .slice(0, maxLength)
    .map((word) => word.charAt(0))
    .join("");
}

/**
 * Get project URL-safe slug from name
 */
export function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
