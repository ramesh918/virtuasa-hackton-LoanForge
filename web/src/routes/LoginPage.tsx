import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession } from '../auth/session';
import type { Role } from '../auth/session';

/** Stub auth for this hackathon's scope: pick a role (and applicant id, if applying). */
export function LoginPage() {
  const [role, setRole] = useState<Role>('applicant');
  const [applicantId, setApplicantId] = useState('APP-0001');
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSession(role === 'applicant' ? { role, applicantId } : { role });
    navigate(role === 'applicant' ? '/apply' : '/queue');
  }

  return (
    <main>
      <h1>LoanForge</h1>
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
    </main>
  );
}
