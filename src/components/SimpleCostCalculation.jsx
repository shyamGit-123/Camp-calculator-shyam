import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from "jspdf";

function SimpleCostCalculation({ caseData, onSubmit,campDetails,username}) {
  const [priceRanges, setPriceRanges] = useState({});
  const [subserviceCosts, setSubserviceCosts] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [partnerMargin, setPartnerMargin] = useState(0); // New state for partner margin
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  console.log(campDetails)
  console.log(username)
  useEffect(() => {
    console.log('caseData:', caseData);
  }, [caseData]);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const [priceResponse, subserviceResponse] = await Promise.all([
          axios.get('http://15.206.159.215:8000/api/prices/'),
          axios.get('http://15.206.159.215:8000/api/service_costs/'),
        ]);

        const priceData = priceResponse.data.reduce((acc, service) => {
          acc[service.name] = service.price_ranges.map(range => ({
            maxCases: range.max_cases,
            pricePerCase: parseFloat(range.price),
          }));
          return acc;
        }, {});

        const subserviceData = subserviceResponse.data.reduce((acc, service) => {
          if (['CBC', 'Complete Hemogram', 'Hemoglobin', 'Urine Routine', 'Stool Examination', 'Lipid Profile', 'Kidney Profile', 'LFT', 'KFT', 'Random Blood Glucose', 'Blood Grouping'].includes(service.test_type_name)) {
            acc[service.test_type_name] = {
              salary: parseFloat(service.salary),
              incentive: parseFloat(service.incentive),
              misc: parseFloat(service.misc),
              equipment: parseFloat(service.equipment),
              reporting: parseFloat(service.reporting),
            };
          }
          return acc;
        }, {});

        setPriceRanges(priceData);
        setSubserviceCosts(subserviceData);
        setInitialized(true);
      } catch (error) {
        console.error('Error fetching service prices or costs:', error);
      }
    };

    if (!initialized) {
      fetchServiceData();
    }
  }, [initialized]);

  const calculateTotalPrice = (service, totalCase) => {
    if (subserviceCosts.hasOwnProperty(service)) {
      const { salary, incentive, misc, equipment, reporting } = subserviceCosts[service] || {};
      return (salary + incentive + misc + equipment + reporting) * totalCase;
    } else {
      const ranges = priceRanges[service] || [];
      let pricePerCase = 0;

      for (let i = 0; i < ranges.length; i++) {
        if (totalCase <= ranges[i].maxCases) {
          pricePerCase = ranges[i].pricePerCase;
          break;
        }
      }
      const reportTypeCost = caseData[service]?.reportTypeCost || 0;
      return (totalCase * pricePerCase) + reportTypeCost;
    }
  };

  const calculateGrandTotal = () => {
    const total = Object.keys(caseData).reduce((total, service) => {
      const totalCase = caseData[service]?.totalCase || 0;
      return total + calculateTotalPrice(service, totalCase);
    }, 0);
    return total * ((100 + partnerMargin) / 100) * ((100 - discount) / 100);
  };
  const calculateTotalCases = () => {
    return Object.keys(caseData).reduce((maxCases, service) => {
      const totalCase = caseData[service]?.totalCase || 1;
      return Math.max(maxCases, totalCase); // Find the maximum case value
    }, 0); // Start with 0 as the initial maximum
  };
  

  const handleCouponSubmit = async () => {
    try {
      const response = await axios.get(`http://15.206.159.215:8000/api/api/validate-coupon/${couponCode}/`);
      setDiscount(response.data.discount_percentage);
      setError('');
    } catch (error) {
      setDiscount(0);
      setError('Invalid coupon code');
    }
  };
  

  const handleSubmit = async () => {
    const costData = Object.keys(caseData).map(service => ({
      service_name: service,
      total_cases: caseData[service]?.totalCase || 0,
    }));
  
    const postData = {
      company_name: campDetails.companyName,
      grand_total: grandTotal.toFixed(2),
      super_company:username,
      services: costData,
    };
  
    try {
      await axios.post('http://15.206.159.215:8000/api/company-details/', postData);
      onSubmit(costData);
      navigate('/CoordinatorLogin');
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };

  const grandTotal = calculateGrandTotal();
  const totalCases = calculateTotalCases();
  const perCasePrice = totalCases > 0 ? grandTotal / totalCases : 0;
  const generatePDF = () => {
    const doc = new jsPDF('l', 'mm', 'a3');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const rowHeight = 12;
    const headerHeight = 10;
    const sectionSpacing = 14;
    
    // Column widths
    const columnWidths = [40, 60, 60, 40, 35, 45, 45];

    // Set title
    doc.setFontSize(30);
    doc.setTextColor(0, 102, 204);
    doc.text("Xrai", margin, margin);

    // Company Details Section
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("Company Details", margin, margin + 25);
    doc.setFontSize(18);
    const companyDetails = [
        { label: "Company Name", value: campDetails.companyName },
        { label: "Company Address", value: `${campDetails.companyLandmark}, ${campDetails.companyDistrict}, ${campDetails.companyState} - ${campDetails.companyPinCode}` },
    ];

    let currentY = margin + 37;
    doc.setFont("Helvetica", "bold");
    companyDetails.forEach(detail => {
        doc.text(`${detail.label}: ${detail.value}`, margin, currentY);
        currentY += rowHeight + 4; // Increased spacing for readability
    });

    // Camps Section
    doc.setFontSize(22);
    currentY += sectionSpacing;
    doc.text("Camps", margin, currentY);
    const camps = campDetails.camps;

    // Draw Camps Details in Single Line
    camps.forEach(camp => {
        const campDetailsLine = `Camp: ${camp.campDistrict}, ${camp.campLocation}, ${camp.campLandmark}, ${camp.campState}, ${camp.campPinCode}, Start Date: ${new Date(camp.startDate).toLocaleDateString()}, End Date: ${new Date(camp.endDate).toLocaleDateString()}`;
        currentY += rowHeight + 11;
        doc.text(campDetailsLine, margin, currentY);
    });

    // Service Costs Section
    doc.setFontSize(22);
    currentY += sectionSpacing;
    doc.text("Service Costs", margin, currentY);

    // Draw Service Costs Table Header
    const serviceHeaders = ["Service", "Total Cases"];
    const serviceHeaderY = currentY + 17;

    // Header background color
    doc.setFillColor(0, 153, 255);
    doc.rect(margin, serviceHeaderY - headerHeight, pageWidth - 2 * margin, headerHeight, 'F');
    doc.setFont("Helvetica", "bold");
    serviceHeaders.forEach((header, index) => {
        const xPos = margin + index * 100; 
        doc.setTextColor(255, 255, 255); // White text color for headers
        doc.text(header, xPos + 2, serviceHeaderY);
    });

    // Draw Service Costs Rows with alternating colors and increased spacing
    let serviceStartY = serviceHeaderY + 8;
    Object.keys(caseData).forEach((service, index) => {
        if (serviceStartY + rowHeight > doc.internal.pageSize.height - margin) {
            doc.addPage();
            serviceStartY = margin;
        }
        const totalCase = caseData[service]?.totalCase || 0;
        doc.setFillColor(index % 2 === 0 ? 240 : 255); // Alternating row colors
        doc.rect(margin, serviceStartY, pageWidth - 2 * margin, rowHeight, 'F');
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Reset text color for content
        doc.text(service, margin + 2, serviceStartY + 8);
        doc.text(totalCase.toString(), margin + 100, serviceStartY + 8); 
        serviceStartY += rowHeight + 4;
    });

    // Calculate Grand Total and Per-Case Price
    const grandTotal = calculateGrandTotal();
    const totalCases = calculateTotalCases();
    const perCasePrice = totalCases > 0 ? grandTotal / totalCases : 0;

    // Grand Total Section
    doc.setFontSize(22);
    doc.setFont("Helvetica", "bold");
    currentY = serviceStartY + sectionSpacing;
    doc.setTextColor(0, 102, 204);
    doc.text(`Grand Total: ${grandTotal.toFixed(0)}`, margin, currentY);
    doc.text(`Per-Case Price: ${perCasePrice.toFixed(0)}`, margin, currentY + 10);

    // Save PDF
    doc.save("xraidigitalcampcalculator.pdf");
};


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
     <h2 className="text-4xl font-extrabold mb-6 text-blue-600 text-center shadow-lg p-4 rounded-md bg-gray-50 border border-gray-200">
  XRAI
</h2>

      <div className="space-y-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Test Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Total Cases</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(caseData).map(service => {
              const totalCase = caseData[service]?.totalCase || 0;
              return (
                <tr key={service} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{service}</td>
                  <td className="px-4 py-3">{totalCase}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4">
          <label htmlFor="coupon" className="block text-sm font-medium text-gray-700">
            Discount Coupon
          </label>
          <div className="flex items-center mt-1">
            <input
              type="text"
              id="coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="mt-1 p-2 border border-gray-300 rounded-md w-full"
            />
            <button
              onClick={handleCouponSubmit}
              className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Apply
            </button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        <div>
        <label htmlFor="partnerMargin" className="block text-gray-700">Partner Margin (%):</label>
        <input
          type="number"
          id="partnerMargin"
          value={partnerMargin}
          onChange={(e) => setPartnerMargin(parseFloat(e.target.value) || 0)}
          className="border border-gray-300 rounded-md p-2 mb-4"
        />
      </div>

        <div className="mt-4 flex justify-between items-center border-t pt-4">
          <div className="text-lg font-bold text-gray-800">
            Grand Total: ₹{grandTotal.toFixed(0)}
          </div>
          <div className="text-lg font-bold text-gray-800">
          Per-Case Price: ₹{perCasePrice.toFixed(0)}
          </div>
        </div>
        <div>
  <button
    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
    onClick={generatePDF}
  >
    Generate PDF
  </button>
</div>

        <div className="flex justify-between mt-4">
          <Link to="/login">
            <button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
            >
              Logout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SimpleCostCalculation;
