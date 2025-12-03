import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FixedDatePicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = '选择日期',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const formatted = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideInput = dropdownRef.current && dropdownRef.current.contains(target);
      const insidePortal = portalRef.current && portalRef.current.contains(target);
      if (!insideInput && !insidePortal) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(false);
    };
    const handleScroll = (e: Event) => {
      const target = e.target as Node;
      if (portalRef.current && portalRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    onChange(dateStr);
    setCurrentMonth(date);
    inputRef.current?.blur();
  };

  const handleInputClick = () => {
    if (inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 400; // 预估下拉框高度

      const spaceBelow = viewportHeight - inputRect.bottom - 20;
      const spaceAbove = inputRect.top - 20;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
        setCoords({ top: inputRect.top - dropdownHeight - 4, left: inputRect.left, width: inputRect.width });
      } else {
        setDropdownPosition('bottom');
        setCoords({ top: inputRect.bottom + 4, left: inputRect.left, width: inputRect.width });
      }
    }
    setIsOpen(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    const days = [];
    const emptyDays = Array(firstDay).fill(null);
    days.push(...emptyDays);

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  const today = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        readOnly
        onClick={handleInputClick}
        placeholder={placeholder}
        className="w-full px-3 py-2 border-2 border-black rounded-md text-sm bg-white text-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all cursor-pointer"
      />

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
          className="z-[9999] bg-white border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 max-h-80 overflow-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </button>

            <div className="font-bold text-sm text-gray-900">
              {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </div>

            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-600 p-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {generateCalendar().map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-1" />;
              }

              const isToday = date.toDateString() === today.toDateString();
              const isSelected = value && date.toDateString() === new Date(value).toDateString();

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`p-1 text-xs rounded transition-all ${
                    isSelected
                      ? 'bg-yellow-200 border border-black text-black font-bold'
                      : isToday
                      ? 'bg-yellow-100 border border-yellow-600 text-gray-900 font-medium'
                      : 'hover:bg-gray-100 border border-transparent text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-200 flex justify-center">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="px-3 py-1 text-xs bg-yellow-100 border border-black rounded-md hover:bg-yellow-200 transition-colors"
            >
              今天
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
