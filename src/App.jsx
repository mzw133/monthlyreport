import React, { useState } from 'react';
import LandingPage from './LandingPage';
import MetricsDashboard from './MetricsDashboard';

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);

  const handleFileProcessed = (data) => {
    setDashboardData(data);
  };

  return (
    <div>
      {!dashboardData ? (
        <LandingPage
          onFileProcessed={handleFileProcessed}
        />
      ) : (
        <MetricsDashboard
          initialData={dashboardData}
          onReset={() => setDashboardData(null)}
        />
      )}
    </div>
  );
} 