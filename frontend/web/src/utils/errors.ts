// Turns any API/network failure into one readable sentence.
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as {
    response?: { status?: number; data?: { message?: string; title?: string; errors?: Record<string, string[]> } };
    code?: string;
  };
  const data = e?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  if (data?.message) return data.message;
  if (e?.response?.status === 429) return 'Too many attempts. Please wait a minute.';
  if (e?.response?.status === 403) return 'You do not have permission to do that.';
  if (e?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the API is running.';
  return fallback;
}
