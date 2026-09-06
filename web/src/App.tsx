import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './routes/LoginPage';
import { ApplyPage } from './routes/ApplyPage';
import { StatusPage } from './routes/StatusPage';
import { OfferPage } from './routes/OfferPage';
import { UnderwriterQueuePage } from './routes/UnderwriterQueuePage';
import { RoleGuard } from './auth/RoleGuard';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/apply"
        element={
          <RoleGuard allow="applicant">
            <ApplyPage />
          </RoleGuard>
        }
      />
      <Route
        path="/applications/:applicationId"
        element={
          <RoleGuard allow="applicant">
            <StatusPage />
          </RoleGuard>
        }
      />
      <Route
        path="/applications/:applicationId/offer"
        element={
          <RoleGuard allow="applicant">
            <OfferPage />
          </RoleGuard>
        }
      />
      <Route
        path="/queue"
        element={
          <RoleGuard allow="underwriter">
            <UnderwriterQueuePage />
          </RoleGuard>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
