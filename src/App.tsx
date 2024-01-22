import { useCallback, useState } from 'react';
import SearchDropdown from './components/SearchDropdown';
import { OptionType } from './types';
import usStates from './data/us-states.json';

function App() {
  const [selectedItems, setSelectedItems] = useState<(string | OptionType)[]>([]);

  const fetchUserList = useCallback(
    async (keyword: string): Promise<OptionType[]> =>
      fetch(`https://restcountries.com/v3.1/name/${keyword}`)
        .then((response) => response.json())
        .then((countries) => {
          return countries.map((country: any) => ({
            label: country.name.common,
            value: country.name.common,
            customLabel: (
              <div>
                <div className='flex gap-2'>
                  <span>{country.flag}</span>
                  {country.name.official}
                </div>
                <div className='text-sm'>
                  Capital City: <span>{country.capital?.[0]}</span>
                </div>
              </div>
            ),
          }));
        })
        .catch(() => {
          return [];
        }),
    [],
  );

  return (
    <div className='bg-gray-300 dark:bg-slate-800 h-screen flex justify-center items-center flex-col gap-y-8'>
      <SearchDropdown
        className='w-[300px]'
        label='Asynchronous Countries Search'
        description='Search countries by name from remote API'
        //options={['abc', '2abd', 'def', 'efg']}
        options={(keyword) => fetchUserList(keyword)}
        inputProps={{ className: 'w-full' }}
        isLoading
        debounce={500}
        onSelectedChange={setSelectedItems}
        selectedItems={selectedItems}
      />

      <SearchDropdown
        className='w-[300px]'
        label='US States Search'
        description='Search US states by name or abbreviation'
        options={usStates.map((state) => ({
          label: state.name,
          value: state.abbreviation,
        }))}
        inputProps={{ className: 'w-full' }}
        isLoading
        debounce={500}
        onSelectedChange={setSelectedItems}
        selectedItems={selectedItems}
      />
    </div>
  );
}

export default App;
