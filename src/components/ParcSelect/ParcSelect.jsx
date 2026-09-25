import { useState, useEffect, useRef } from 'react'
import { FiMapPin, FiChevronDown, FiCheck } from 'react-icons/fi'
import './ParcSelect.css'

export default function ParcSelect({ parcs = [], value, onChange, placeholder = 'Choisir un parc', variant = 'dark' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Find currently selected parc (by ID or name)
  const selectedParc = parcs.find(p => p._id === value || p.name === value)

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSelect = (parc) => {
    onChange(parc._id, parc.name)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`parc-select parc-select--${variant} ${isOpen ? 'parc-select--open' : ''}`}
    >
      <button
        type="button"
        className="parc-select__trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <FiMapPin className="parc-select__icon" size={15} />
        <span className="parc-select__value">
          {selectedParc ? (
            <>
              <span className="parc-select__name">{selectedParc.name}</span>
              {selectedParc.city && <span className="parc-select__city">{selectedParc.city}</span>}
            </>
          ) : (
            <span className="parc-select__placeholder">
              {parcs.length === 0 ? 'Chargement des parcs...' : placeholder}
            </span>
          )}
        </span>
        <FiChevronDown className="parc-select__chevron" size={15} />
      </button>

      {isOpen && (
        <div className="parc-select__dropdown" role="listbox">
          {parcs.length === 0 ? (
            <div className="parc-select__empty">Aucun parc disponible</div>
          ) : (
            <div className="parc-select__list">
              {parcs.map(parc => {
                const isSelected = parc._id === value
                return (
                  <div
                    key={parc._id}
                    role="option"
                    aria-selected={isSelected}
                    className={`parc-select__option ${isSelected ? 'parc-select__option--selected' : ''}`}
                    onClick={() => handleSelect(parc)}
                  >
                    <div className="parc-select__option-main">
                      <FiMapPin className="parc-select__option-icon" size={14} />
                      <div className="parc-select__option-text">
                        <div className="parc-select__option-name">{parc.name}</div>
                        {parc.address && (
                          <div className="parc-select__option-sub">{parc.address}</div>
                        )}
                      </div>
                    </div>
                    {parc.city && (
                      <span className="parc-select__option-badge">{parc.city}</span>
                    )}
                    {isSelected && (
                      <FiCheck className="parc-select__option-check" size={14} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
