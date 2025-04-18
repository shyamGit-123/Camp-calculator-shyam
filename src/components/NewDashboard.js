import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NewDashboard = () => {
  const [companyData, setCompanyData] = useState([]);
  const [expandedCompanyIndex, setExpandedCompanyIndex] = useState(null); // To track which company is expanded

  // Fetch data from API
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get('http://15.206.159.215:8000/api/company-details/');
        setCompanyData(response.data);
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };
    
    fetchCompanyData();
  }, []);

  const handleToggle = (index) => {
    setExpandedCompanyIndex(expandedCompanyIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">LIST OF COMPANY THAT DONE COSTING</h1>
      
      {companyData.length > 0 ? (
        companyData.map((company, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold flex justify-between items-center">
              {company.company_name}<h2>costing done by {company.super_company}</h2>
              <button 
                className="text-blue-500 font-medium"
                onClick={() => handleToggle(index)}
              >
                {expandedCompanyIndex === index ? 'Hide Details' : 'Show Details'}

              </button>
            </h2>
            <p className="text-lg">Grand Total: ₹{company.grand_total}</p>
            
            {expandedCompanyIndex === index && (
              <div className="mt-4">
                <h3 className="text-xl font-medium">Services</h3>
                <ul className="list-disc list-inside pl-5">
                  {company.services.map((service, idx) => (
                    <li key={idx} className="text-md">
                      {service.service_name}: {service.total_cases} cases
                    </li>
                  ))}
                </ul>
                {/* Add any additional company-related information here */}
                {/* For example: */}
                <h3 className="mt-4 text-xl font-medium">Additional Info</h3>
                <p>{company.additional_info}</p> {/* Replace with actual data if available */}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-lg">No company details available.</p>
      )}
    </div>
  );
};

export default NewDashboard;
