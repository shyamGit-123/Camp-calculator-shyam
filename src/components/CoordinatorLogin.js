import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { loginAsCoordinator,loginAsCustomer,signupUser } from "./api";

function CoordinatorLogin({ onLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    password: "",
    companyName: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false); // Manage visibility of signup form
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate(); // Navigation hook

  // Fixed coordinator credentials

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage(""); // Reset error message on input change
  };

  const handleSignupChange = (e) => {
    setSignupData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = formData;

    try {
      const { role, username: user } = await loginAsCoordinator(username, password);
      localStorage.setItem("role", role);
      localStorage.setItem("username", user);
      onLogin(role);
      navigate("/dashboard");
    } catch (error) {
      await handleCustomerLogin(username, password);
    }
  };

 
  
  const handleCustomerLogin = async (username, password) => {
    try {
      const { role, username: user, companyName } = await loginAsCustomer(username, password);
      localStorage.setItem("role", role);
      localStorage.setItem("username", user);
      localStorage.setItem("companyName", companyName);
      onLogin(role);
      navigate("/customer-dashboard", { state: { companyName } });
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const { username, password, companyName } = signupData;

    try {
      const successMessage = await signupUser(username, password, companyName);
      alert(successMessage);
      setShowSignup(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {showSignup ? "Sign Up" : "Login"}
        </h2>
        {errorMessage && (
          <div className="mb-4 text-red-500 text-sm">{errorMessage}</div>
        )}
        <form
          className="flex flex-col gap-y-5"
          onSubmit={showSignup ? handleSignupSubmit : handleOnSubmit}
        >
          <label className="w-full">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Username/Email <sup className="text-red-500">*</sup>
            </p>
            <input
              required
              type="text"
              name="username"
              value={showSignup ? signupData.username : formData.username}
              onChange={showSignup ? handleSignupChange : handleOnChange}
              placeholder="Enter username or email"
              className="w-full h-12 rounded-md border border-gray-300 p-4 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
          </label>
          <label className="relative">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Password <sup className="text-red-500">*</sup>
            </p>
            <input
              required
              type={showPassword ? "text" : "password"}
              name="password"
              value={showSignup ? signupData.password : formData.password}
              onChange={showSignup ? handleSignupChange : handleOnChange}
              placeholder="Enter Password"
              className="w-full h-12 rounded-md border border-gray-300 p-4 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <span
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-[40px] z-[10] cursor-pointer"
            >
              {showPassword ? (
                <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" />
              ) : (
                <AiOutlineEye fontSize={24} fill="#AFB2BF" />
              )}
            </span>
          </label>

          {showSignup && (
            <label className="w-full">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Company Name <sup className="text-red-500">*</sup>
              </p>
              <input
                required
                type="text"
                name="companyName"
                value={signupData.companyName}
                onChange={handleSignupChange}
                placeholder="Enter your company name"
                className="w-full h-12 rounded-md border border-gray-300 p-4 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
            </label>
          )}

          <div className="flex flex-col gap-y-4">
            <button
              type="submit"
              className="mt-6 rounded-md bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700 transition duration-200"
            >
              {showSignup ? "Sign Up" : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CoordinatorLogin;
