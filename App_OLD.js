import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';



const API_KEY = 'AIzaSyBaHtRGcqsUBZx5LjE47yTQwSbJOAc5TLY';

export default function App() {
  // Estado para controlar se o usuário está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Estado para controlar se está criando uma conta ou fazendo login
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  // Estados para origem, destino, distância e preço da viagem
  const [origem, setOrigem] = useState({ endereco: '', coordenada: null });
  const [destino, setDestino] = useState({ endereco: '', coordenada: null });
  const [distancia, setDistancia] = useState(null);
  const [preco, setPreco] = useState(null);

  // Refs para os campos de origem e destino
  const origemRef = useRef(null);
  const destinoRef = useRef(null);

  // Efeito para solicitar permissão de localização ao carregar o aplicativo
  useEffect(() => {
    obterLocalizacaoAsync();
  }, []);

  // Função para solicitar permissão de localização
  const obterLocalizacaoAsync = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada');
      return;
    }
  };

  // Função para solicitar a viagem
  const solicitarViagem = async () => {
    if (!origem.coordenada || !destino.coordenada) {
      Alert.alert('Por favor, insira o endereço de origem e destino.');
      return;
    }

    try {
      const dist = calcularDistancia(origem.coordenada, destino.coordenada);
      const precoViagem = calcularPreco(dist);
      setDistancia(dist);
      setPreco(precoViagem);
    } catch (error) {
      console.error('Erro ao solicitar viagem:', error);
      Alert.alert('Ocorreu um erro ao solicitar a viagem.');
    }
  };

  // Função para calcular a distância entre duas coordenadas geográficas
  const calcularDistancia = (coordenadaOrigem, coordenadaDestino) => {
    const R = 6371; // Raio da Terra em quilômetros
    const lat1 = coordenadaOrigem.latitude;
    const lon1 = coordenadaOrigem.longitude;
    const lat2 = coordenadaDestino.latitude;
    const lon2 = coordenadaDestino.longitude;

    const dLat = paraRadianos(lat2 - lat1);
    const dLon = paraRadianos(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(paraRadianos(lat1)) *
        Math.cos(paraRadianos(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distancia = R * c;
    return distancia;
  };

  // Função auxiliar para converter graus em radianos
  const paraRadianos = (graus) => {
    return graus * (Math.PI / 180);
  };

  // Função para calcular o preço da viagem com base na distância
  const calcularPreco = (distancia) => {
    return distancia * 2;
  };

  // Função para obter as coordenadas geográficas a partir de um endereço
  const obterCoordenadas = async (endereco, setEndereco, ref) => {
    try {
      const localizacao = await Location.geocodeAsync(endereco);
      if (localizacao && localizacao.length > 0) {
        setEndereco({
          endereco,
          coordenada: {
            latitude: localizacao[0].latitude,
            longitude: localizacao[0].longitude,
          },
        });
        ref.current.blur(); // Fecha o teclado após obter as coordenadas
      } else {
        Alert.alert('Endereço não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error);
      Alert.alert('Ocorreu um erro ao obter coordenadas.');
    }
  };

  // Função para processar o login do usuário
  const handleLogin = () => {
    // Lógica para autenticar o usuário aqui
    setIsAuthenticated(true);
  };

  // Função para alternar entre login e criar conta
  const toggleAuthMode = () => {
    setIsCreatingAccount(!isCreatingAccount);
  };

  // Renderização condicional com base no estado de autenticação e criação de conta
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqOLUyMWiSwm8mu7Dwx1sfa9YpQ-13O_iES0GZXBafWQ&s' }}
          style={styles.logo}
        />
        <View style={styles.loginContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={() => {}}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            onChangeText={() => {}}
          />
          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>{isCreatingAccount ? 'Criar Conta' : 'Login'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.switchButtonText}>{isCreatingAccount ? 'Já tem uma conta? Faça login' : 'Ainda não tem uma conta? Registre-se'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Renderização da interface principal do aplicativo
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        initialRegion={{
          latitude: -3.760217,
          longitude: -38.488726,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        {origem.coordenada && (
          <Marker coordinate={origem.coordenada} title="Origem">
            <Callout>
              <Text>{origem.endereco}</Text>
            </Callout>
          </Marker>
        )}
                {destino.coordenada && (
          <Marker coordinate={destino.coordenada} title="Destino">
            <Callout>
              <Text>{destino.endereco}</Text>
            </Callout>
          </Marker>
        )}
        {origem.coordenada && destino.coordenada && (
          <MapViewDirections
            origin={origem.coordenada}
            destination={destino.coordenada}
            apikey={API_KEY}
            strokeWidth={3}
            strokeColor="blue"
          />
        )}
      </MapView>
      <View style={styles.infoContainer}>
        <TextInput
          ref={origemRef}
          style={styles.input}
          placeholder="Endereço de origem"
          value={origem.endereco}
          onChangeText={(text) =>
            setOrigem({ endereco: text, coordenada: null })
          }
          onSubmitEditing={() =>
            obterCoordenadas(origem.endereco, setOrigem, origemRef)
          }
        />
        <TextInput
          ref={destinoRef}
          style={styles.input}
          placeholder="Endereço de destino"
          value={destino.endereco}
          onChangeText={(text) =>
            setDestino({ endereco: text, coordenada: null })
          }
          onSubmitEditing={() =>
            obterCoordenadas(destino.endereco, setDestino, destinoRef)
          }
        />
        <Button title="Solicitar Viagem" onPress={solicitarViagem} />
        {distancia && (
          <Text style={styles.infoText}>
            Distância: {distancia.toFixed(2)} km
          </Text>
        )}
        {preco && (
          <Text style={styles.infoText}>Preço: R$ {preco.toFixed(2)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100, // Adiciona um espaço entre a imagem e o loginContainer
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
  },
  input: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    width: '80%',
  },
  infoText: {
    marginBottom: 10,
    fontSize: 16,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 100, // Ajusta a margem da imagem
  },
  // Estilo para o botão de login
  loginButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Altera a cor de fundo do botão para preto
    borderRadius: 20, // Torna o botão mais arredondado
    paddingVertical: 10, // Aumenta o espaço vertical dentro do botão
    paddingHorizontal: 20, // Aumenta o espaço horizontal dentro do botão
    marginTop: 20, // Adiciona um espaço entre as caixas de texto e o botão
  },
  loginButtonText: {
    color: 'white', // Altera a cor do texto do botão para branco
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButtonText: {
    marginTop: 10, // Adiciona um espaço entre o botão e o texto de alternância
  },
});

