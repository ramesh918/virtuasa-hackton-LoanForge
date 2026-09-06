import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession } from '../auth/session';
import type { Role } from '../auth/session';

/** Applicants seeded by scripts/seed.ts — guaranteed to pass eligibility's age/income checks. */
const DEMO_APPLICANT_IDS = ['APP-0001', 'APP-0002', 'APP-0003'];

/** Stub auth for this hackathon's scope: pick a role (and applicant id, if applying). */
export function LoginPage() {
  const [role, setRole] = useState<Role>('applicant');
  const [applicantId, setApplicantId] = useState(DEMO_APPLICANT_IDS[0]);
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSession(role === 'applicant' ? { role, applicantId } : { role });
    navigate(role === 'applicant' ? '/apply' : '/queue');
  }

  return (
    <div className="card card-narrow">
      <h1>LoanForge</h1>
      <p className="muted">Retail loan origination & underwriting — sign in to continue.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="applicant">Applicant</option>
            <option value="underwriter">Underwriter</option>
          </select>
        </label>
        {role === 'applicant' && (
          <label>
            Applicant ID
            <input value={applicantId} onChange={(e) => setApplicantId(e.target.value)} required />
          </label>
        )}
        <button type="submit">Continue</button>
      </form>
      {role === 'applicant' && (
        <p className="hint">
          Demo applicant profiles (seeded, real age/income on file): {DEMO_APPLICANT_IDS.join(', ')}. Any
          other ID will be treated as ineligible (no profile on file).
        </p>
      )}
    </div>
  );
}
