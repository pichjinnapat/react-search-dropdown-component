import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import SearchIcon from './icons/SearchIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import { OptionType } from '../types';

type SearchDropdownProps = {
  options:
    | (string | OptionType)[]
    | ((inputValue: string) => Promise<(string | OptionType)[]>);
  className?: HTMLDivElement['className'];
  label?: string;
  description?: string;
  disabled?: boolean;
  debounce?: number;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  isLoading?: boolean;
  onSelectedChange?: (items: (string | OptionType)[]) => void;
  selectedItems?: (string | OptionType)[];
};

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  options,
  label,
  description,
  className,
  disabled = false,
  debounce = 0,
  inputProps,
  onSelectedChange,
  selectedItems,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<(string | OptionType)[]>(
    typeof options === 'function' ? [] : options,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let delayDebounceFn = setTimeout(() => {
      if (typeof options === 'function') {
        if (!searchTerm) {
          setSearchResults([]);
          return;
        }
        setIsLoading(true);
        options(searchTerm).then((results) => {
          setSearchResults(results);
          setIsLoading(false);
        });
      } else if (searchTerm) {
        const filteredOptions = options.filter((option) => {
          if (!searchTerm) return true;

          if (typeof option === 'string') {
            return option.toLowerCase().includes(searchTerm.toLowerCase());
          } else {
            return (
              option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              option.value.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
        });
        setSearchResults(filteredOptions);
      } else {
        setSearchResults(options);
      }
    }, debounce);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounce, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelectItem = (item: string | OptionType) => {
    if (typeof item === 'string') {
      if (!selectedItems?.includes(item)) {
        onSelectedChange?.([...(selectedItems as string[]), item]);
      } else {
        onSelectedChange?.(
          selectedItems?.filter((selectedItem) => selectedItem !== item),
        );
      }
    } else {
      if (
        !selectedItems?.some(
          (selectedItem) => (selectedItem as OptionType).value === item.value,
        )
      ) {
        onSelectedChange?.([...(selectedItems as OptionType[]), item]);
      } else {
        onSelectedChange?.(
          selectedItems?.filter(
            (selectedItem) => (selectedItem as OptionType).value !== item.value,
          ),
        );
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && highlightedIndex < options.length - 1) {
      setHighlightedIndex((prev) => prev + 1);
    } else if (event.key === 'ArrowUp' && highlightedIndex > 0) {
      setHighlightedIndex((prev) => prev - 1);
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      handleSelectItem(
        typeof options === 'function'
          ? searchResults[highlightedIndex]
          : options[highlightedIndex],
      );
    } else if (event.key === 'Escape') {
      setHighlightedIndex(-1);
      setIsOpen(false);
    }
  };

  return (
    <div className={className} ref={dropdownRef}>
      <div className='w-full flex flex-col'>
        {label && (
          <label htmlFor='input' className='text-lg dark:text-white'>
            {label}
          </label>
        )}
        {description && (
          <p className='text-sm text-gray-600 dark:text-gray-300 mb-1'>{description}</p>
        )}
        <div className='relative'>
          <div className='absolute h-[44px] aspect-square p-2 flex justify-center items-center'>
            {isLoading ? <SpinnerIcon className='animate-spin' /> : <SearchIcon />}
          </div>
          <input
            id='input'
            ref={searchRef}
            type='text'
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
            className={inputProps?.className}
            {...inputProps}
          />

          <div
            className={`absolute top-full left-0 right-0 border mt-1 rounded-lg max-h-[350px] overflow-auto z-10
            transition-all transform origin-top duration-150 ease-in
              ${isOpen ? 'transform scale-y-100 bg-white' : 'scale-y-0'}`}
          >
            {isOpen &&
              (searchResults.length > 0 ? (
                searchResults.map((option, index) => {
                  const key = typeof option === 'string' ? option : option.value;
                  const label = typeof option === 'string' ? option : option.label;
                  const customLabel =
                    typeof option === 'string' ? undefined : option.customLabel;

                  const isSelected = selectedItems?.some((item) => {
                    if (typeof item === 'string' && typeof option === 'string') {
                      return item === option;
                    } else {
                      return (item as OptionType).value === (option as OptionType).value;
                    }
                  });

                  return (
                    <div
                      key={key}
                      className={`p-2 flex justify-between ${
                        highlightedIndex === index ? 'bg-gray-200' : ''
                      } hover:bg-gray-200 cursor-pointer`}
                      onClick={() => {
                        handleSelectItem(option);
                      }}
                    >
                      {customLabel || label}
                      <span>
                        <CheckIcon checked={!!isSelected} />
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className={`p-2 flex justify-between`}>No results found</div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
