'use client';

import styles from './ProductDetails.module.css';

export default function ProductDetails({ productData, selectedVariant }) {
  if (!productData) {
    return <div>Loading product information...</div>;
  }

  // Placeholder for images since actual images aren't in the JSON
  const images = [
    '/placeholder-shirt-1.jpg',
    '/placeholder-shirt-2.jpg',
    '/placeholder-shirt-3.jpg'
  ];

  // Get highlights
  const highlights = productData.highlights?.map(highlight => 
    highlight.en || Object.values(highlight)[0]
  ) || [];

  // Get description
  const description = productData.detailedDesc?.[0] || '';

  return (
    <div className={styles.container}>
      <div className={styles.gallery}>
        {images.map((image, index) => (
          <div key={index} className={styles.imageContainer}>
            <img 
              src={image} 
              alt={`Product view ${index + 1}`} 
              className={styles.image}
            />
          </div>
        ))}
      </div>

      <div className={styles.details}>
        <h1 className={styles.title}>
          {selectedVariant?.name || productData.highlights?.[0]?.en || 'Product'}
        </h1>
        
        <div className={styles.brand}>
          Brand: {productData.brand || 'Not specified'}
        </div>

        {selectedVariant && (
          <div className={styles.sku}>
            SKU: {selectedVariant.sku}
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className={styles.highlights}>
            <h3>Highlights</h3>
            <ul>
              {highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Description */}
        {description && (
          <div className={styles.description}>
            <h3>Description</h3>
            <p>{description}</p>
          </div>
        )}

        {/* Return Policy */}
        {productData.returnPolicy && (
          <div className={styles.returnPolicy}>
            <h3>Return Policy</h3>
            <p>
              {productData.returnPolicy.isReturn 
                ? `Returns accepted within ${productData.returnPolicy.noofdays} days` 
                : 'No returns accepted'}
            </p>
          </div>
        )}

        {/* Categories */}
        {productData.categoryList && productData.categoryList.length > 0 && (
          <div className={styles.categories}>
            <h3>Categories</h3>
            <div className={styles.categoryTags}>
              {productData.categoryList.map((category, index) => (
                <span key={index} className={styles.categoryTag}>
                  {category.categoryName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 