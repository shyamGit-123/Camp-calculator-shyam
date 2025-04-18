import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css';
import { Link } from 'react-router-dom';

const apiEndpoints = {
  costsummaries: "http://localhost:8000/api/costsummaries/"
};

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true); // State to track loading
  const [firstLogin, setFirstLogin] = useState(true); // State to track if it's the first login

  // Function to fetch data
  const fetchData = async () => {
    try {
      const response = await axios.get(apiEndpoints.costsummaries);
      console.log(response.data); // Log the response data
      setData(response.data);
      if (firstLogin) {
        setTimeout(() => setLoading(false), 2000); // Simulate loading time only after first login
      } else {
        setLoading(false); // Immediately set loading to false after data fetch
      }
    } catch (error) {
      console.error('Error fetching data', error);
      setLoading(false); // Set loading to false in case of error
    }
  };

  useEffect(() => {
    // Set the firstLogin state to false after the first fetch
    fetchData(); // Initial fetch

    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set firstLogin to false after the initial fetch is completed
    if (data.length > 0) {
      setFirstLogin(false);
    }
  }, [data]);

  const handleDetailsToggle = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col p-6 bg-gray-100">
        <div className="flex flex-row items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-blue-600">DASHBOARD</h1>
          <Link to="/camp-details">
            <h1 className="text-xl text-green-500 hover:text-green-700 transition-colors duration-200 cursor-pointer">
              ADD NEW CAMP
            </h1>
          </Link>
          <Link to='/login'> <h1 className="text-xl text-green-500 hover:text-green-700 transition-colors duration-200 cursor-pointer">
              Logout
            </h1></Link>
            <Link to='/newdashboard'> <h1 className="text-xl text-green-500 hover:text-green-700 transition-colors duration-200 cursor-pointer">
              customer costing
            </h1></Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-10 w-10 text-blue-600 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0z" />
              </svg>
              <p className="text-lg text-gray-600">Loading...</p>
            </div>
          </div>
        ) : data.length > 0 ? (
          data.map((company, index) => (
            <div key={company.id} className="bg-white p-4 rounded shadow mt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{company.company_name}</h2>
                <button
                  onClick={() => handleDetailsToggle(index)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
                >
                  {expandedIndex === index ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              {expandedIndex === index && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Company Details</h3>
                  <p><strong>Billing Number:</strong> {company.billing_number}</p>
                  <p><strong>State:</strong> {company.company_state}</p>
                  <p><strong>District:</strong> {company.company_district}</p>
                  <p><strong>Pincode:</strong> {company.company_pincode}</p>
                  <p><strong>Landmark:</strong> {company.company_landmark}</p>
                  <p><strong>Address:</strong> {company.company_address}</p>
                  <h4 className="text-lg font-semibold mt-4">Camp Details</h4>
                  {company.camp_details.map((camp, index) => (
                    <div key={index} className="mb-2">
                      <p><strong>Location:</strong> {camp.campLocation}</p>
                      <p><strong>District:</strong> {camp.campDistrict}</p>
                      <p><strong>State:</strong> {camp.campState}</p>
                      <p><strong>Pincode:</strong> {camp.campPinCode}</p>
                      <p><strong>Landmark:</strong> {camp.campLandmark}</p>
                      <p><strong>Start Date:</strong> {new Date(camp.startDate).toLocaleDateString()}</p>
                      <p><strong>End Date:</strong> {new Date(camp.endDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                  <h4 className="text-lg font-semibold mt-4">Service Details</h4>
                  <table className="min-w-full divide-y divide-gray-300 mt-2">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Service</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Total Cases</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Unit Price</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {company.service_details.map((service, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{service.service}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{service.totalCase}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{service.unitPrice.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{service.totalPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <h4 className="text-lg font-semibold mt-4">Grand Total: ₹{company.grand_total}</h4>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600">No data available.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
