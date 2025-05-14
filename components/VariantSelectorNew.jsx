import React, { useEffect, useState } from 'react';

const VariantSelectorNew = ({ productData, onVariantChange }) => {
  const options = productData?.bitmap?.options || {};
  const optionKeys = Object.keys(options);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [variantData, setVariantData] = useState(null);

  // Initialize variant on component mount
//   useEffect(() => {
//     if (productData?.selectedVariant) {
//       // Get indexes from selectedVariant, convert strings to numbers
//       const colorNameIndex = parseInt(productData.selectedVariant.colorNameIndex || 0);
//       const sizeIndex = parseInt(productData.selectedVariant.sizeIndex || 0);
//       const packSizeIndex = parseInt(productData.selectedVariant.packSizeIndex || 0);
//       console.log(options.color[productData.selectedVariant.colorName],productData.selectedVariant.colorName,'colorNameIndex')
//       updateVariant([colorNameIndex, sizeIndex, packSizeIndex]);
//     } else {
//       // Default to first options
//       updateVariant(optionKeys.map(() => 0));
//     }
//   }, [productData]);

useEffect(() => {
    if (productData?.selectedVariant) {
      const { colorName, size,  linkedtounits = [] } = productData.selectedVariant;
  
      const colorIndex = options.color.findIndex(color => color.toLowerCase() === colorName.toLowerCase());
      const sizeIndex = options.size.findIndex(sizeOption => sizeOption.toLowerCase() === size.toLowerCase());
  
      const linkedDataIndexes = linkedtounits.map(unit => {
        const linkedValue = unit?.value?.en?.toLowerCase();
        const key = unit?.attrname?.en;
        const index = options[key]?.findIndex(option => option.toLowerCase() === linkedValue);
        return index >= 0 ? index : null;
      }).filter(index => index !== null);
  
      updateVariant([colorIndex, sizeIndex, ...linkedDataIndexes]);
    } else {
      updateVariant(optionKeys.map(() => 0));
    }
  }, [productData]);
  

  // Get variant key from indexes array
  const getVariantKey = (indexes) => indexes.join('-');

  // Check if a variant exists and is available
  const isVariantAvailable = (indexes) => {
    const key = getVariantKey(indexes);
    return !!productData?.bitmap?.variantMap?.[key];
  };

  // Update selected variant data
  const updateVariant = (indexes) => {
    console.log(indexes,'indexes')
    const key = getVariantKey(indexes);
    const variant = productData?.bitmap?.variantMap?.[key];
    
    if (variant) {
      setSelectedIndexes(indexes);
      setVariantData(variant);
      
      if (onVariantChange) {
        // Get the actual variant values to pass to parent
        const variantValues = {};
        optionKeys.forEach((key, idx) => {
          const values = options[key] || [];
          if (values[indexes[idx]] !== undefined) {
            variantValues[key] = values[indexes[idx]];
          }
        });
        
        onVariantChange({
          ...variant,
          ...variantValues,
          variantKey: key
        });
      }
    }
  };

  // Handle option selection
  const handleSelect = (groupIdx, valueIdx) => {
    const newIndexes = [...selectedIndexes];
    newIndexes[groupIdx] = valueIdx;
    if (isVariantAvailable(newIndexes)) {
      updateVariant(newIndexes);
    }
  };

  // Format price with dollar sign and 2 decimal places
  const formatPrice = (price) => {
    if (typeof price !== 'number') return '';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="variant-selector">
      {/* Price display */}
      {variantData && (
        <div className="price-container">
          <div className="price">
            {formatPrice(variantData?.price?.finalPrice)}
            {variantData?.price?.compareAtPrice && (
              <span className="compare-price">
                {formatPrice(variantData.price.compareAtPrice)}
              </span>
            )}
          </div>
          {variantData?.sku && <div className="sku">SKU: {variantData.sku}</div>}
        </div>
      )}

      {/* Variant options */}
      {optionKeys.map((name, groupIdx) => (
  <div key={name} className="option-group">
    <div className="option-name">{name}</div>
    <div className="option-buttons">
      {options[name].map((value, valueIdx) => {
        const newIndexes = [...selectedIndexes]; // Copy current selected indexes
        newIndexes[groupIdx] = valueIdx; // Update the selected index for the current group
        const available = isVariantAvailable(newIndexes); // Check availability
        const selected = selectedIndexes[groupIdx] === valueIdx; // Check if it's the selected option
        const key = getVariantKey(newIndexes); // Get the variant key
        const variant = productData?.bitmap?.variantMap?.[key]; // Get the variant data for this key
        const price = variant?.price?.finalPrice; // Get the price of the variant

        // Check if this is the last option group
        const isLastOptionType = groupIdx === optionKeys.length - 1;

        return (
          <button
            key={value}
            className={`variant-btn ${selected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
            disabled={!available}
            onClick={() => handleSelect(groupIdx, valueIdx)}
          >
            {value}
            {/* Show price only for the last option type */}
            {isLastOptionType && price && (
              <span className="variant-price">{` - ${formatPrice(price)}`}</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
))}

      
      <style jsx>{`
        .variant-selector {
          margin-bottom: 20px;
        }
        .price-container {
          margin-bottom: 15px;
        }
        .price {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .compare-price {
          text-decoration: line-through;
          color: #999;
          margin-left: 10px;
          font-weight: normal;
        }
        .sku {
          color: #666;
          font-size: 14px;
        }
        .option-group {
          margin-bottom: 15px;
        }
        .option-name {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .option-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .variant-btn {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          min-width: 40px;
          transition: all 0.2s;
        }
        .variant-btn:hover:not(:disabled) {
          border-color: #888;
        }
        .variant-btn.selected {
          border-color: #000;
          background: #f0f0f0;
          font-weight: bold;
        }
        .variant-btn.unavailable {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default VariantSelectorNew;
