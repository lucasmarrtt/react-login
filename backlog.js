import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAo0P1UApKPwIBq8HTAt3nNe2mnL_aHV4s",
  authDomain: "lucas-project-16d02.firebaseapp.com",
  projectId: "lucas-project-16d02",
  storageBucket: "lucas-project-16d02.appspot.com",
  messagingSenderId: "382780321106",
  appId: "1:382780321106:web:1b4f56a28c658a79c49e8b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_KEY = '';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [origem, setOrigem] = useState({ endereco: '', coordenada: null });
  const [destino, setDestino] = useState({ endereco: '', coordenada: null });
  const [distancia, setDistancia] = useState(null);
  const [preco, setPreco] = useState(null);

  const origemRef = useRef(null);
  const destinoRef = useRef(null);

  useEffect(() => {
    obterLocalizacaoAsync();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  const obterLocalizacaoAsync = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada');
      return;
    }
  };

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

  const calcularDistancia = (coordenadaOrigem, coordenadaDestino) => {
    const R = 6371;
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

  const paraRadianos = (graus) => {
    return graus * (Math.PI / 180);
  };

  const calcularPreco = (distancia) => {
    return distancia * 2;
  };

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
        ref.current.blur();
      } else {
        Alert.alert('Endereço não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error);
      Alert.alert('Ocorreu um erro ao obter coordenadas.');
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert('Erro ao fazer login', error.message);
    }
  };

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert('Erro ao criar conta', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Erro ao sair', error.message);
    }
  };

  const toggleAuthMode = () => {
    setIsCreatingAccount(!isCreatingAccount);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        
        <View style={styles.loginContainer}>
        <Image
          source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqOLUyMWiSwm8mu7Dwx1sfa9YpQ-13O_iES0GZXBafWQ&s' }}
          style={styles.logo}
        />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={isCreatingAccount ? handleRegister : handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>{isCreatingAccount ? 'Criar conta' : 'Entrar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.switchButtonText}>{isCreatingAccount ? 'Já tem uma conta? Entre!' : 'Ainda não tem uma conta? Registre-se'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
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
    marginTop: 0,
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
    width: 130,
    height: 130,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 0,
  },
  loginButton: {
    width: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    borderRadius: 5,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchButtonText: {
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
