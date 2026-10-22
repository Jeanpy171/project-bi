import { err, ok, type Result } from '@bi/kernel';

export interface SecurityViolationError {
  readonly code: 'FORBIDDEN_KEYWORD' | 'MUTATION_ATTEMPT' | 'MULTIPLE_STATEMENTS' | 'EMPTY_QUERY';
  readonly message: string;
  readonly matchedToken?: string;
}

export interface SafeQuery {
  readonly sanitizedSql: string;
  readonly effectiveLimit: number;
}

const FORBIDDEN_KEYWORDS = [
  'DROP',
  'DELETE',
  'UPDATE',
  'INSERT',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'GRANT',
  'REVOKE',
  'COPY',
  'EXECUTE',
  'EXEC',
  'CALL',
  'LOCK',
  'VACUUM',
  'REINDEX',
  'DISCARD',
] as const;

/**
 * Validates that an incoming SQL query is strictly read-only and safe to execute.
 * Ensures:
 * 1. Not empty
 * 2. Starts with SELECT or WITH (common table expressions)
 * 3. Does not contain any mutation or DDL keywords
 * 4. Does not chain multiple semicolon-separated statements
 * 5. Appends a safe LIMIT if none is specified
 */
export const validateReadOnlySql = (
  rawSql: string,
  maxLimit: number = 5000,
): Result<SafeQuery, SecurityViolationError> => {
  const trimmed = rawSql.trim();

  if (trimmed.length === 0) {
    return err({
      code: 'EMPTY_QUERY',
      message: 'La consulta SQL no puede estar vacía.',
    });
  }

  // Remove single line and multiline comments before inspection
  const strippedSql = trimmed
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  // Check for multiple semicolon-delimited queries
  const statements = strippedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (statements.length > 1) {
    return err({
      code: 'MULTIPLE_STATEMENTS',
      message: 'No se permite ejecutar múltiples sentencias SQL en una sola consulta.',
    });
  }

  const queryToInspect = statements[0] ?? '';

  // Must begin with SELECT or WITH (CTE)
  const startsWithSelectOrWith = /^(SELECT|WITH)\b/i.test(queryToInspect);
  if (!startsWithSelectOrWith) {
    return err({
      code: 'MUTATION_ATTEMPT',
      message: 'Solo se permiten consultas de lectura que inicien con SELECT o WITH.',
    });
  }

  // Check forbidden keywords as whole words
  const tokenRegex = new RegExp(`\\b(${FORBIDDEN_KEYWORDS.join('|')})\\b`, 'i');
  const forbiddenMatch = tokenRegex.exec(queryToInspect);
  if (forbiddenMatch) {
    return err({
      code: 'FORBIDDEN_KEYWORD',
      message: `La consulta contiene una palabra clave prohibida para solo lectura: "${forbiddenMatch[0].toUpperCase()}".`,
      matchedToken: forbiddenMatch[0],
    });
  }

  // Ensure LIMIT clause
  const hasLimitClause = /\bLIMIT\s+(\d+)\b/i.exec(queryToInspect);
  let sanitizedSql = queryToInspect;
  let effectiveLimit = maxLimit;

  if (hasLimitClause && hasLimitClause[1]) {
    const specifiedLimit = parseInt(hasLimitClause[1], 10);
    if (specifiedLimit > maxLimit) {
      // Clamp limit to max allowed limit
      sanitizedSql = sanitizedSql.replace(
        /\bLIMIT\s+\d+\b/i,
        `LIMIT ${maxLimit}`,
      );
      effectiveLimit = maxLimit;
    } else {
      effectiveLimit = specifiedLimit;
    }
  } else {
    // Append default limit
    sanitizedSql = `${sanitizedSql} LIMIT ${maxLimit}`;
  }

  return ok({
    sanitizedSql,
    effectiveLimit,
  });
};
