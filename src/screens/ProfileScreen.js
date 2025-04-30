import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BMICalculator from "../components/BMICalculator";

const ProfileScreen = () => {
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");
  const [gender, setGender] = useState("Erkek");
  const [bmi, setBmi] = useState(null); // BMI değerini tutacak state

  const [modalVisible, setModalVisible] = useState(false);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [selectionList, setSelectionList] = useState([]);

  // Veriyi kaydetme
  const saveData = async () => {
    try {
      const calculatedBmi = handleCalculateBMI(); // Kaydetmeden önce BMI'yi hesapla
      const userData = { height, weight, gender, bmi: calculatedBmi }; // BMI'yı da ekle
      await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
      alert("Bilgiler Kaydedildi!");
      setBmi(calculatedBmi); // State'i güncelle
    } catch (error) {
      console.error("Veri kaydedilirken hata oluştu:", error);
    }
  };

  // BMI hesaplama fonksiyonu
  const handleCalculateBMI = () => {
    const heightInMeters = parseFloat(height) / 100; // Boyu metreye çevir
    const calculatedBmi = parseFloat(weight) / (heightInMeters * heightInMeters);
    return calculatedBmi.toFixed(2); // Hesaplanan BMI değerini döndür
  };

  // Uygulama açıldığında veriyi yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userProfile");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setHeight(parsedData.height);
          setWeight(parsedData.weight);
          setGender(parsedData.gender);
          setBmi(parsedData.bmi); // Kaydedilmiş BMI değerini al
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
      }
    };
    loadData();
  }, []);

  // Seçim modalını açma
  const openModal = (type) => {
    setCurrentSelection(type);
    if (type === "height") {
      setSelectionList(Array.from({ length: 71 }, (_, i) => (140 + i).toString()));
    } else if (type === "weight") {
      setSelectionList(Array.from({ length: 221 }, (_, i) => (30 + i).toString()));
    } else if (type === "gender") {
      setSelectionList(["Erkek", "Kadın"]);
    }
    setModalVisible(true);
  };

  // Seçimi güncelleme
  const selectValue = (value) => {
    if (currentSelection === "height") setHeight(value);
    if (currentSelection === "weight") setWeight(value);
    if (currentSelection === "gender") setGender(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profil Bilgilerini Gir</Text>

      <Text style={styles.label}>Boy Seç (cm):</Text>
      <TouchableOpacity style={styles.selectionBox} onPress={() => openModal("height")}>
        <Text style={styles.selectionText}>{height} cm</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Kilo Seç (kg):</Text>
      <TouchableOpacity style={styles.selectionBox} onPress={() => openModal("weight")}>
        <Text style={styles.selectionText}>{weight} kg</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Cinsiyet Seç:</Text>
      <TouchableOpacity style={styles.selectionBox} onPress={() => openModal("gender")}>
        <Text style={styles.selectionText}>{gender}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={saveData}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>

      {/* Vücut Kitle Endeksi Bileşeni */}
      <BMICalculator bmi={bmi} />

      {/* Seçim Modalı */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={selectionList}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectValue(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 250 }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D9CDB",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
  },
  selectionBox: {
    backgroundColor: "#E5E5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  selectionText: {
    fontSize: 18,
    color: "#2D9CDB",
  },
  saveButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: 300,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    maxHeight: 350,
  },
  modalItem: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 18,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#E74C3C",
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default ProfileScreen;