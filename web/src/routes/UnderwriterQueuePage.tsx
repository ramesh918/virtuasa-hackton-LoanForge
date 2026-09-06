import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface QueueItem {
  applicationId: string;
  applicantId: string;
  amount: string;
  tenureMonths: number;
  purpose: string;
  state: string;
}

// wires the "underwriter queue" review flow (AC-07)
export function UnderwriterQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadQueue() {
    try {
      const result = await api.getQueue();
      setQueue(result as QueueItem[]);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to load queue');
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleDecision(applicationId: string, decision: 'APPROVE' | 'DECLINE' | 'REQUEST_INFO') {
    setBusyId(applicationId);
    setError(null);
    try {
      await api.decide(applicationId, { actor: 'underwriter-1', decision, reason: `${decision} via UI` });
      await loadQueue();
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to record decision');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main>
      <h1>Underwriter queue</h1>
      {error && <p role="alert">{error}</p>}
      {queue.length === 0 && <p>No applications waiting for review.</p>}
      <ul>
        {queue.map((item) => (
          <li key={item.applicationId}>
            <p>
              {item.applicationId} — {item.applicantId} — {item.amount} / {item.tenureMonths}mo —{' '}
              {item.purpose} — <strong>{item.state}</strong>
            </p>
            <button disabled={busyId === item.applicationId} onClick={() => handleDecision(item.applicationId, 'APPROVE')}>
              Approve
            </button>
            <button disabled={busyId === item.applicationId} onClick={() => handleDecision(item.applicationId, 'DECLINE')}>
              Decline
            </button>
            <button
              disabled={busyId === item.applicationId}
              onClick={() => handleDecision(item.applicationId, 'REQUEST_INFO')}
            >
              Request info
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
