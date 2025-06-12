import { useState } from 'react';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface PriceRange {
  min: string;
  max: string;
}

interface FilterData {
  attributes: Record<string, string[]>;
  priceRange: PriceRange;
  status: string[];
  rarity: string[];
}

interface FilterProps {
  attributes: Record<string, FilterOption[]>;
  onFiltersChange: (filters: FilterData) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdvancedFilters({ attributes, onFiltersChange, isOpen, onToggle }: FilterProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: '', max: '' });
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);

  const statusOptions = [
    { label: 'Buy Now', value: 'buyNow', count: 45 },
    { label: 'On Auction', value: 'auction', count: 12 },
    { label: 'Has Offers', value: 'offers', count: 23 },
    { label: 'Recently Listed', value: 'recent', count: 8 }
  ];

  const rarityOptions = [
    { label: 'Legendary', value: 'legendary', count: 5 },
    { label: 'Epic', value: 'epic', count: 15 },
    { label: 'Rare', value: 'rare', count: 45 },
    { label: 'Uncommon', value: 'uncommon', count: 120 },
    { label: 'Common', value: 'common', count: 350 }
  ];

  const handleAttributeChange = (traitType: string, value: string) => {
    const currentValues = selectedAttributes[traitType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    const newAttributes = {
      ...selectedAttributes,
      [traitType]: newValues
    };
    
    setSelectedAttributes(newAttributes);
    updateFilters(newAttributes, priceRange, statusFilter, rarityFilter);
  };

  const handleStatusChange = (status: string) => {
    const newStatusFilter = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status];
    
    setStatusFilter(newStatusFilter);
    updateFilters(selectedAttributes, priceRange, newStatusFilter, rarityFilter);
  };

  const handleRarityChange = (rarity: string) => {
    const newRarityFilter = rarityFilter.includes(rarity)
      ? rarityFilter.filter(r => r !== rarity)
      : [...rarityFilter, rarity];
    
    setRarityFilter(newRarityFilter);
    updateFilters(selectedAttributes, priceRange, statusFilter, newRarityFilter);
  };

  const handlePriceChange = (field: 'min' | 'max', value: string) => {
    const newPriceRange = { ...priceRange, [field]: value };
    setPriceRange(newPriceRange);
    updateFilters(selectedAttributes, newPriceRange, statusFilter, rarityFilter);
  };

  const updateFilters = (attrs: Record<string, string[]>, price: PriceRange, status: string[], rarity: string[]) => {
    onFiltersChange({
      attributes: attrs,
      priceRange: price,
      status,
      rarity
    });
  };

  const clearAllFilters = () => {
    setSelectedAttributes({});
    setPriceRange({ min: '', max: '' });
    setStatusFilter([]);
    setRarityFilter([]);
    onFiltersChange({
      attributes: {},
      priceRange: { min: '', max: '' },
      status: [],
      rarity: []
    });
  };

  const totalActiveFilters = 
    Object.values(selectedAttributes).flat().length +
    statusFilter.length +
    rarityFilter.length +
    (priceRange.min || priceRange.max ? 1 : 0);

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={onToggle}
          className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            🔧 Filters
            {totalActiveFilters > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {totalActiveFilters}
              </span>
            )}
          </span>
          <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Filter Sidebar */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden`}>
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {totalActiveFilters > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* Status Filter */}
          <div className="p-6 border-b border-zinc-800">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Status</h4>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label key={option.value} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(option.value)}
                      onChange={() => handleStatusChange(option.value)}
                      className="w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-zinc-300">{option.label}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{option.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="p-6 border-b border-zinc-800">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Price Range (ETH)</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.001"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
              <input
                type="number"
                step="0.001"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rarity Filter */}
          <div className="p-6 border-b border-zinc-800">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Rarity</h4>
            <div className="space-y-2">
              {rarityOptions.map((option) => (
                <label key={option.value} className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rarityFilter.includes(option.value)}
                      onChange={() => handleRarityChange(option.value)}
                      className="w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-zinc-300 capitalize">{option.label}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{option.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Attribute Filters */}
          {Object.entries(attributes).map(([traitType, options]) => (
            <div key={traitType} className="p-6 border-b border-zinc-800">
              <h4 className="text-sm font-medium text-zinc-300 mb-3 capitalize">
                {traitType.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {options.map((option) => (
                  <label key={option.value} className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(selectedAttributes[traitType] || []).includes(option.value)}
                        onChange={() => handleAttributeChange(traitType, option.value)}
                        className="w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-zinc-300 truncate max-w-[120px]">
                        {option.label}
                      </span>
                    </div>
                    {option.count && (
                      <span className="text-xs text-zinc-500">{option.count}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Apply Button (Mobile) */}
        <div className="lg:hidden p-6 border-t border-zinc-800">
          <button
            onClick={onToggle}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Filters ({totalActiveFilters})
          </button>
        </div>
      </div>
    </>
  );
}