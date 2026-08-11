export type ApiLikeError = { status?: number; message?: string };

export function isApiLikeError(err: unknown): err is ApiLikeError {
  return typeof err === "object" && err !== null;
}

export function getErrorStatus(err: unknown): number | undefined {
  return isApiLikeError(err) ? err.status : undefined;
}

export function getErrorMessage(err: unknown): string {
  if (isApiLikeError(err) && err.message) return err.message;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
