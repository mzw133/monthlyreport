import React, { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const DateRangePicker = ({ onRangeChange }) => {
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM yyyy', { locale: de }));
  const [startMonth, setStartMonth] = useState(format(new Date(), 'MMMM yyyy', { locale: de }));
  const [endMonth, setEndMonth] = useState(format(new Date(), 'MMMM yyyy', { locale: de }));

  // Generate list of months (last 24 months)
  const getMonthsList = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 24; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(format(date, 'MMMM yyyy', { locale: de }));
    }
    return months;
  };

  const handleModeChange = (mode) => {
    setIsRangeMode(mode === 'range');
    if (mode === 'single') {
      onRangeChange({ startMonth: selectedMonth, endMonth: selectedMonth });
    } else {
      onRangeChange({ startMonth, endMonth });
    }
  };

  const handleSingleMonthChange = (month) => {
    setSelectedMonth(month);
    onRangeChange({ startMonth: month, endMonth: month });
  };

  const handleStartMonthChange = (month) => {
    setStartMonth(month);
    if (new Date(month) > new Date(endMonth)) {
      setEndMonth(month);
      onRangeChange({ startMonth: month, endMonth: month });
    } else {
      onRangeChange({ startMonth: month, endMonth });
    }
  };

  const handleEndMonthChange = (month) => {
    setEndMonth(month);
    if (new Date(month) < new Date(startMonth)) {
      setStartMonth(month);
      onRangeChange({ startMonth: month, endMonth: month });
    } else {
      onRangeChange({ startMonth, endMonth: month });
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Zeitraum auswählen</h2>
      
      {/* Toggle Buttons */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6 w-fit">
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors ${
            !isRangeMode
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => handleModeChange('single')}
        >
          Einzelmonat
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors ${
            isRangeMode
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => handleModeChange('range')}
        >
          Zeitraum
        </button>
      </div>

      {!isRangeMode ? (
        // Single Month Selection
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monat
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleSingleMonthChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {getMonthsList().map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        // Date Range Selection
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Von
            </label>
            <select
              value={startMonth}
              onChange={(e) => handleStartMonthChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {getMonthsList().map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bis
            </label>
            <select
              value={endMonth}
              onChange={(e) => handleEndMonthChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {getMonthsList()
                .filter((month) => new Date(month) >= new Date(startMonth))
                .map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker; 