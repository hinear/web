export function apiSuccess<T extends Record<string, unknown>>(
  payload: T,
  status = 200
) {
  return Response.json(
    {
      success: true,
      ...payload,
    },
    {
      status,
    }
  );
}

export function apiError(
  error: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return Response.json(
    {
      success: false,
      error,
      ...extra,
    },
    {
      status,
    }
  );
}

export function apiUnauthorized() {
  return apiError("Unauthorized", 401);
}

export function apiForbidden() {
  return apiError("Forbidden", 403);
}

export function apiInvalidJson() {
  return apiError("Invalid JSON payload", 400);
}
