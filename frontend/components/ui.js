import React from 'react';

export function Button({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`border rounded-lg shadow-sm p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="space-y-4">{children}</div>;
}

export function Input({ placeholder, value, onChange, className = "" }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}

export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children }) {
  return <tr>{children}</tr>;
}

export function TableCell({ children }) {
  return <td className="px-6 py-4 whitespace-nowrap">{children}</td>;
} 