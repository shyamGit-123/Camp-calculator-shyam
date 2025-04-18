import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { saveTestCaseData } from './api';

function TestCaseInput({ companyId, selectedServices = [], packages = [], onNext }) {
  const [packageData, setPackageData] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize package data
  useEffect(() => {
    if (!selectedServices || selectedServices.length === 0) return;

    const packagesData = selectedServices.filter(service => 
      typeof service === 'object' && service.package_name && service.services
    );

    const initialData = packagesData.reduce((acc, pkg) => {
      acc[pkg.package_name] = {
        numberOfDays: 0,
        casePerDay: 0,
        totalCase: 0,
        reportType: 'digital', // Add default report type
        reportTypeCost: 0,
        services: pkg.services
      };
      return acc;
    }, {});
    setPackageData(initialData);
  }, [selectedServices]);

  // Handle package data changes
  const handlePackageChange = (packageName, field, value) => {
    const intValue = parseInt(value, 10) || 0;
    
    setPackageData(prev => {
      const updatedPackage = { ...prev[packageName] };
      updatedPackage[field] = intValue;

      // Calculate total cases
      if (field === 'numberOfDays' || field === 'casePerDay') {
        const casePerDay = field === 'casePerDay' ? intValue : updatedPackage.casePerDay;
        const numberOfDays = field === 'numberOfDays' ? intValue : updatedPackage.numberOfDays;
        updatedPackage.totalCase = casePerDay * numberOfDays;
      }

      return {
        ...prev,
        [packageName]: updatedPackage
      };
    });
  };

  // Add handler for report type changes
  const handleReportTypeChange = (packageName, value) => {
    setPackageData(prev => {
      const updatedPackage = { ...prev[packageName] };
      updatedPackage.reportType = value;
      
      // Calculate report type cost if hard copy
      if (value === 'hard copy') {
        updatedPackage.reportTypeCost = updatedPackage.totalCase * 25; // 25 rs per case for hard copy
      } else {
        updatedPackage.reportTypeCost = 0;
      }

      return {
        ...prev,
        [packageName]: updatedPackage
      };
    });
  };

  const handleNext = async () => {
    // Validate all packages have required fields
    const hasErrors = Object.entries(packageData).some(([packageName, data]) => {
      if (!data.casePerDay || !data.numberOfDays) {
        setErrors(prev => ({
          ...prev,
          [packageName]: 'Please fill in all required fields'
        }));
        return true;
      }
      return false;
    });

    if (hasErrors) return;

    // Prepare data for submission
    const backendPayload = Object.entries(packageData).flatMap(([packageName, data]) => {
      return data.services.map(service => ({
        company_id: companyId,
        package_name: packageName,
        service_name: service,
        case_per_day: data.casePerDay,
        number_of_days: data.numberOfDays,
        total_case: data.totalCase,
        report_type: data.reportType,
        report_type_cost: data.reportTypeCost
      }));
    });

    try {
      await saveTestCaseData(backendPayload);
      onNext(packageData);
    } catch (error) {
      console.error('Error saving test case data:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-richblack-25 rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold mb-6 text-center text-richblack-900">Package Details</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {selectedServices
          .filter(service => typeof service === 'object' && service.package_name)
          .map((pkg) => (
            <div key={pkg.package_name} className="bg-blue-50 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-blue-700">{pkg.package_name}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Days</label>
                  <input
                    type="number"
                    value={packageData[pkg.package_name]?.numberOfDays || ''}
                    onChange={(e) => handlePackageChange(pkg.package_name, 'numberOfDays', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Cases Per Day</label>
                  <input
                    type="number"
                    value={packageData[pkg.package_name]?.casePerDay || ''}
                    onChange={(e) => handlePackageChange(pkg.package_name, 'casePerDay', e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <select
                    value={packageData[pkg.package_name]?.reportType || 'digital'}
                    onChange={(e) => handleReportTypeChange(pkg.package_name, e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="digital">Digital</option>
                    <option value="hard copy">Hard Copy</option>
                  </select>
                </div>
              </div>

              {errors[pkg.package_name] && (
                <div className="text-red-500 text-sm mb-2">{errors[pkg.package_name]}</div>
              )}

              <div className="text-sm font-semibold text-blue-600">
                Total Cases: {packageData[pkg.package_name]?.totalCase || 0}
              </div>

              {packageData[pkg.package_name]?.reportType === 'hard copy' && (
                <div className="text-sm font-semibold text-green-600 mt-1">
                  Report Cost: ₹{packageData[pkg.package_name]?.reportTypeCost || 0}
                </div>
              )}

              <div className="mt-2 text-sm text-gray-600">
                Services included: {pkg.services.join(', ')}
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-md"
        >
          Next
        </button>
      </div>
    </div>
  );
}

TestCaseInput.propTypes = {
  companyId: PropTypes.number.isRequired,
  selectedServices: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        package_name: PropTypes.string.isRequired,
        services: PropTypes.arrayOf(PropTypes.string).isRequired
      })
    ])
  ).isRequired,
  packages: PropTypes.arrayOf(PropTypes.shape({
    package_name: PropTypes.string.isRequired,
    services: PropTypes.arrayOf(PropTypes.string).isRequired
  })).isRequired,
  onNext: PropTypes.func.isRequired,
};

export default TestCaseInput;