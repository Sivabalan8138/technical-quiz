import React from 'react';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Type your detailed answer here...'}
        className="w-full h-64 p-4 text-gray-800 bg-transparent resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default RichTextEditor;
