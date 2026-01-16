import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-900 mb-1">
        {label}
      </label>
      <input
        className={`
          w-full px-3 py-2 
          bg-white text-black placeholder-gray-400
          border border-gray-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-sugar-green-600 focus:border-transparent
          disabled:bg-gray-100 disabled:text-gray-500
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
};
