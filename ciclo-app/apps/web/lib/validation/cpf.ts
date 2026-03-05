/**
 * CPF validation and formatting utilities
 * Story E3.1 — AC-3: CPF validation with check digits
 *
 * Implements the official Brazilian CPF check digit algorithm.
 * Pure functions — no side effects, fully testable.
 */

/**
 * Remove all non-digit characters from a CPF string
 */
function stripCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Validate a Brazilian CPF number (format + check digits)
 *
 * Algorithm:
 * 1. Must have exactly 11 digits
 * 2. Cannot be all same digits (e.g., 111.111.111-11)
 * 3. First check digit: multiply first 9 digits by 10..2, sum, mod 11
 * 4. Second check digit: multiply first 10 digits by 11..2, sum, mod 11
 *
 * @param cpf - CPF string (with or without formatting)
 * @returns true if valid CPF
 */
export function validateCPF(cpf: string): boolean {
  const digits = stripCpf(cpf)

  if (digits.length !== 11) return false

  // Reject all-same-digit CPFs (e.g., 000.000.000-00, 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false

  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits.charAt(9), 10)) return false

  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits.charAt(10), 10)) return false

  return true
}

/**
 * Format a CPF string as XXX.XXX.XXX-XX
 *
 * @param cpf - CPF digits (with or without formatting)
 * @returns Formatted CPF string
 */
export function formatCPF(cpf: string): string {
  const digits = stripCpf(cpf)
  if (digits.length !== 11) return cpf

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

/**
 * Mask a CPF for display: ***.***.*XX-XX
 * Shows only last 5 characters for LGPD compliance.
 *
 * @param cpf - CPF string (with or without formatting)
 * @returns Masked CPF string
 */
export function maskCPF(cpf: string): string {
  const digits = stripCpf(cpf)
  if (digits.length !== 11) return cpf

  return `***.***.*${digits.slice(7, 9)}-${digits.slice(9, 11)}`
}
