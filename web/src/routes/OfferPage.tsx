import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';

interface OfferView {
  applicationId: string;
  rateBandLabel: string;
  annualRate: string;
  emi: string;
  tenureMonths: number;
  totalPayable: string;
}

// wires the "view offer (rate, EMI, schedule)" and "accept/decline" applicant flows
export function OfferPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<OfferView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!applicationId) return;
    api
      .getOffer(applicationId)
      .then((result) => setOffer(result as OfferView))
      .catch((err) => setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to load offer'));
  }, [applicationId]);

  async function handleAccept() {
    if (!applicationId) return;
    setAccepting(true);
    setError(null);
    try {
      await api.acceptOffer(applicationId);
      navigate(`/applications/${applicationId}`);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to accept offer');
    } finally {
      setAccepting(false);
    }
  }

  function handleDecline() {
    navigate(`/applications/${applicationId}`);
  }

  if (error) return <p role="alert">{error}</p>;
  if (!offer) return <p>Loading...</p>;

  return (
    <main>
      <h1>Your offer</h1>
      <p>Rate band: {offer.rateBandLabel}</p>
      <p>Annual rate: {Number(offer.annualRate) * 100}%</p>
      <p>Monthly EMI: {offer.emi}</p>
      <p>
        Schedule: {offer.tenureMonths} monthly payments, total payable {offer.totalPayable}
      </p>
      <button onClick={handleAccept} disabled={accepting}>
        Accept offer
      </button>
      <button onClick={handleDecline} disabled={accepting}>
        Decline
      </button>
    </main>
  );
}
