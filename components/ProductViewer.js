'use client';

import { useState } from 'react';
import VariantSelector from './VariantSelector';
import styles from './ProductViewer.module.css';

export default function ProductViewer({ productData }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Handle variant selection
  const handleVariantChange = (variant) => {
    console.log('ProductViewer received variant change:', variant ? {
      sku: variant.sku,
      id: variant.variantId,
      price: variant.price?.finalPrice,
      inStock: variant.inStock
    } : 'null');
    
    setSelectedVariant(variant);
    
    // Reset quantity when variant changes
    if (variant) {
      setQuantity(1);
    }
  };

  // Handle quantity changes
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (selectedVariant && value > selectedVariant.stockQty) {
      setQuantity(selectedVariant.stockQty);
    } else {
      setQuantity(value);
    }
  };

  // Handle add to cart button
  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert('Please select a variant first');
      return;
    }
    
    if (!selectedVariant.inStock) {
      alert('Sorry, this variant is out of stock');
      return;
    }
    
    alert(`Added to cart: ${quantity} x ${selectedVariant.sku}`);
  };

  if (!productData) {
    return <div className={styles.loading}>Loading product data...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Product header */}
      <div className={styles.productHeader}>
        <h1 className={styles.productTitle}>
          {productData.highlights?.[0]?.en || 'Product Name'}
        </h1>
        <div className={styles.productBrand}>{productData.brand || 'Brand'}</div>
      </div>

      <div className={styles.productContent}>
        {/* Product images */}
        <div className={styles.productImages}>
          <div className={styles.mainImage}>
            <div className={styles.placeholderImage}>
              <span>Product Image</span>
            </div>
          </div>
        </div>

        {/* Product details and variant selection */}
        <div className={styles.productDetails}>
          <VariantSelector 
            productData={productData} 
            onVariantChange={handleVariantChange}
          />
          
          {/* Display selected variant info and purchase controls */}
          {selectedVariant && (
            <div className={styles.actionArea}>
              <div className={styles.priceContainer}>
                <div className={styles.currentPrice}>
                  ${selectedVariant.price.finalPrice.toFixed(2)}
                </div>
                {selectedVariant.price.discountPercentage > 0 && (
                  <div className={styles.priceMeta}>
                    <span className={styles.msrpPrice}>
                      ${selectedVariant.price.msrpPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={styles.purchaseControls}>
                <div className={styles.quantitySelector}>
                  <label htmlFor="quantity">Qty:</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    max={selectedVariant.stockQty || 10}
                    value={quantity}
                    onChange={handleQuantityChange}
                    disabled={!selectedVariant.inStock}
                  />
                </div>
                
                <button 
                  className={styles.addToCartButton}
                  onClick={handleAddToCart}
                  disabled={!selectedVariant.inStock}
                >
                  {selectedVariant.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          )}
          
          {/* Product description */}
          <div className={styles.productDescription}>
            <h3>Description</h3>
            <div className={styles.descriptionContent}>
              {productData.detailedDesc?.map((desc, index) => (
                <p key={index}>{desc}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 