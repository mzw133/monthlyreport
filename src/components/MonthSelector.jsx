import React from 'react';

export default function MonthSelector({ 
  months, 
  startMonth, 
  endMonth, 
  onStartMonthChange, 
  onEndMonthChange 
}) {
  // Default to 'single' mode
  const [mode, setMode] = React.useState('single');

  // Handle mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'single') {
      // In single mode, set both start and end to the current end month
      onStartMonthChange(endMonth);
      onEndMonthChange(endMonth);
    }
  };

  // Handle month selection
  const handleMonthChange = (month) => {
    if (mode === 'single') {
      // In single mode, set both start and end to the selected month
      onStartMonthChange(month);
      onEndMonthChange(month);
    } else {
      // In range mode, update start month and ensure end month is not before it
      onStartMonthChange(month);
      if (months.indexOf(month) > months.indexOf(endMonth)) {
        onEndMonthChange(month);
      }
    }
  };

  // Handle end month selection in range mode
  const handleEndMonthChange = (month) => {
    onEndMonthChange(month);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm space-y-4">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">
          {mode === 'single' ? 'Einzelmonat' : 'Zeitraum'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={mode === 'range'}
          onClick={() => handleModeChange(mode === 'single' ? 'range' : 'single')}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            ${mode === 'range' ? 'bg-primary-600' : 'bg-gray-200'}
          `}
        >
          <span className="sr-only">Zeitraum aktivieren</span>
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${mode === 'range' ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Month Selection */}
      <div className="flex items-center gap-4">
        {mode === 'single' ? (
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monat
            </label>
            <select
              value={endMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von
              </label>
              <select
                value={startMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bis
              </label>
              <select
                value={endMonth}
                onChange={(e) => handleEndMonthChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                disabled={!startMonth}
              >
                {months
                  .filter((month) => months.indexOf(month) >= months.indexOf(startMonth))
                  .map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 