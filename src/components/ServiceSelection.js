import React, { useState, useEffect, useContext } from 'react';
import { creatservices } from './api';
import PropTypes from 'prop-types';
import { AppContext } from '../App';
import { useLoaderData } from 'react-router-dom';

function ServiceSelection({ userType, companyId }) { // Add companyId prop
    const { handleServiceSelectionNext } = useContext(AppContext);
    const [packages, setPackages] = useState([
        { id: 1, name: "Package 1", services: [], pathologyOptions: [] }
    ]);

    useEffect(() => {
        console.log('Current companyId:', companyId);
    }, [companyId]);

    const services = [
        'X-ray', 'ECG', 'PFT', 'Audiometry', 'Optometry',
        'Doctor Consultation', 'Pathology', 'Dental Consultation',
        'Vitals', 'Form 7', 'BMD', 'Tetanus Vaccine', 'Typhoid Vaccine', 'Coordinator'
    ];

    const pathologySubServices = [
        'CBC', 'Complete Hemogram', 'Hemoglobin', 'Urine Routine',
        'Stool Examination', 'Lipid Profile', 'Kidney Profile',
        'LFT', 'KFT', 'Random Blood Glucose', 'Blood Grouping'
    ];

    const handleAddPackage = () => {
        setPackages([...packages, {
            id: packages.length + 1,
            name: `Package ${packages.length + 1}`,
            services: [],
            pathologyOptions: []
        }]);
    };

    const handleServiceChange = (packageId, service) => {
        setPackages(packages.map(pkg => {
            if (pkg.id === packageId) {
                const updatedServices = pkg.services.includes(service)
                    ? pkg.services.filter(s => s !== service)
                    : [...pkg.services, service];

                // Clear pathology options if Pathology is deselected
                if (service === 'Pathology' && !updatedServices.includes('Pathology')) {
                    return { ...pkg, services: updatedServices, pathologyOptions: [] };
                }

                return { ...pkg, services: updatedServices };
            }
            return pkg;
        }));
    };

    const handlePathologyOptionChange = (packageId, option) => {
        setPackages(packages.map(pkg => {
            if (pkg.id === packageId) {
                const updatedOptions = pkg.pathologyOptions.includes(option)
                    ? pkg.pathologyOptions.filter(opt => opt !== option)
                    : [...pkg.pathologyOptions, option];
                return { ...pkg, pathologyOptions: updatedOptions };
            }
            return pkg;
        }));
    };

    const handlePackageNameChange = (packageId, newName) => {
        setPackages(packages.map(pkg =>
            pkg.id === packageId ? { ...pkg, name: newName } : pkg
        ));
    };

    const handleSave = async () => {
        try {
            if (!companyId) {
                throw new Error('Company ID is required');
            }

            const formattedPackages = packages.map(pkg => ({
                package_name: pkg.name,
                services: [
                    ...pkg.services.filter(service => service !== 'Pathology'),
                    ...(pkg.services.includes('Pathology') ? pkg.pathologyOptions : [])
                ]
            }));

            const dataToSave = {
              company_id: companyId.toString(),
              packages: formattedPackages  // must be 'packages' here
            };

            console.log('Sending data:', JSON.stringify(dataToSave, null, 2));
            
            const response = await creatservices(dataToSave);
            
            if (response.success) {
                console.log('Services saved successfully:', response.data);
                handleServiceSelectionNext(formattedPackages);
            } else {
                throw new Error('Failed to save services');
            }
        } catch (error) {
            console.error('Error saving packages:', error);
            alert(error.message);
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-200 to-blue-400 min-h-screen flex items-center justify-center">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                    Create Packages
                </h2>

                <div className="space-y-6">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="border p-4 rounded-lg">
                            <input
                                type="text"
                                value={pkg.name}
                                onChange={(e) => handlePackageNameChange(pkg.id, e.target.value)}
                                className="mb-4 p-2 border rounded w-full"
                                placeholder="Package Name"
                            />

                            <div className="grid grid-cols-3 gap-4">
                                {services.map(service => (
                                    <div key={service} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`${pkg.id}-${service}`}
                                            checked={pkg.services.includes(service)}
                                            onChange={() => handleServiceChange(pkg.id, service)}
                                            className="form-checkbox h-5 w-5 text-blue-600"
                                        />
                                        <label htmlFor={`${pkg.id}-${service}`} className="ml-2">
                                            {service}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {pkg.services.includes('Pathology') && (
                                <div className="mt-4 border-t pt-4">
                                    <h3 className="text-xl font-semibold mb-2">Pathology Tests</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {pathologySubServices.map(option => (
                                            <div key={option} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`${pkg.id}-${option}`}
                                                    checked={pkg.pathologyOptions.includes(option)}
                                                    onChange={() => handlePathologyOptionChange(pkg.id, option)}
                                                    className="form-checkbox h-5 w-5 text-blue-600"
                                                />
                                                <label htmlFor={`${pkg.id}-${option}`} className="ml-2">
                                                    {option}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-between mt-6">
                    <button
                        onClick={handleAddPackage}
                        className="bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition duration-300"
                    >
                        Add New Package
                    </button>

                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition duration-300"
                    >
                        Save and Next
                    </button>
                </div>
            </div>
        </div>
    );
}

ServiceSelection.propTypes = {
    userType: PropTypes.string,
    companyId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]).isRequired
};

export default ServiceSelection;
