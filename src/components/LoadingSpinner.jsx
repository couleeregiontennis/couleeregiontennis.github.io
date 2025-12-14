import React from 'react';
import '../styles/LoadingSpinner.css';

export const LoadingSpinner = ({ size = 'sm', className = '' }) => {
  return (
    <span
      className={`loading-spinner spinner-${size} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="visually-hidden">Loading...</span>
    </span>
  );
};
