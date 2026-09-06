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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!applicationId) return;
    api
      .getOffer(applicationId)
      .then((result) => setOffer(result as OfferView))
      .catch((err) =>
        setLoadError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to load offer'),
      );
  }, [applicationId]);

  async function handleAccept() {
    if (!applicationId) return;
    setAccepting(true);
    setActionError(null);
    try {
      await api.acceptOffer(applicationId);
      navigate(`/applications/${applicationId}`);
    } catch (err) {
      setActionError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to accept offer');
    } finally {
      setAccepting(false);
    }
  }

  function handleDecline() {
    navigate(`/applications/${applicationId}`);
  }

  if (loadError) return <p role="alert">{loadError}</p>;
  if (!offer) return <p>Loading...</p>;

  return (
    <div className="card">
      <h1>Your offer</h1>
      <dl className="offer-details">
        <dt>Rate band</dt>
        <dd>{offer.rateBandLabel}</dd>
        <dt>Annual rate</dt>
        <dd>{Number(offer.annualRate) * 100}%</dd>
        <dt>Monthly EMI</dt>
        <dd>{offer.emi}</dd>
        <dt>Schedule</dt>
        <dd>
          {offer.tenureMonths} monthly payments, total payable {offer.totalPayable}
        </dd>
      </dl>
      <div className="button-row">
        <button onClick={handleAccept} disabled={accepting}>
          Accept offer
        </button>
        <button className="button-secondary" onClick={handleDecline} disabled={accepting}>
          Decline
        </button>
      </div>
      {actionError && <p role="alert">{actionError}</p>}
    </div>
  );
}
