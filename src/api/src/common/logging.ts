const PII_FIELDS = ['income', 'ssn', 'accountNumber', 'applicantName'] as const;

type Redactable = Record<string, unknown>;

/**
 * Masks known PII fields before a value is logged (NFR-03). Feature modules must route any
 * applicant-shaped object through this before it reaches Logger.log/console.log.
 */
export function redact<T extends Redactable>(value: T): T {
  const clone: Redactable = { ...value };
  for (const field of PII_FIELDS) {
    if (field in clone) {
      clone[field] = '***REDACTED***';
    }
  }
  return clone as T;
}
