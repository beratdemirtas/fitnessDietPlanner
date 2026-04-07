import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

export default function BarcodeScanner() {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async (result) => {
    if (scanned) return;

    console.log('Barcode detected:', result);

    let barcodeData = null;

    // Different expo-camera versions may return different formats
    if (result && result.data) {
      barcodeData = result.data;
    } else if (typeof result === 'string') {
      barcodeData = result;
    }

    if (!barcodeData || barcodeData.trim() === '') {
      console.warn('Barcode data is empty');
      return;
    }

    setScanned(true);
    setError(null);
    setLoading(true);

    try {
      console.log('Fetching product data for barcode:', barcodeData);

      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcodeData}.json`
      );

      const result = await response.json();
      console.log('API Response:', result);

      if (result.status === 1 && result.product) {
        const productData = result.product;
        setProduct({
          barcode: barcodeData,
          name: productData.product_name || 'Ürün adı bulunamadı',
          image: productData.image_url || null,
          calories: productData.nutriments?.['energy-kcal_100g'] || 'Bilgi yok',
          protein: productData.nutriments?.proteins_100g || 'Bilgi yok',
          carbohydrates:
            productData.nutriments?.carbohydrates_100g || 'Bilgi yok',
          fat: productData.nutriments?.fat_100g || 'Bilgi yok',
        });
      } else {
        setError('Ürün veritabanında bulunamadı. Lütfen başka bir barkod tarayın.');
        setProduct(null);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(
        'Ürün bilgisi alınırken hata oluştu. Lütfen tekrar deneyin.'
      );
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setProduct(null);
    setError(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Kamera erişim izni isteniyor...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <MaterialIcons name="camera-alt" size={60} color="#FF6B6B" />
          <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permissionDescription}>
            Barkod taraması için kamera erişimine ihtiyacımız var.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (product) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.resultContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.resultCard}>
            <View style={styles.headerSection}>
              <Text style={styles.resultTitle}>Ürün Bilgileri</Text>
              <View style={styles.barcodeTag}>
                <Text style={styles.barcodeText}>Barkod: {product.barcode}</Text>
              </View>
            </View>

            {product.image ? (
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <MaterialIcons name="image-not-supported" size={50} color="#ccc" />
                <Text style={styles.noImageText}>Ürün görseli bulunamadı</Text>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.productName}>{product.name}</Text>

              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <MaterialIcons name="local-fire-department" size={24} color="#FF6B6B" />
                  </View>
                  <Text style={styles.nutritionLabel}>Kalori</Text>
                  <Text style={styles.nutritionValue}>
                    {typeof product.calories === 'number'
                      ? product.calories.toFixed(1)
                      : product.calories}
                  </Text>
                  <Text style={styles.nutritionUnit}>kcal/100g</Text>
                </View>

                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <MaterialIcons name="fitness-center" size={24} color="#4ECDC4" />
                  </View>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionValue}>
                    {typeof product.protein === 'number'
                      ? product.protein.toFixed(1)
                      : product.protein}
                  </Text>
                  <Text style={styles.nutritionUnit}>g/100g</Text>
                </View>

                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <MaterialIcons name="grain" size={24} color="#FFD93D" />
                  </View>
                  <Text style={styles.nutritionLabel}>Karbonhidrat</Text>
                  <Text style={styles.nutritionValue}>
                    {typeof product.carbohydrates === 'number'
                      ? product.carbohydrates.toFixed(1)
                      : product.carbohydrates}
                  </Text>
                  <Text style={styles.nutritionUnit}>g/100g</Text>
                </View>

                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <MaterialIcons name="opacity" size={24} color="#E74C3C" />
                  </View>
                  <Text style={styles.nutritionLabel}>Yağ</Text>
                  <Text style={styles.nutritionValue}>
                    {typeof product.fat === 'number'
                      ? product.fat.toFixed(1)
                      : product.fat}
                  </Text>
                  <Text style={styles.nutritionUnit}>g/100g</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={resetScanner}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="white" />
          <Text style={styles.retryButtonText}>Yeni Barkod Tara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Hata</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={resetScanner}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="white" />
            <Text style={styles.retryButtonText}>Tekrar Tara</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Ürün bilgisi yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocused} />
          <View style={styles.middle}>
            <View style={styles.unfocused} />
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <View style={styles.unfocused} />
          </View>
          <View style={styles.unfocused} />
        </View>

        <View style={styles.instructionContainer}>
          <MaterialIcons name="qr-code-scanner" size={40} color="white" />
          <Text style={styles.instructionText}>
            Barkodu kamera içindeki çerçeveye yerleştirin
          </Text>
        </View>
      </CameraView>

      {scanned && (
        <View style={styles.scanAgainContainer}>
          <Text style={styles.scanAgainText}>Tarama yapıldı...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  middle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unfocused: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    borderColor: 'transparent',
  },
  cornerTL: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FF6B6B',
    top: -1,
    left: -1,
  },
  cornerTR: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FF6B6B',
    top: -1,
    right: -1,
  },
  cornerBL: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FF6B6B',
    bottom: -1,
    left: -1,
  },
  cornerBR: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FF6B6B',
    bottom: -1,
    right: -1,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 15,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  scanAgainContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanAgainText: {
    backgroundColor: '#4ECDC4',
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  resultCard: {
    margin: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  barcodeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  barcodeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 10,
    color: '#999',
    fontSize: 12,
  },
  infoSection: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  nutritionIconContainer: {
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  nutritionUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 15,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
