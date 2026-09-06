---
name: emi-calculator
description: Computes EMI (equated monthly installment) from principal, annual rate, and tenure using fixed-point decimal math. Use whenever pricing or offer-display code needs an EMI figure.
---
Given principal (Decimal), annual rate (Decimal, e.g. 0.12 for 12%), tenure in months (int):
1. `monthlyRate = annualRate / 12`
2. `EMI = principal * monthlyRate * (1 + monthlyRate)^tenure / ((1 + monthlyRate)^tenure - 1)`
3. Round to 2 decimal places using `Decimal.js` `toDecimalPlaces(2, Decimal.ROUND_HALF_UP)`.

Never use native `number` for any step above — every intermediate value stays a `Decimal`.
