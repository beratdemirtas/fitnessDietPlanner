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
  const [height, setHeight] = useState();
  const [weight, setWeight] = useState();
  const [gender, setGender] = useState();
  const [bmi, setBmi] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [selectionList, setSelectionList] = useState([]);

  const saveData = async () => {
    try {
      const calculatedBmi = handleCalculateBMI();
      if (calculatedBmi === null) {
        alert("Lütfen boy ve kilo bilgilerini giriniz.");
        return;
      }
      const userData = { height, weight, gender, bmi: calculatedBmi };
      await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
      alert("Bilgiler Kaydedildi!");
      setBmi(calculatedBmi);
    } catch (error) {
      console.error("Veri kaydedilirken hata oluştu:", error);
    }
  };

  const handleCalculateBMI = () => {
    if (!height || !weight) return null;

    const heightInMeters = parseFloat(height) / 100;
    const parsedWeight = parseFloat(weight);

    if (isNaN(heightInMeters) || isNaN(parsedWeight) || heightInMeters === 0) {
      return null;
    }

    const calculatedBmi = parsedWeight / (heightInMeters * heightInMeters);
    return calculatedBmi.toFixed(2);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userProfile");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setHeight(parsedData.height);
          setWeight(parsedData.weight);
          setGender(parsedData.gender);
          setBmi(parsedData.bmi);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
      }
    };
    loadData();
  }, []);

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
        <Text style={styles.selectionText}>{height ? `${height} cm` : "Seçiniz"}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Kilo Seç (kg):</Text>
      <TouchableOpacity style={styles.selectionBox} onPress={() => openModal("weight")}>
        <Text style={styles.selectionText}>{weight ? `${weight} kg` : "Seçiniz"}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Cinsiyet Seç:</Text>
      <TouchableOpacity style={styles.selectionBox} onPress={() => openModal("gender")}>
        <Text style={styles.selectionText}>{gender || "Seçiniz"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={saveData}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>

      <BMICalculator bmi={bmi} />

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