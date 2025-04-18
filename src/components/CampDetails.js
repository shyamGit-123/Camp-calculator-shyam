import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createCompany, createCamp } from './api';
import { FaCalendarAlt } from 'react-icons/fa';

const CampDetails = ({ onNext }) => {
  const [companyName, setCompanyName] = useState('');
  const [companyDistrict, setCompanyDistrict] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [companyPinCode, setCompanyPinCode] = useState('');
  const [companyLandmark, setCompanyLandmark] = useState('');
  const [camps, setCamps] = useState([]);
  const [campLocation, setCampLocation] = useState('');
  const [campDistrict, setCampDistrict] = useState('');
  const [campState, setCampState] = useState('');
  const [campPinCode, setCampPinCode] = useState('');
  const [campLandmark, setCampLandmark] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddCamp = () => {
    if (campLocation && campDistrict && campState && campPinCode && campLandmark && startDate && endDate && endDate >= startDate) {
      const newCamp = {
        campLocation,
        campDistrict,
        campState,
        campPinCode,
        campLandmark,
        startDate,
        endDate,
      };
      setCamps([...camps, newCamp]);
      // Reset form fields
      setCampLocation('');
      setCampDistrict('');
      setCampState('');
      setCampPinCode('');
      setCampLandmark('');
      setStartDate(null);
      setEndDate(null);
      setError('');
    } else {
      setError('Please fill out all fields before adding a camp.');
    }
  };

  const handleSubmit = async () => {
    if (!companyName || !companyDistrict || !companyState || !companyPinCode || !companyLandmark || camps.length === 0) {
      setError('Please fill out all fields and add at least one camp.');
      return;
    }
   
    setIsSubmitting(true);

    try {
      const companyData = {
        name: companyName,
        district: companyDistrict,
        state: companyState,
        pin_code: companyPinCode,
        landmark: companyLandmark,
      };
      const company = await createCompany(companyData);

      await Promise.all(camps.map((camp) => {
        const campData = {
          location: camp.campLocation,
          district: camp.campDistrict,
          state: camp.campState,
          pin_code: camp.campPinCode,
          landmark: camp.campLandmark,
          start_date: camp.startDate.toISOString().split('T')[0],
          end_date: camp.endDate.toISOString().split('T')[0],
          company: company.id,
        };
        return createCamp(campData);
      }));

      onNext({
        companyName,
        companyDistrict,
        companyState,
        companyPinCode,
        companyLandmark,
        camps,
        companyId: company.id,
      });

    } catch (err) {
      console.error('Error submitting data:', err);
      setError('Failed to submit data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h2 className="text-3xl font-semibold mb-6">Camp Details</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <input
        type="text"
        placeholder="Company Name"
        className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Flat, House no., Building, Company, Apartment"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={companyDistrict}
          onChange={(e) => setCompanyDistrict(e.target.value)}
        />
        <input
          type="text"
          placeholder="Area, Street, Sector, Village"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={companyState}
          onChange={(e) => setCompanyState(e.target.value)}
        />
        <input
          type="number"
          placeholder="Pin Code"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={companyPinCode}
          onChange={(e) => setCompanyPinCode(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <input
          type="text"
          placeholder="state"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={companyLandmark}
          onChange={(e) => setCompanyLandmark(e.target.value)}
        />
      </div>

      <h3 className="text-2xl font-semibold mt-6 mb-4">Add Camp</h3>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Camp Location"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campLocation}
          onChange={(e) => setCampLocation(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp District"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campDistrict}
          onChange={(e) => setCampDistrict(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp State"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campState}
          onChange={(e) => setCampState(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp Pin Code"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campPinCode}
          onChange={(e) => setCampPinCode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp Landmark"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campLandmark}
          onChange={(e) => setCampLandmark(e.target.value)}
        />
       <div className="mb-4 flex space-x-2">
  <div className="flex-1 relative">
    <DatePicker
      selected={startDate}
      onChange={(date) => setStartDate(date)}
      dateFormat="yyyy-MM-dd"
      placeholderText="Start Date"
      className="border rounded-lg p-3 mb-2 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      minDate={new Date()} // Disable previous dates
    />
    <FaCalendarAlt className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500" />
  </div>
  <div className="flex-1 relative">
    <DatePicker
      selected={endDate}
      onChange={(date) => setEndDate(date)}
      dateFormat="yyyy-MM-dd"
      placeholderText="End Date"
      className="border rounded-lg p-3 mb-2 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      minDate={startDate || new Date()} // Ensure end date is after start date
    />
    <FaCalendarAlt className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500" />
  </div>
</div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
          onClick={handleAddCamp}
        >
          Add Camp
        </button>
      </div>

      <h4 className="text-xl font-semibold mt-6 mb-4">Camps Added</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {camps.map((camp, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md">
            <h5 className="text-lg font-semibold">{camp.campLocation}</h5>
            <p>{camp.campDistrict}, {camp.campState}</p>
            <p>Pin Code: {camp.campPinCode}</p>
            <p>Landmark: {camp.campLandmark}</p>
            <p>Start Date: {camp.startDate.toISOString().split('T')[0]}</p>
            <p>End Date: {camp.endDate.toISOString().split('T')[0]}</p>
          </div>
        ))}
      </div>

      <button
        className={`bg-green-600 text-white px-4 py-2 mt-6 rounded-lg shadow-md hover:bg-green-700 transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
      </button>
    </div>
  );
};

export default CampDetails;
