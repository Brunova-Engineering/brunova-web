export type IdempotencyState = {
  key: string
  attemptedSnapshot: string | null
}

export function createIdempotencyState(
  createKey: () => string = () => crypto.randomUUID(),
): IdempotencyState {
  return { key: createKey(), attemptedSnapshot: null }
}

export function markSubmissionAttempt(
  state: IdempotencyState,
  snapshot: string,
): IdempotencyState {
  return { ...state, attemptedSnapshot: snapshot }
}

export function applyMaterialEdit(
  state: IdempotencyState,
  nextSnapshot: string,
  createKey: () => string = () => crypto.randomUUID(),
): IdempotencyState {
  if (
    state.attemptedSnapshot === null ||
    state.attemptedSnapshot === nextSnapshot
  ) {
    return state
  }

  return { key: createKey(), attemptedSnapshot: null }
}

export function completeSubmission(
  _state: IdempotencyState,
  createKey: () => string = () => crypto.randomUUID(),
): IdempotencyState {
  return { key: createKey(), attemptedSnapshot: null }
}

export function serializeSubmissionIntent(
  values: Readonly<Record<string, FormDataEntryValue>>,
): string {
  return JSON.stringify(
    Object.entries(values).sort(([left], [right]) => left.localeCompare(right)),
  )
}
