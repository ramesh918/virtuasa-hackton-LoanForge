import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { getSession } from '../auth/session';

// wires AC-01 submit flow
export function ApplyPage() {
  const session = getSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState('PRD-PERSONAL');
  const [amount, setAmount] = useState('5000.00');
  const [tenureMonths, setTenureMonths] = useState(12);
  const [purpose, setPurpose] = useState('');
  const [income, setIncome] = useState('');
  const [employmentType, setEmploymentType] = useState('SALARIED');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.applicantId) return;
    setSubmitting(true);
    setError(null);
    try {
      const application = await api.submitApplication({
        applicantId: session.applicantId,
        productId,
        amount,
        tenureMonths,
        purpose,
        income,
        employmentType,
      });
      navigate(`/applications/${(application as { applicationId: string }).applicationId}`);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Apply for a loan</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Product
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="PRD-PERSONAL">Personal Loan</option>
            <option value="PRD-AUTO">Auto Loan</option>
          </select>
        </label>
        <label>
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label>
          Tenure (months)
          <input
            type="number"
            value={tenureMonths}
            onChange={(e) => setTenureMonths(Number(e.target.value))}
            required
          />
        </label>
        <label>
          Purpose
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        </label>
        <label>
          Monthly income
          <input value={income} onChange={(e) => setIncome(e.target.value)} required />
        </label>
        <label>
          Employment type
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option value="SALARIED">Salaried</option>
            <option value="SELF_EMPLOYED">Self-employed</option>
          </select>
        </label>
        <button type="submit" disabled={submitting}>
          Submit application
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
