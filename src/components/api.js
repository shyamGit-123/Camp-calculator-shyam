import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';
const BASE_URL = "http://127.0.0.1:8000/api/users/";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
      'Content-Type': 'application/json'
  }
});

export const createCompany = async(companyData) => {
    try {
        const response = await axios.post(`${API_URL}companies/`, companyData);
        return response.data;
    } catch (error) {
        console.error('Error creating company:', error);
        throw error;
    }
};

export const createCamp = async(campData) => {
    try {
        const response = await axios.post(`${API_URL}camps/`, campData);
        return response.data;
    } catch (error) {
        console.error('Error creating camp:', error);
        throw error;
    }
};

// export const creatservices = async (data) => {
//   try {
//     const response = await axios.post("http://localhost:8000/api/service-selection/", data);
//     return { success: true, data: response.data };
//   } catch (error) {
//     console.error('Error in creatservices API call:', error);
//     if (error.response && error.response.status === 405) {
//       return { 
//         success: false, 
//         error: 'API endpoint method not allowed. Please check API configuration.' 
//       };
//     }
//     return { 
//       success: false, 
//       error: error.response?.data?.error || 'Failed to save services'
//     };
//   }
// };
// /api/service-selection/create_services/

export const creatservices = async (data) => {
  try {
    const response = await api.post('/api/service-selection/', {
      company_id: data.company_id,
      packages: data.packages  // Your data is already using the 'packages' name
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to save services');
  }
};


export const fetchHardCopyPrices = async() => {
    try {
        const response = await axios.get(`${API_URL}copyprice/`);
        return response.data.reduce((acc, service) => {
            acc[service.name] = parseFloat(service.hard_copy_price);
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching hard copy prices:', error);
        throw error; // Rethrow the error for handling in the component
    }
};

export const saveTestCaseData = async(payload) => {
    try {
        await axios.post(`http://localhost:8000/api/test-case-data/`, payload);
    } catch (error) {
        console.error('Error saving test case data:', error);
        throw error; // Rethrow the error for handling in the component
    }
};


// Get service costs
export const getServiceCosts = async (companyId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/service_costs/`);
    if (!response.ok) throw new Error('Failed to fetch service costs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching service costs:', error);
    throw error;
  }
};

// Submit cost details
export const submitCostDetails = async (companyId, costDetails) => {
  try {
      const response = await axios.post(`http://localhost:8000/api/cost_details/`, {
          company_id: companyId,
          packages: costDetails.packages
      });
      return response.data;
  } catch (error) {
      console.error('Error submitting cost details:', error);
      throw error;
  }
};

//submoit cost summary screen details
export const submitCostSummary = async(data) => {
    try {
        const response = await axios.post(`http://127.0.0.1:8000/api/costsummaries`, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data; // Return the response data
    } catch (error) {
        console.error('Error submitting data:', error);
        throw error; // Rethrow the error for handling in the calling function
    }
};

export const loginAsCoordinator = async(username, password) => {
    const coordinatorCredentials = {
        username: "campcalculator@123",
        password: "camp15042002",
    };

    if (username === coordinatorCredentials.username && password === coordinatorCredentials.password) {
        return { role: "Coordinator", username };
    } else {
        throw new Error("Invalid coordinator credentials.");
    }
};

export const loginAsCustomer = async(username, password) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error("Unable to fetch users.");
        }

        const users = await response.json();
        const matchedUser = users.find(
            (user) => user.username === username && user.password === password
        );

        if (matchedUser) {
            return {
                role: "Customer",
                username: matchedUser.username,
                companyName: matchedUser.company_name,
            };
        } else {
            throw new Error("Invalid customer credentials.");
        }
    } catch (error) {
        throw new Error("Error fetching customer details: " + error.message);
    }
};

export const signupUser = async(username, password, companyName) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
                company_name: companyName, // Use the correct key
            }),
        });

        if (!response.ok) {
            throw new Error('Signup failed');
        }

        return "Signup successful! You can now log in.";
    } catch (error) {
        throw new Error("Error during signup: " + error.message);
    }
};