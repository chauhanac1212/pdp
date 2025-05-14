'use client';

import { useState, useEffect } from 'react';
import styles from './VariantSelector.module.css';

export default function VariantSelector({ productData, onVariantChange }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedLabels, setSelectedLabels] = useState({});
  const [currentVariant, setCurrentVariant] = useState(null);
  const [unavailableOptions, setUnavailableOptions] = useState({});
  const [validCombinations, setValidCombinations] = useState({});
  const [debugInfo, setDebugInfo] = useState({});

  const options = productData?.bitmap?.options;
  const variantMap = productData?.bitmap?.variantMap || productData?.variantMap;

  useEffect(() => {
    if (!options || !variantMap) return;

    const initialSelection = {};
    const initialLabels = {};

    Object.keys(options).forEach((type) => {
      initialSelection[type] = 0;
      initialLabels[type] = options[type][0];
    });

    setSelectedOptions(initialSelection);
    setSelectedLabels(initialLabels);
    updateVariant(initialSelection);
    calculateUnavailable(options, variantMap);
    calculateValidCombinations(options, variantMap);
  }, [productData]);

  const updateVariant = (selection) => {
    console.log(selection,'selection')
    const key = Object.keys(options).map(type => selection[type]).join('-');
    const variant = variantMap[key];

    setCurrentVariant(variant);
    setDebugInfo({
      variantKey: key,
      selectedIndices: { ...selection },
      foundVariant: !!variant,
      sampleVariants: Object.keys(variantMap).slice(0, 10)
    });

    onVariantChange?.(variant);
  };

  const calculateUnavailable = (opts, map) => {
    const result = {};

    Object.keys(opts).forEach((type, i) => {
      result[type] = opts[type].map((_, index) => {
        return !Object.keys(map).some((key) => {
          const indices = key.split('-').map(Number);
          return indices[i] === index && map[key].inStock;
        });
      });
    });

    setUnavailableOptions(result);
  };

  const calculateValidCombinations = (opts, map) => {
    const result = {};

    Object.keys(opts).forEach((type, i) => {
      result[type] = {};

      opts[type].forEach((_, index) => {
        result[type][index] = {};

        Object.keys(opts).forEach((otherType, j) => {
          if (type === otherType) return;

          result[type][index][otherType] = {};

          opts[otherType].forEach((_, otherIndex) => {
            const valid = Object.keys(map).some((key) => {
              const indices = key.split('-').map(Number);
              return indices[i] === index && indices[j] === otherIndex && map[key].inStock;
            });

            result[type][index][otherType][otherIndex] = valid;
          });
        });
      });
    });

    setValidCombinations(result);
  };

  const handleSelect = (type, index, label) => {
    console.log(type, index, label,'type, index, label')
    if (unavailableOptions[type]?.[index]) return;

    const updated = { ...selectedOptions, [type]: index };
    const labels = { ...selectedLabels, [type]: label };

    setSelectedOptions(updated);
    setSelectedLabels(labels);
    updateVariant(updated);
  };

  const isCompatible = (type, index) => {
    if (!Object.keys(validCombinations).length) return true;

    return Object.keys(validCombinations[type]?.[index] || {}).every((otherType) => {
      const selected = selectedOptions[otherType];
      return validCombinations[type][index][otherType]?.[selected] !== false;
    });
  };

  const formatLabel = (str) =>
    str.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  if (!productData || !options || !variantMap) {
    return <div className={styles.container}>No variant data available</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select Options</h2>

      {Object.entries(options).map(([type, values]) => (
        <div key={type} className={styles.optionGroup}>
          <h3 className={styles.optionTitle}>{formatLabel(type)}</h3>
          <div className={styles.optionItems}>
            {values.map((value, index) => {
              const selected = selectedOptions[type] === index;
              const unavailable = unavailableOptions[type]?.[index];
              const incompatible = !isCompatible(type, index);
              const disabled = unavailable || incompatible;
              
              // Calculate price for this option if available
              let priceInfo = null;
              // Only show prices for the last option type
              const isLastOptionType = Object.keys(options).indexOf(type) === Object.keys(options).length - 1;
              const  disabledbtn = Object.keys(options).indexOf(type) === Object.keys(options).length ;
              console.log(unavailable,incompatible,'disabledbtn')
              if (!disabled && isLastOptionType) {
                // Create a temp selection with this option
                const tempOptions = { ...selectedOptions, [type]: index };
                // Get variant key and check for price
                const variantKey = Object.keys(options).map(t => tempOptions[t]).join('-');
                const variant = variantMap[variantKey];
                if (variant?.price?.finalPrice) {
                  priceInfo = variant.price.finalPrice;
                }
              }

              return (
                <button
                  key={`${type}-${index}`}
                  className={`${styles.optionButton}
                    ${selected ? styles.selected : ''}
                    ${unavailable ? styles.unavailable : ''}
                    ${incompatible && !unavailable ? styles.incompatible : ''}`}
                  onClick={() => !disabled && handleSelect(type, index, value)}
                  disabled={disabled }
                >
                  {value}
                  {priceInfo !== null &&    (
                    <span className={styles.priceInfo}> - ${priceInfo}</span>
                  )}
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
              <strong>{formatLabel(type)}:</strong> {value}
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
            <p><strong>SKU:</strong> {currentVariant.sku}</p>
            <p><strong>Slug:</strong> {currentVariant.slug}</p>
            <p>
              <strong>Price:</strong> ${currentVariant.price.finalPrice}
              {currentVariant.price.discountPrice > 0 && (
                <span className={styles.msrp}> (MSRP: ${currentVariant.price.msrpPrice})</span>
              )}
            </p>
            <p className={`${styles.stock} ${!currentVariant.inStock ? styles.outOfStock : ''}`}>
              <strong>Stock:</strong>{' '}
              {currentVariant.inStock ? `${currentVariant.stockQty} available` : 'Out of stock'}
            </p>
            <p><strong>ID:</strong> {currentVariant.variantId}</p>
          </div>
        </div>
      ) : (
        <div className={styles.variantError}>
          <p>No variant found for the selected combination.</p>
        </div>
      )}

      <details className={styles.debugSection}>
        <summary>Debug Info</summary>
        <div className={styles.debugContent}>
          <p><strong>Variant Key:</strong> {debugInfo.variantKey}</p>
          <p><strong>Selected Indices:</strong> {JSON.stringify(debugInfo.selectedIndices)}</p>
          <div className={styles.keysContainer}>
            {debugInfo.sampleVariants?.map((key) => (
              <div key={key} className={styles.keyItem}>{key}</div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
