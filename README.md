# Camp-calculator-shyam


# U4rad Camp Calculator - User Guide & Implementation Reference

## Introduction
The U4rad Camp Calculator is a specialized application for planning and calculating costs for medical radiology camps. This README provides a comprehensive guide for users and developers implementing or extending the system.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Application Workflow](#application-workflow)
3. [Calculation Methodologies](#calculation-methodologies)
4. [Implementation Examples](#implementation-examples)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)

## Getting Started

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/u4rad-campcal.git
cd u4rad/campcal
```

2. Install frontend dependencies:
```bash
cd frontend/my-app
npm install
```

3. Install backend dependencies:
```bash
cd ../../backend
npm install
```

### Configuration
1. Set up your database connections in `backend/config/database.js`
2. Configure environment variables in `.env` file
3. Update service rates and calculation constants as needed

## Application Workflow

### 1. User Authentication
```javascript
const handleLogin = async (credentials) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
};
```

### 2. Camp Details Entry
Collect basic information about the medical camp:
- Company name
- Location
- Start and end dates
- Estimated number of participants

### 3. Service Selection
Choose from available radiology services:
- X-Ray (standard/premium)
- MRI (with/without contrast)
- Ultrasound (single organ/multiple organs)

```javascript
const handleServiceSelection = (services) => {
    setSelectedServices(services.map(service => ({
        name: service.name,
        package_name: service.package_name,
        base_price: service.price
    })));
};
```

### 4. Test Case Input
Enter expected usage volumes for each service:

```javascript
// Example test case input
const testCaseData = {
    "Package A": {
        totalCase: 100,
        services: [
            {
                service_name: "X-Ray",
                quantity: 2,
                specifications: {
                    type: "digital",
                    value: 500
                }
            }
        ]
    }
}; 
```

### 5. Cost Calculation
The system processes test case inputs to calculate costs:

```javascript
const calculatePackageCost = (packageData) => {
    const basePrice = packageData.tPrice;
    const markup = packageData.markup || 1;
    const revisedUnitPrice = basePrice / markup;
    const totalPrice = revisedUnitPrice * packageData.totalCase;
    
    return {
        revisedUnitPrice,
        totalPrice
    };
};
```

### 6. Summary Generation
```javascript
const generateSummary = () => {
    return {
        billing_number: generateBillingNumber(),
        company_details: campDetails,
        packages: Object.keys(packageData).map(pkg => ({
            name: pkg,
            services: packageData[pkg].services,
            total_cases: packageData[pkg].totalCase,
            unit_price: calculateRevisedUnitPrice(
                costDetails[pkg].tPrice,
                markup[pkg]
            ),
            total_price: calculateTotalPrice(
                revisedUnitPrice,
                packageData[pkg].totalCase
            )
        })),
        grand_total: calculateGrandTotal()
    };
};
```

## Calculation Methodologies

### Base Calculation Formulas
1. **Revised Unit Price** = Total Price ÷ Markup Value
2. **Total Price** = Revised Unit Price × Total Case Count
3. **Package Total** = Sum of all service costs within a package
4. **Grand Total** = Sum of all package totals + Taxes - Discounts

### Example Calculation Flow
```
Given:
- Base price for Package A: ₹1000
- Markup: 2
- Total cases: 5

Calculations:
1. Revised Unit Price = 1000 ÷ 2 = ₹500
2. Total Price = ₹500 × 5 = ₹2,500
```

### Volume Discount Tiers
- 100-199 cases: 5% discount
- 200-499 cases: 10% discount
- 500+ cases: 15% discount

### Tax Rates
- GST: 18%
- CGST: 9%
- SGST: 9%

## Implementation Examples

### Complete Calculation Flow Example

```javascript
// Example input data
const exampleCalculation = {
    // Input data
    testCase: {
        "Premium Package": {
            totalCase: 150,
            services: [
                {
                    service_name: "X-Ray",
                    quantity: 3,
                    specifications: { type: "digital" }
                },
                {
                    service_name: "MRI",
                    quantity: 1,
                    specifications: { type: "premium" }
                }
            ]
        }
    },

    // Service base rates
    serviceRates: {
        "X-Ray": 500,
        "MRI": 2000
    },

    // Calculation steps
    calculations: {
        "X-Ray": {
            baseCost: 500 * 3,          // 1500
            withSpecs: 1500             // No modification for digital
        },
        "MRI": {
            baseCost: 2000 * 1,         // 2000
            withSpecs: 2000 * 1.2       // 2400 (premium rate)
        },
        packageTotal: {
            rawTotal: 1500 + 2400,      // 3900
            withVolume: 3900 * 0.9,     // 3510 (bulk discount)
            finalPrice: 3510
        }
    }
};
```

### PDF Generation

```javascript
const generatePDF = (summaryData) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('U4RAD CAMP ESTIMATION', 105, 25, { align: 'center' });
    
    // Company Details
    doc.setFontSize(12);
    doc.text(`Company: ${summaryData.company_details.name}`, 14, 40);
    
    // Packages Table
    doc.autoTable({
        head: [['Package', 'Cases', 'Unit Price', 'Total']],
        body: summaryData.packages.map(pkg => [
            pkg.name,
            pkg.total_cases,
            pkg.unit_price.toFixed(2),
            pkg.total_price.toFixed(2)
        ])
    });
    
    return doc;
};
```

## API Reference

### Authentication Endpoints
- `POST /api/auth/login` - Authenticate user and receive token
- `POST /api/auth/register` - Create new user account
- `GET /api/auth/user` - Get current user details

### Camp Calculation Endpoints
- `POST /api/calculate-cost` - Submit calculation data and receive summary
- `GET /api/camps/:id` - Get camp details by ID
- `PUT /api/camps/:id` - Update camp information
- `DELETE /api/camps/:id` - Delete a camp

### Example API Call

```javascript
const submitCostCalculation = async (calculationData) => {
    try {
        const response = await fetch('/api/calculate-cost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                company_id: calculationData.companyId,
                test_cases: calculationData.testCases,
                calculations: calculationData.costDetails,
                total_amount: calculationData.grandTotal
            })
        });
        
        if (!response.ok) {
            throw new Error('Calculation submission failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in cost calculation:', error);
        throw error;
    }
};
```

## Best Practices

### Data Validation
Always validate inputs at both client and server levels:
- Ensure numeric values are positive
- Verify total cases are whole numbers
- Validate that markup values are greater than 0

### Error Handling
Implement comprehensive error handling:
- Return sensible defaults for edge cases (0 for invalid inputs)
- Provide clear error messages to users
- Log detailed errors on the server

### Performance Optimization
- Perform intensive calculations on the server
- Generate PDFs client-side
- Use efficient data structures for calculations
- Consider caching common calculation results

### Security Considerations
- Authenticate all API requests
- Validate and sanitize all inputs
- Implement rate limiting
- Set appropriate CORS policies
- Store sensitive data securely

### Testing
- Write unit tests for all calculation functions
- Test edge cases (zero values, extremely large numbers)
- Implement integration tests for the complete calculation flow
- Perform security testing and validation

## Conclusion
The U4rad Camp Calculator provides a robust solution for medical camp cost estimation. By following this guide, users and developers can effectively implement, use, and extend the system to meet specific requirements.






# U4rad Camp Calculator - Technical Documentation

## Project Overview
The U4rad Camp Calculator is a comprehensive system for medical camp management that handles service selection, cost calculation, and billing for radiology services. This README provides technical details about the application structure, calculation methodology, and implementation guidelines.

## Project Structure
```
U4rad/
├── campcal/
│   ├── frontend/
│   │   ├── my-app/
│   │   │   ├── src/
│   │   │   │   ├── components/
│   │   │   │   ├── api/
│   │   │   │   └── App.js
│   │   └── package.json
│   └── backend/   
```

## Application Flow
1. **User Authentication**
2. **Camp Details Entry**
3. **Service Selection**
4. **Test Case Input**
5. **Cost Calculation**
6. **Cost Summary Generation**
7. **PDF Generation**

## Core Calculation Logic

### Base Price Calculations

```javascript
/**
 * Calculate revised unit price based on total price and markup
 */
const calculateRevisedUnitPrice = (tPrice, markupValue) => {
    if (!tPrice || !markupValue) return 0;
    return Number((tPrice / markupValue).toFixed(2));
};

/**
 * Calculate total price based on revised unit price and total cases
 */
const calculateTotalPrice = (revisedUnitPrice, totalCase) => {
    if (!revisedUnitPrice || !totalCase) return 0;
    return Number((revisedUnitPrice * totalCase).toFixed(2));
};
```

### Service-Specific Calculations

```javascript
const serviceCalculations = {
    'X-Ray': (quantity, specifications) => {
        const basePrice = 500;
        const premiumMultiplier = specifications.type === 'premium' ? 1.2 : a1;
        return basePrice * quantity * premiumMultiplier;
    },

    'MRI': (quantity, specifications) => {
        const basePrice = 2000;
        const premiumMultiplier = specifications.type === 'premium' ? 1.3 : 1;
        const contrastMultiplier = specifications.contrast ? 1.5 : 1;
        return basePrice * quantity * premiumMultiplier * contrastMultiplier;
    },

    'Ultrasound': (quantity, specifications) => {
        const basePrice = 800;
        const organMultiplier = specifications.organs ? specifications.organs.length * 0.2 + 1 : 1;
        return basePrice * quantity * organMultiplier;
    }
};
```

### Package Cost Calculation

```javascript
const calculatePackageCosts = (packageData, costDetails) => {
    return Object.keys(packageData).map(packageName => {
        const { totalCase = 0, services = [] } = packageData[packageName];
        const { tPrice = 0 } = costDetails[packageName] || {};
        const packageMarkup = markup[packageName] || 1;
        
        const revisedUnitPrice = calculateRevisedUnitPrice(tPrice, packageMarkup);
        const totalPrice = calculateTotalPrice(revisedUnitPrice, totalCase);
        
        return {
            package_name: packageName,
            services,
            totalCase,
            tPrice,
            markup: packageMarkup,
            revisedUnitPrice,
            totalPrice
        };
    });
};
```

### Volume Discounts

```javascript
const calculateVolumeDiscount = (totalCase, basePrice) => {
    let discountPercentage = 0;
    
    if (totalCase >= 500) {
        discountPercentage = 0.15; // 15% discount
    } else if (totalCase >= 200) {
        discountPercentage = 0.10; // 10% discount
    } else if (totalCase >= 100) {
        discountPercentage = 0.05; // 5% discount
    }
    
    const discountAmount = basePrice * discountPercentage;
    return {
        discountPercentage,
        discountAmount,
        finalPrice: basePrice - discountAmount
    };
};
```

### Tax Calculations

```javascript
const calculateTaxes = (amount, state) => {
    const taxRates = {
        'GST': 0.18,
        'CGST': 0.09,
        'SGST': 0.09
    };
    
    return {
        baseAmount: amount,
        GST: amount * taxRates.GST,
        CGST: amount * taxRates.CGST,
        SGST: amount * taxRates.SGST,
        totalWithTax: amount * (1 + taxRates.GST)
    };
};
```

### Grand Total Calculation

```javascript
const calculateGrandTotal = (packages) => {
    const subtotal = packages.reduce((total, pkg) => {
        return total + pkg.totalPrice;
    }, 0);
    
    const taxes = calculateTaxes(subtotal, campDetails.state);
    const volumeDiscount = calculateVolumeDiscount(
        getTotalCases(packages),
        subtotal
    );
    
    return {
        subtotal,
        taxes: taxes.GST,
        discount: volumeDiscount.discountAmount,
        grandTotal: taxes.totalWithTax - volumeDiscount.discountAmount
    };
};
```

## State Management

```javascript
const [state, setState] = useState({
    isAuthenticated: false,
    campDetails: null,
    selectedServices: [],
    testCases: {},
    costDetails: {},
    summary: null
});
```

## Database Schema

```sql
CREATE TABLE companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    address TEXT,
    contact_details JSON
);

CREATE TABLE camps (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255),
    details JSON,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE calculations (
    billing_number VARCHAR(255) PRIMARY KEY,
    camp_id VARCHAR(255),
    calculation_details JSON,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cost_calculations (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255),
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    package_name VARCHAR(255),
    base_cost DECIMAL(10,2),
    discount_applied DECIMAL(5,2),
    final_price DECIMAL(10,2),
    test_case_details JSONB,
    service_breakdown JSONB,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

## Key Data Structures

### Camp Details
```typescript
interface CampData {
    companyName: string;
    location: string;
    dates: {
        start: Date;
        end: Date;
    };
    participants: number;
}
```

### Test Case Input
```typescript
interface TestCase {
    package_name: string;
    services: Array<{
        service_name: string;
        quantity: number;
        specifications: object;
    }>;
    totalCase: number;
}
```

### Cost Summary Format
```typescript
interface CostSummary {
    billing_number: string;
    company_details: {
        id: string;
        name: string;
        // other company details
    };
    packages: Array<{
        name: string;
        services: Array<{
            name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
        }>;
        base_cost: number;
        discount: number;
        final_price: number;
    }>;
    grand_total: number;
    calculation_date: string;
}
```

## PDF Generation

```javascript
const generatePDF = (summaryData) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('U4RAD CAMP ESTIMATION', 105, 25, { align: 'center' });
    
    // Company Details
    doc.setFontSize(12);
    doc.text(`Company: ${summaryData.company_details.name}`, 14, 40);
    
    // Packages Table
    doc.autoTable({
        head: [['Package', 'Cases', 'Unit Price', 'Total']],
        body: summaryData.packages.map(pkg => [
            pkg.name,
            pkg.total_cases,
            pkg.unit_price.toFixed(2),
            pkg.total_price.toFixed(2)
        ])
    });
    
    return doc;
};
```

## Calculation Constants

```javascript
export const CALCULATION_CONSTANTS = {
    MARKUP_RANGES: {
        STANDARD: 1,
        PREMIUM: 1.2,
        LUXURY: 1.5
    },
    
    VOLUME_DISCOUNTS: {
        TIER_1: { cases: 100, discount: 0.05 },
        TIER_2: { cases: 200, discount: 0.10 },
        TIER_3: { cases: 500, discount: 0.15 }
    },
    
    TAX_RATES: {
        GST: 0.18,
        CGST: 0.09,
        SGST: 0.09
    }
};
```

## Testing Utilities

```javascript
describe('Camp Calculator Tests', () => {
    test('calculateRevisedUnitPrice handles zero values', () => {
        expect(calculateRevisedUnitPrice(0, 1)).toBe(0);
        expect(calculateRevisedUnitPrice(100, 0)).toBe(0);
    });

    test('calculateTotalPrice with volume discount', () => {
        const result = calculateTotalPrice(1000, 150);
        expect(result).toBe(142500); // 150 cases with 5% discount
    });
});
```

## Important Considerations

- **Default Values**:
  - Markup defaults to 1 if not specified
  - Prices default to 0 if undefined
- **Validation**:
  - All numerical inputs must be positive
  - Markup cannot be 0
  - Total cases must be whole numbers
- **Precision**:
  - All price calculations are rounded to 2 decimal places
- **Error Handling**:
  - Returns 0 for invalid inputs
  - Handles undefined values gracefully
  - Prevents division by zero

## Additional Notes
- All calculations are performed server-side for security
- PDF generation happens client-side for performance
- Data is validated at both client and server levels
- State persists in localStorage until final submission
- Automatic session timeout after 30 minutes of inactivity
