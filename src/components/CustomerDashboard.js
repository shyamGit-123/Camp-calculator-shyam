import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the required components for Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerDashboard = () => {
  const [companyDetails, setCompanyDetails] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCompanyIndex, setExpandedCompanyIndex] = useState(null);

  // Retrieve username from local storage
  const username = localStorage.getItem('companyName');

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await axios.get('http://15.206.159.215:8000/api/company-details/');
        const companies = response.data;

        const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const userCompanies = companies.filter(company => {
          const normalizedCompanyName = company.super_company.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedCompanyName.includes(normalizedUsername);
        });

        const currentDate = new Date().toISOString().split('T')[0];

        const companiesWithDate = userCompanies.map(company => ({
          ...company,
          datenow: currentDate,
        }));

        setCompanyDetails(companiesWithDate);
      } catch (error) {
        setError('Error fetching company details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [username]);

  const toggleDetails = (index) => {
    setExpandedCompanyIndex(expandedCompanyIndex === index ? null : index);
  };

  const chartData = {
    labels: companyDetails.map(company => company.company_name),  // Use company name here
    datasets: [
      {
        label: 'Grand Total (₹)',
        data: companyDetails.map(company => company.grand_total),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const Loader = () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
    </div>
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <div className="w-64 bg-gray-800 text-white h-screen p-6">
          <h2 className="text-2xl font-bold">{username}</h2>
          <nav className="mt-8">
          <Link to="/camp-details" className="block py-2 px-4 hover:bg-gray-700 rounded">Add New Camp</Link>

            <Link to="/login" className="block py-2 px-4 hover:bg-gray-700 rounded">LOGOUT</Link>
          </nav>
        </div>

        <div className="flex-1 p-6 bg-gray-100">
          <div className="flex flex-row items-center justify-between p-4 bg-white rounded-lg shadow-md mb-4">
            <h1 className="text-3xl font-bold text-blue-600">DASHBOARD</h1>
          </div>

          {companyDetails.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Grand Total Visualization</h2>
              <Bar data={chartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Company Grand Totals',
                  },
                },
              }} />
            </div>
          )}

          {companyDetails.length === 0 ? (
            <p>No company data found for {username}.</p>
          ) : (
            companyDetails.map((company, index) => (
              <div key={index} className="mb-6 border bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{company.company_name}</h3>
                    <p>Grand Total: ₹{company.grand_total}</p>
                    <p>Date: {company.datenow}</p>
                  </div>
                  <button
                    onClick={() => toggleDetails(index)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    {expandedCompanyIndex === index ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {expandedCompanyIndex === index && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold">Services:</h4>
                    <ul className="list-disc pl-5">
                      {company.services.map((service, serviceIndex) => (
                        <li key={serviceIndex}>
                          {service.service_name}: {service.total_cases} cases
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
