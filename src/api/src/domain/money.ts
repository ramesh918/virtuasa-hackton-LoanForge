import { Decimal } from 'decimal.js';

/**
 * All monetary and rate values in LoanForge are represented as Money — a thin wrapper around
 * decimal.js — never as a native `number` (NFR-01). Persisted as a decimal string.
 */
export class Money {
  private readonly value: Decimal;

  private constructor(value: Decimal) {
    this.value = value;
  }

  static of(input: string | number | Decimal): Money {
    return new Money(new Decimal(input));
  }

  static zero(): Money {
    return new Money(new Decimal(0));
  }

  plus(other: Money): Money {
    return new Money(this.value.plus(other.value));
  }

  minus(other: Money): Money {
    return new Money(this.value.minus(other.value));
  }

  times(factor: Decimal | string | number): Money {
    return new Money(this.value.times(factor));
  }

  dividedBy(divisor: Decimal | string | number): Money {
    return new Money(this.value.dividedBy(divisor));
  }

  isGreaterThan(other: Money): boolean {
    return this.value.greaterThan(other.value);
  }

  isLessThan(other: Money): boolean {
    return this.value.lessThan(other.value);
  }

  toDecimal(): Decimal {
    return this.value;
  }

  /** Canonical persisted/display form: fixed-point string, 2 decimal places, half-up rounding. */
  toFixedString(decimalPlaces = 2): string {
    return this.value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP).toFixed(decimalPlaces);
  }
}
