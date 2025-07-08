import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Calendar = ({ 
  selectedDate, 
  onDateSelect, 
  minDate,
  maxDate,
  disabledDates = [],
  className = "" 
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const today = new Date();
  const minSelectableDate = minDate ? new Date(minDate) : today;

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateDisabled = (date) => {
    if (date < minSelectableDate) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    
    const dateString = date.toISOString().split('T')[0];
    return disabledDates.includes(dateString);
  };

  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.toDateString() === new Date(selectedDate).toDateString();
  };

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(date)) {
      onDateSelect?.(date.toISOString().split('T')[0]);
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const selected = isSelected(date);
      const todayClass = isToday(date);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-colors
            ${disabled 
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
              : 'text-gray-900 dark:text-white hover:bg-purple-100 dark:hover:bg-purple-800'
            }
            ${selected 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : ''
            }
            ${todayClass && !selected 
              ? 'bg-yellow-600 text-white font-bold' 
              : ''
            }
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-600 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-600 rounded"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;