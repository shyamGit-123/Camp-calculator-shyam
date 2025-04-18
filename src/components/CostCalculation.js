import React, { useState, useEffect, useCallback } from 'react';
import { getServiceCosts, submitCostDetails } from './api';
import { useNavigate } from 'react-router-dom';

const defaultCostValues = {
  travel: 0,
  stay: 0,
  food: 0,
};

// Define standard calculation rules for services in packages
const packageCalculationRules = {
  'default': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  }
};

function CostCalculation({ companyId, onSubmit }) {
  const [costDetails, setCostDetails] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [packages, setPackages] = useState([]);
  const [servicePackages, setServicePackages] = useState({});
  const navigate = useNavigate();

  // Fetch service costs and initialize costDetails
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch packages data
        try {
          const response = await fetch(`http://localhost:8000/api/service-selection/?company_id=${companyId}`);
          const packagesData = await response.json();
          
          // Process packages data
          if (Array.isArray(packagesData) && packagesData.length > 0) {
            const companyPackages = packagesData.find(item => item.company_id === companyId.toString());
          
            if (companyPackages && Array.isArray(companyPackages.packages)) {
              const packageMap = {};
              companyPackages.packages.forEach(pkg => {
                packageMap[pkg.package_name] = pkg.services;
              });
              setServicePackages(packageMap);
              setPackages(companyPackages.packages);
            }
          }
        } catch (error) {
          console.error('Error fetching packages:', error);
        }

        // Fetch service costs
        const costData = await getServiceCosts(companyId);
        const formattedCostData = costData.reduce((acc, cost) => {
          acc[cost.test_type_name] = {
            salary: parseFloat(cost.salary) || 0,
            incentive: parseFloat(cost.incentive) || 0,
            misc: parseFloat(cost.misc) || 0,
            equipment: parseFloat(cost.equipment) || 0,
            consumables: parseFloat(cost.consumables) || 0,
            reporting: parseFloat(cost.reporting) || 0,
          };
          return acc;
        }, {});

        // Initialize package costs
        const initialPackageDetails = {};
        Object.entries(servicePackages).forEach(([packageName, services]) => {
          let totalBaseCost = 0;
          
          // Calculate base costs for each service in the package
          services.forEach(service => {
            const serviceCost = formattedCostData[service];
            if (serviceCost) {
              const { salary = 0, incentive = 0, misc = 0, equipment = 0, consumables = 0, reporting = 0 } = serviceCost;
              totalBaseCost += salary + incentive + misc + equipment + consumables + reporting;
            }
          });

          initialPackageDetails[packageName] = {
            ...defaultCostValues,
            services,
            totalBaseCost,
            overhead: totalBaseCost * 1.5,
            tPrice: totalBaseCost * 1.95, // 1.5 * 1.3 for overhead and profit
          };
        });

        setCostDetails(initialPackageDetails);
        setInitialized(true);
      } catch (error) {
        console.error('Error fetching service costs:', error);
      }
    };
  
    if (!initialized) {
      fetchData();
    }
  }, [initialized, companyId, servicePackages]);

  const handleChange = (packageName, field, value) => {
    setCostDetails(prev => {
      const updated = {
        ...prev,
        [packageName]: {
          ...prev[packageName],
          [field]: value,
        },
      };

      // If changing travel/stay/food, update tPrice
      if (field === 'travel' || field === 'stay' || field === 'food') {
        const currentPackage = updated[packageName];
        const travel = currentPackage.travel || 0;
        const stay = currentPackage.stay || 0;
        const food = currentPackage.food || 0;
        const additionalCosts = travel + stay + food;
        
        // Update package tPrice with overhead and profit
        const basePrice = currentPackage.totalBaseCost || 0;
        updated[packageName].overhead = (basePrice + additionalCosts) * 1.5;
        updated[packageName].tPrice = (basePrice + additionalCosts) * 1.95;
      }
      
      // If directly editing tPrice, adjust the overhead calculation
      if (field === 'tPrice') {
        const currentPackage = updated[packageName];
        const travel = currentPackage.travel || 0;
        const stay = currentPackage.stay || 0;
        const food = currentPackage.food || 0;
        const additionalCosts = travel + stay + food;
        
        // Calculate base cost without additives and overhead
        const newBasePrice = Math.max(0, value / 1.95 - additionalCosts);
        updated[packageName].totalBaseCost = newBasePrice;
        updated[packageName].overhead = value / 1.3;
      }
      
      return updated;
    });
  };

  const calculateAllDetails = useCallback(() => {
    const details = {};
 
    Object.keys(costDetails).forEach(packageName => {
      const packageData = costDetails[packageName];
      if (!packageData) return;

      const { 
        travel = 0, 
        stay = 0, 
        food = 0, 
        services = [], 
        totalBaseCost = 0 
      } = packageData;

      const overhead = (totalBaseCost + travel + stay + food) * 1.5;
      const tPrice = overhead * 1.3;
      
      details[packageName] = {
        services,
        travel,
        stay,
        food,
        totalBaseCost,
        overhead,
        tPrice,
      };
    });
    return details;
  }, [costDetails]);

  const allDetails = calculateAllDetails();

  const handleSubmit = async () => {
    try {
      const finalDetails = calculateAllDetails();
      
      // Format the data for API submission
      const submissionData = Object.keys(finalDetails).map(packageName => {
        const packageData = finalDetails[packageName];
        return {
          package_name: packageName,
          services: packageData.services,
          travel: packageData.travel || 0,
          stay: packageData.stay || 0,
          food: packageData.food || 0,
          total_cost: packageData.tPrice || 0
        };
      });
      
      await submitCostDetails(companyId, { 
        company_id: companyId,
        packages: submissionData
      });
      
      alert('Package costs submitted successfully!');

      onSubmit(submissionData);

      // Uncomment if you want to navigate after submission
      // navigate('/cost-summary', { 
      //   state: { 
      //     submittedData: submissionData,
      //     companyId: companyId
      //   }
      // });
    } catch (error) {
      console.error('Error submitting package costs:', error);
      alert('Failed to submit package costs. Please try again.');
    }
  };
  
  if (!initialized || Object.keys(costDetails).length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl mb-4">Package Cost Calculation</h2>
        <div className="text-gray-500">Loading package data...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Package Cost Calculation</h2>
      <div className="space-y-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3">Package Name</th>
              <th className="px-6 py-3">Services Included</th>
              <th className="px-6 py-3">Travel</th>
              <th className="px-6 py-3">Stay</th>
              <th className="px-6 py-3">Food</th>
              <th className="px-6 py-3">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(allDetails).map(packageName => {
              const details = allDetails[packageName];
              return (
                <tr key={packageName}>
                  <td className="px-6 py-4 font-medium">{packageName}</td>
                  <td className="px-6 py-4 text-sm">
                    {details.services.join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[packageName]?.travel || 0}
                      onChange={e => handleChange(packageName, 'travel', +e.target.value)}
                      className="p-2 border rounded w-24"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[packageName]?.stay || 0}
                      onChange={e => handleChange(packageName, 'stay', +e.target.value)}
                      className="p-2 border rounded w-24"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[packageName]?.food || 0}
                      onChange={e => handleChange(packageName, 'food', +e.target.value)}
                      className="p-2 border rounded w-24"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={details?.tPrice?.toFixed(2) || 0}
                      onChange={e => handleChange(packageName, 'tPrice', +e.target.value)}
                      className="p-2 border rounded w-24"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default CostCalculation;