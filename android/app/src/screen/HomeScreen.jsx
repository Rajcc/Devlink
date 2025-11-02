import { StyleSheet, Text, View, SafeAreaView, TextInput, StatusBar, Pressable, Alert, TouchableOpacity, Platform } from 'react-native';
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const getStatusBarHeight = () => {
  return Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      await firestore().collection('users').doc(userCredential.user.uid).set({
        email: email,
      });
      await userCredential.user.sendEmailVerification();
      Alert.alert('Success', 'Verification email sent. Please verify before continuing.');
      navigation.navigate('SignUp');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password should be at least 6 characters');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      const user = auth().currentUser;
      if (!user.emailVerified) {
        Alert.alert('Email Not Verified', 'Please verify your email before logging in.');
        navigation.navigate('SignUp');
        return;
      }

      Alert.alert('Success', 'Logged in');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No account found');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content', true);
        StatusBar.setBackgroundColor('#ffffff', true);
      }
    }, [])
  );

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <View style={styles.statusBarSpacer} />
      <View style={styles.separator} />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.text}>
            //DEVLINK....//
          </Text>
        </View>

      <TextInput
        style={styles.input}
        placeholder='Enter email'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input2}
        placeholder='Enter password'
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.Pressable} onPress={handleSignIn}>
        <Text style={styles.text2}>
          sign in
        </Text>
      </TouchableOpacity>

      <Text style={styles.text3}>
        or
      </Text>

      <TouchableOpacity style={styles.Pressable} onPress={handleSignUp}>
        <Text style={styles.text4}>
          sign up
        </Text>
      </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    alignItems: 'center'
  },
  text: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 10,
    shadowOpacity: 50
  },
  separator: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  card: {
    backgroundColor: 'orange',
    width: 350,
    height: 50,
    borderColor: 'black',
    borderRadius: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 15,
    marginRight: 30,
    marginLeft: 30,
    marginVertical: 2,
    alignItems: "center",
    marginTop: 20
  },
  statusBarSpacer: {
    height: getStatusBarHeight(),
    backgroundColor: '#ffffff',
  },
  input: {
    width: 350,
    height: 55,
    backgroundColor: 'white',
    borderColor: 'black',
    marginTop: 150,
    fontWeight: 'bold',
    shadowOpacity: 1,
    paddingHorizontal: 15,
  },
  input2: {
    width: 350,
    height: 55,
    backgroundColor: 'white',
    borderColor: 'black',
    marginTop: 10,
    fontWeight: 'bold',
    shadowOpacity: 1,
    paddingHorizontal: 15,
  },
  text3: {
    marginTop: 2,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 15,
  },
  Pressable: {
    height: 40,
    width: 350,
    backgroundColor: "green",
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  text2: {
    marginTop: 7,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'white'
  },
  text4: {
    marginTop: 7,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'white'
  }
});