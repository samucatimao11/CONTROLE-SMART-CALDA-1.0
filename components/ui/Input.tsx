import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-brand-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        className={`
          w-full px-4 py-3 
          bg-white/50 backdrop-blur-sm text-metal-900 placeholder-metal-400
          border border-metal-200 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500
          disabled:bg-metal-100 disabled:text-metal-400 disabled:cursor-not-allowed
          transition-all duration-200 shadow-sm
          ${error ? 'border-red-500 focus:ring-red-500/50' : 'hover:border-metal-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
};
