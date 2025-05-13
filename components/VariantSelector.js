'use client';

import { useState, useEffect } from 'react';
import styles from './VariantSelector.module.css';

export default function VariantSelector({ productData, onVariantChange }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [currentVariant, setCurrentVariant] = useState(null);
  const [selectedLabels, setSelectedLabels] = useState({});
  const [debugInfo, setDebugInfo] = useState({});
  const [unavailableOptions, setUnavailableOptions] = useState({});
  const [validCombinations, setValidCombinations] = useState({});
console.log(productData,'productData')
  // Initialize with first option of each type when data loads
  useEffect(() => {
    if (!productData) return;
    
    // Find the correct location of variant data
    const options = productData?.bitmap?.options;
    const variantMap = productData?.bitmap?.variantMap || productData?.variantMap;
    
    if (!options || !variantMap) {
      console.error("Missing options or variantMap in productData", {
        hasOptions: !!options,
        hasVariantMap: !!variantMap,
        productData
      });
      return;
    }
    
    
    // Get all available option types in the correct order
    const optionTypes = Object.keys(options);
    
    // Initialize options
    const initialSelection = {};
    const initialLabels = {};
    
    optionTypes.forEach(type => {
      initialSelection[type] = 0;
      initialLabels[type] = options[type][0];
    });
    
    
    setSelectedOptions(initialSelection);
    setSelectedLabels(initialLabels);
    
    // Update the current variant based on initial selection
    updateCurrentVariant(initialSelection, options, variantMap);
    
    // Calculate unavailable options
    calculateUnavailableOptions(options, variantMap);
    
    // Generate valid combinations mapping
    generateValidCombinations(options, variantMap);
  }, [productData]);

  // Calculate which options lead to unavailable variants
  const calculateUnavailableOptions = (options, variantMap) => {
    if (!options || !variantMap) return;
    
    const unavailable = {};
    
    // Check each option type and value
    Object.keys(options).forEach(optionType => {
      unavailable[optionType] = {};
      
      options[optionType].forEach((_, optionIndex) => {
        // Check if this option leads to any in-stock variant
        const hasAvailableVariant = Object.entries(variantMap).some(([key, variant]) => {
          const optionIndices = key.split('-');
          const optionTypes = Object.keys(options);
          const typeIndex = optionTypes.indexOf(optionType);
          
          return parseInt(optionIndices[typeIndex]) === optionIndex && variant.inStock;
        });
        
        unavailable[optionType][optionIndex] = !hasAvailableVariant;
      });
    });
    
    setUnavailableOptions(unavailable);
  };

  // Generate mapping of valid option combinations
  const generateValidCombinations = (options, variantMap) => {
    if (!options || !variantMap) return;
    
    const validOptions = {};
    const optionTypes = Object.keys(options);
    
    // Build a map of valid combinations for each option type
    optionTypes.forEach((optionType, typeIndex) => {
      validOptions[optionType] = {};
      
      // For each possible value of this option type
      options[optionType].forEach((_, valueIndex) => {
        validOptions[optionType][valueIndex] = {};
        
        // For each other option type
        optionTypes.forEach((otherType, otherTypeIndex) => {
          if (otherType !== optionType) {
            validOptions[optionType][valueIndex][otherType] = {};
            
            // For each possible value of the other option type
            options[otherType].forEach((_, otherValueIndex) => {
              // Check if this combination exists in any variant
              let isValid = false;
              
              Object.keys(variantMap).forEach(key => {
                const indices = key.split('-').map(i => parseInt(i));
                
                if (indices[typeIndex] === valueIndex && 
                    indices[otherTypeIndex] === otherValueIndex && 
                    variantMap[key].inStock) {
                  isValid = true;
                }
              });
              
              validOptions[optionType][valueIndex][otherType][otherValueIndex] = isValid;
            });
          }
        });
      });
    });
    
    setValidCombinations(validOptions);
  };

  const updateCurrentVariant = (selected, options, variantMap) => {
    if (!options || !variantMap) return;
    
    // Get all option types in order
    const optionTypes = Object.keys(options);
    
    // Create the variant key from selected options
    const variantKey = optionTypes.map(type => selected[type]).join('-');
    
    
    // Find the variant in the map
    const variant = variantMap[variantKey];
    

    // Debug info
    setDebugInfo({
      variantKey,
      optionTypes,
      selectedIndices: {...selected},
      foundVariant: !!variant,
      sampleVariants: Object.keys(variantMap).slice(0, 10),
      availableKeys: Object.keys(variantMap)
    });
    
    setCurrentVariant(variant);
    
    // Notify parent component about the variant change
    if (onVariantChange) {
      onVariantChange(variant);
    }
  };

  const handleOptionSelect = (optionType, optionIndex, optionValue) => {
    if (!productData) return;
    
    // Find the correct location of variant data
    const options = productData?.bitmap?.options;
    const variantMap = productData?.bitmap?.variantMap || productData?.variantMap;
    
    if (!options || !variantMap) {
      console.error("Missing options or variantMap in productData", productData);
      return;
    }
    
    // Don't select unavailable options
    if (unavailableOptions[optionType]?.[optionIndex]) {
      return;
    }
    
    // Update selected options
    const updatedOptions = {
      ...selectedOptions,
      [optionType]: optionIndex
    };
    
    // Update selected labels
    const updatedLabels = {
      ...selectedLabels,
      [optionType]: optionValue
    };
    
    setSelectedOptions(updatedOptions);
    setSelectedLabels(updatedLabels);
    
    // Update current variant
    updateCurrentVariant(updatedOptions, options, variantMap);
  };

  // Check if an option is compatible with currently selected options
  const isOptionCompatible = (optionType, optionIndex) => {
    // If no valid combinations data, allow all
    if (!Object.keys(validCombinations).length) return true;
    
    const optionTypes = Object.keys(validCombinations);
    
    // Check other selected options for compatibility
    for (const selectedType of optionTypes) {
      if (selectedType !== optionType) {
        const selectedValue = selectedOptions[selectedType];
        
        // If this option type and value combination doesn't work with a currently
        // selected option in another type, return false
        if (validCombinations[optionType]?.[optionIndex]?.[selectedType]?.[selectedValue] === false) {
          return false;
        }
      }
    }
    
    return true;
  };

  if (!productData) return null;

  const options = productData?.bitmap?.options;
  const variantMap = productData?.bitmap?.variantMap || productData?.variantMap;
  
  if (!options || !variantMap) {
    return <div className={styles.container}>No variant data available</div>;
  }

  // Format option type for display (capitalize first letter)
  const formatOptionType = (type) => {
    // Handle different cases - remove underscores and capitalize words
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select Options</h2>
      {Object.entries(options).map(([optionType, optionValues]) => (
        <div key={optionType} className={styles.optionGroup}>
          <h3 className={styles.optionTitle}>{formatOptionType(optionType)}</h3>
          <div className={styles.optionItems}>
            {optionValues.map((option, index) => {
              const isUnavailable = unavailableOptions[optionType]?.[index];
              const isIncompatible = !isOptionCompatible(optionType, index);
              const isDisabled = isUnavailable || isIncompatible;
              
              return (
                <button
                  key={`${optionType}-${index}`}
                  className={`${styles.optionButton} 
                    ${selectedOptions[optionType] === index ? styles.selected : ''} 
                    ${isUnavailable ? styles.unavailable : ''}
                    ${isIncompatible && !isUnavailable ? styles.incompatible : ''}`}
                  onClick={isDisabled ? undefined : () => handleOptionSelect(optionType, index, option)}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : 0}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className={styles.selectionSummary}>
        <h3>Selected Options</h3>
        <ul>
          {Object.entries(selectedLabels).map(([type, value]) => (
            <li key={type}>
              <strong>{formatOptionType(type)}:</strong> {value}
            </li>
          ))}
        </ul>
        <div className={styles.variantKeyDisplay}>
          <strong>Variant Key:</strong> {debugInfo.variantKey}
        </div>
      </div>
      
      {currentVariant ? (
        <div className={styles.variantInfo}>
          <h3 className={styles.variantTitle}>Selected Variant</h3>
          <div className={styles.variantDetails}>
            <p className={styles.sku}>
              <span className={styles.label}>SKU:</span> {currentVariant.sku}
            </p>
            <p className={styles.slug}>
              <span className={styles.label}>Slug:</span> {currentVariant.slug}
            </p>
            <p className={styles.price}>
              <span className={styles.label}>Price:</span> ${currentVariant.price.finalPrice}
              {currentVariant.price.discountPrice > 0 && (
                <span className={styles.msrp}> (MSRP: ${currentVariant.price.msrpPrice})</span>
              )}
            </p>
            <p className={`${styles.stock} ${!currentVariant.inStock ? styles.outOfStock : ''}`}>
              <span className={styles.label}>Stock:</span> 
              {currentVariant.inStock ? `${currentVariant.stockQty} available` : 'Out of stock'}
            </p>
            <p className={styles.variantId}>
              <span className={styles.label}>ID:</span> {currentVariant.variantId}
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.variantError}>
          <p>No variant found for the selected combination.</p>
          <p>Please select a different combination of options.</p>
        </div>
      )}
      
      <details className={styles.debugSection}>
        <summary>Debug Info</summary>
        <div className={styles.debugContent}>
          <p><strong>Variant Key:</strong> {debugInfo.variantKey}</p>
          <p><strong>Option Types:</strong> {debugInfo.optionTypes?.join(', ')}</p>
          <p><strong>Selected Indices:</strong> {JSON.stringify(debugInfo.selectedIndices)}</p>
          <p><strong>Available Keys:</strong></p>
          <div className={styles.keysContainer}>
            {debugInfo.sampleVariants?.map(key => (
              <div key={key} className={styles.keyItem}>
                {key}
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
} 