import React, { useState, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CoordinatorLogin from './components/CoordinatorLogin';
import CampDetails from './components/CampDetails';
import ServiceSelection from './components/ServiceSelection';
import TestCaseInput from './components/TestCaseInput';
import CostCalculation from './components/CostCalculation';
import CostSummaryScreen from './components/CostSummaryScreen';
import SimpleCostCalculation from './components/SimpleCostCalculation';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Import your ProtectedRoute component
import NewDashboard from './components/NewDashboard';

// Create the context
export const AppContext = createContext();

function App() {
  const [loginType, setLoginType] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [campDetails, setCampDetails] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);
  const [caseData, setCaseData] = useState({});
  const [costDetails, setCostDetails] = useState({});
  const [packageData, setPackageData] = useState({});
  const [packages, setPackages] = useState([]); // Add this line

  const navigate = useNavigate();

  const isAuthenticated = !!loginType; // Check if the user is authenticated

  const handleLogin = (type) => {
    setLoginType(type);
    if (type === 'Coordinator') {
      navigate('/dashboard');
    } else if (type === 'Customer') {
      navigate('/customer-dashboard'); // Updated to navigate to Customer Dashboard
    }
  };

  const handleCampDetailsNext = (details) => {
    setCampDetails(details);
    setCompanyId(details.companyId);
    navigate('/service-selection');
  };

  const handleServiceSelectionNext = (services) => {
    // Store services directly without transformation
    setSelectedServices(services);
    // No need for separate packages state since it's included in services
    navigate('/test-case-input');
  };

  const handleTestCaseInputNext = (data) => {
    setCaseData(data);
    setPackageData(data);
    if (loginType === 'Coordinator') {
      console.log(data);
      navigate('/cost-calculation');
    } else if (loginType === 'Customer') {
      console.log(data);
      navigate('/simple-cost-calculation');
    }
  };

  const handleCostCalculationNext = (details) => {
    const formattedCostDetails = details.reduce((result, item) => {
      result[item.package_name] = {
        tPrice: item.total_cost,
        services: item.services,
        // Add any other needed properties
      };
      return result;
    }, {});
    
    // Set the cost details with the correct format
    setCostDetails(formattedCostDetails);
    console.log("Formatted cost details:", formattedCostDetails);
    navigate('/cost-summary');
  };

  const handleFinalSubmit = () => {
    setLoginType(null);
    setCompanyId(null);
    setCampDetails({});
    setSelectedServices([]);
    setCaseData({});
    setCostDetails({});
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    handleFinalSubmit();
  };

  // Retrieve username from local storage
  const username = localStorage.getItem('companyName');

  // Create the context value object
  const contextValue = {
    handleServiceSelectionNext: (services) => {
      setSelectedServices(services);
      console.log(services);
      navigate('/test-case-input');
    }
  };

  // Transform the selected services to strings before passing to TestCaseInput
  const formattedServices = selectedServices.map(service => 
    typeof service === 'string' ? service : service.name
  );

  return (
    <AppContext.Provider value={contextValue}>
      <div className="container mx-auto p-4">
        {window.location.pathname === '/cost-summary' && (
          <button onClick={handleLogout} className="bg-red-500 text-white py-2 px-4 rounded shadow hover:bg-red-700">
            Logout
          </button>
        )}
        <Routes>
          <Route path="/login" element={<CoordinatorLogin onLogin={handleLogin} />} />
          <Route path="/camp-details" element={<CampDetails onNext={handleCampDetailsNext} />} />
          <Route path="/service-selection" element={<ServiceSelection companyId={companyId} userType={loginType} onNext={handleServiceSelectionNext} />} />
          {/* <Route path="/test-case-input" element={<TestCaseInput selectedServices={formattedServices} companyId={companyId} onNext={handleTestCaseInputNext} />} /> */}
          <Route path="/cost-calculation" element={<CostCalculation caseData={caseData} companyId={companyId} onSubmit={handleCostCalculationNext} />} />
          <Route path="/cost-summary" element={<CostSummaryScreen packageData={packageData} costDetails={costDetails} companyId={companyId} campDetails={campDetails} onSubmit={handleFinalSubmit} />} />
          <Route path="/simple-cost-calculation" element={<SimpleCostCalculation caseData={caseData} campDetails={campDetails} username={username} onSubmit={handleFinalSubmit} />} /> {/* Pass username as a prop */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} isAuthenticated={isAuthenticated} />} />
          <Route path="/customer-dashboard" element={<ProtectedRoute element={<CustomerDashboard />} isAuthenticated={isAuthenticated} />} /> {/* Added route for Customer Dashboard */}
          <Route path="/newdashboard" element={<NewDashboard />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route 
            path="/test-case-input" 
            element={
              <TestCaseInput
                companyId={companyId}
                selectedServices={selectedServices}
                packages={selectedServices.filter(service => 
                  typeof service === 'object' && service.package_name && service.services
                )}
                onNext={handleTestCaseInputNext}
              />
            } 
          />
        </Routes>
      </div>
    </AppContext.Provider>
  );
}

export default App;
