'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import axios from 'axios';
import ProductViewer from '../../../components/ProductViewer';

export default function Home() {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProductDataWithAxios() {
      try {
        const response = await axios.get('/with_bitmap_pdp_res1.json');
        const data = response.data;
        
        // Create a normalized version of the data
        const normalizedData = {...data};
        
        // Ensure bitmap structure exists
        if (!normalizedData.bitmap && normalizedData.variantMap) {
          normalizedData.bitmap = {
            options: normalizedData.options || {},
            variantMap: normalizedData.variantMap
          };
        } else if (!normalizedData.bitmap) {
          normalizedData.bitmap = {
            options: {},
            variantMap: {}
          };
        }
        
        setProductData(normalizedData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load product data:', err);
        setError('Failed to load product data. Please try again later.');
        setLoading(false);
      }
    }

    loadProductDataWithAxios();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading product data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {productData && <ProductViewer productData={productData} />}
    </main>
  );
} 