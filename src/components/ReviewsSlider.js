import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import { FaStar } from 'react-icons/fa';

// Sample reviews data
const reviews = [
  {
    name: "John Doe",
    review: "U4Rad Technology has transformed our operations. Highly recommended!",
    rating: 5,
  },
  {
    name: "Jane Smith",
    review: "Great service and support! The team is very responsive.",
    rating: 4,
  },
  {
    name: "Mike Johnson",
    review: "The software is user-friendly and has greatly improved efficiency.",
    rating: 4.5,
  },
  {
    name: "Sarah Williams",
    review: "I love the features! U4Rad Technology is the best in the market.",
    rating: 5,
  },
];

const getColor = () => {
  const colors = [
    'bg-gradient-to-r from-blue-400 to-blue-600',
    'bg-gradient-to-r from-green-400 to-green-600',
    'bg-gradient-to-r from-yellow-400 to-yellow-600',
    'bg-gradient-to-r from-pink-400 to-pink-600',
    'bg-gradient-to-r from-purple-400 to-purple-600',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const ReviewsSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    slidesToShow: 1,
    slidesToScroll: 1,
    afterChange: index => setCurrentIndex(index), // Update index on slide change
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % reviews.length);
    }, 3000); // Change review every 2 seconds

    return () => clearInterval(interval); // Clean up the interval on unmount
  }, []);

  return (
    <div className="reviews-slider mb-6 p-8 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gradient">Customer Reviews</h2>
      <Slider {...settings}>
        {reviews.map((review, index) => (
          <div key={index} className={`p-6 rounded-lg shadow-2xl transition-transform transform hover:scale-105 ${getColor()} border border-gray-200 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-opacity-25 bg-white transition-opacity duration-300 hover:bg-opacity-10 rounded-lg"></div>
            <h3 className="font-bold text-lg mb-2 text-white z-10">{review.name}</h3>
            <p className="mt-2 text-white text-sm z-10">{review.review}</p>
            <div className="flex items-center mt-2 z-10">
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ReviewsSlider;
