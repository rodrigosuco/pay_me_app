import React, { useState, useEffect } from "react";
import { Text, View, FlatList, ListRenderItem, Modal, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import axios from "axios";
import { SelectList } from 'react-native-dropdown-select-list';

interface User {
  id: number;
  nome_completo: string;
  user_type: string;
  saldo: number;
}

export default function Index() {
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRecebedorId, setSelectedRecebedorId] = useState<number | null>(null);
  const [transferValue, setTransferValue] = useState<string>("");

  const getUser = async () => {
    try {
      const response = await axios.get("http://172.17.220.89:3000/users.json");
      setUser(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const transfer = async () => {
    if (!selectedUser) {
      Alert.alert("Erro", "Nenhum usuário selecionado para transferência");
      return;
    }

    if (selectedRecebedorId === null || isNaN(selectedRecebedorId)) {
      Alert.alert("Erro", "O recebedor selecionado é inválido");
      return;
    }

    const value = parseFloat(transferValue);
    if (isNaN(value)) {
      Alert.alert("Erro", "O valor da transferência é inválido");
      return;
    }

    const transferData = {
      user_id: selectedUser.id,
      recebedor: selectedRecebedorId,
      value,
    };

    try {
      const response = await axios.post(
        "http://172.17.220.89:3000/transfers",
        transferData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      setUser(prevUsers => prevUsers.map(u => {
        if (u.id === selectedUser.id) {
          return { ...u, saldo: u.saldo - value };
        } else if (u.id === selectedRecebedorId) {
          return { ...u, saldo: u.saldo + value };
        }
        return u;
      }));

      const recebedor = user.find(u => u.id === selectedRecebedorId);

      Alert.alert(
        "Transferência bem-sucedida",
        `Transferência de R$${value.toFixed(2)} para ${recebedor?.nome_completo} realizada com sucesso.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Ocorreu um erro ao realizar a transferência";
      Alert.alert("Erro", errorMessage);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  const selectListData = user.map((u) => ({ key: u.id, value: u.nome_completo }));

  const renderItem: ListRenderItem<User> = ({ item }) => (
    <View style={{ padding: 10 }}>
      <Pressable
        style={[styles.button, styles.buttonOpen]}
        onPress={() => {
          setSelectedUser(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.textStyle}>{item.nome_completo}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.centeredView}>
      <Text>Selecione o pagante:</Text>
      <FlatList
        data={user}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
      
      {selectedUser && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Pagador: {selectedUser.nome_completo}</Text>
              <Text style={styles.modalText}>Saldo da conta: {selectedUser.saldo}</Text>
              <SelectList
                setSelected={(val: string | number) => {
                  setSelectedRecebedorId(Number(val));
                }}
                data={selectListData}
                save="key"
                searchPlaceholder=""
                placeholder="Selecione o recebedor"
              />
              <TextInput
                style={styles.input}
                placeholder="Digite o valor da transferencia"
                keyboardType="numeric"
                value={transferValue}
                onChangeText={setTransferValue}
              />

              <View style={styles.containerButton}>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setModalVisible(!modalVisible)}>
                  <Text style={styles.textStyle}>Fechar</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonOk]}
                  onPress={() => {
                    transfer();
                    setModalVisible(!modalVisible);
                  }}>
                  <Text style={styles.textStyle}>Transferir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
    marginRight: 15,
  },
  buttonOk: {
    backgroundColor: '#2196F3',
    marginLeft: 15,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: 'black',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  containerButton: {
    flexDirection: "row",
  },
});
