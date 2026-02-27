import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-brand-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        className={`
          w-full px-4 py-3 
          bg-white/50 backdrop-blur-sm text-metal-900
          border border-metal-200 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500
          transition-all duration-200 shadow-sm appearance-none cursor-pointer
          ${error ? 'border-red-500 focus:ring-red-500/50' : 'hover:border-metal-300'}
          ${className}
        `}
        {...props}
      >
        <option value="" disabled className="text-metal-400">Selecione...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-metal-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
};
