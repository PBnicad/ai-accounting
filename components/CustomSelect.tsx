import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<Props> = ({
  value,
  onChange,
  options,
  placeholder = '请选择',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideSelect = selectRef.current && selectRef.current.contains(target);
      const insidePortal = portalRef.current && portalRef.current.contains(target);
      if (!insideSelect && !insidePortal) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange(options[highlightedIndex]);
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectedOption = options.find(opt => opt === value);

  return (
    <div ref={selectRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (selectRef.current) {
            const rect = selectRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const dropdownHeight = 240; // 估计下拉高度
            const spaceBelow = viewportHeight - rect.bottom - 20;
            const spaceAbove = rect.top - 20;
            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
              setPosition('top');
              setCoords({ top: rect.top - dropdownHeight - 4, left: rect.left, width: rect.width });
            } else {
              setPosition('bottom');
              setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
            }
          }
          setIsOpen(prev => !prev);
        }}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border-2 border-black rounded-md text-sm bg-white text-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all flex items-center justify-between hover:border-gray-600"
      >
        <span className="truncate">{selectedOption || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
          className="z-[9999] bg-white border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-60 overflow-y-auto"
        >
          {options.map((option, index) => (
            <div
              key={option}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                option === value
                  ? 'bg-yellow-100 text-black font-medium'
                  : 'hover:bg-gray-100 text-gray-900'
              } ${
                highlightedIndex === index
                  ? 'bg-yellow-50'
                  : ''
              }`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>, document.body
      )}
    </div>
  );
};
