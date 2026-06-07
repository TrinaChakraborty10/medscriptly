import { useState, useEffect, useRef } from 'react'

export default function AutoComplete({
  value,
  onChange,
  onSelect,
  placeholder,
  fetchOptions,
  className
}) {
  const [query, setQuery] = useState(value || '')
  const [options, setOptions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef()

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 1) {
      setOptions([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const results = await fetchOptions(query)
      setOptions(results)
      setShowDropdown(true)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
  }

  const handleSelect = (option) => {
    setQuery(option.name)
    onChange(option.name)
    onSelect(option)
    setShowDropdown(false)
    setOptions([])
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-gray-400 px-3 py-2">Searching...</p>
          ) : options.length === 0 ? (
            <div className="px-3 py-2">
              <p className="text-xs text-gray-400 mb-1">No results found</p>
              <p className="text-xs text-blue-500 cursor-pointer hover:text-blue-700"
                onClick={() => { setShowDropdown(false) }}>
                Use "{query}" as typed
              </p>
            </div>
          ) : (
            <>
              {options.map((opt) => (
                <div key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-900">{opt.name}</p>
                  {opt.default_dosage && (
                    <p className="text-xs text-gray-400">Default: {opt.default_dosage}</p>
                  )}
                  {opt.category && (
                    <p className="text-xs text-gray-400">{opt.category}</p>
                  )}
                </div>
              ))}
              <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-blue-500 cursor-pointer hover:text-blue-700"
                  onClick={() => { onChange(query); setShowDropdown(false) }}>
                  + Use "{query}" if not listed
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}