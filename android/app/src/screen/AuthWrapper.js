import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native'; // Added StatusBar import
import auth from '@react-native-firebase/auth';

import HomeScreen from './HomeScreen';
import SignUp from './SignUp';
import Tabnavigator from './Tabnavigator';
import ChatScreen from './ChatScreen';
import CommentScreen from './CommentScreen';
import Settings from './Settings';
import Username from './Username';
// import ChatScreen from './ChatScreen';
import MessageRequestsScreen from './MessageRequestsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        user.emailVerified ? (
          <>
            <Stack.Screen name="Tabnavigator" component={Tabnavigator} />
            <Stack.Screen name="Username" component={Username} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            
          
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen
              name="CommentScreen"
              component={CommentScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1e1e1e' },
                headerTintColor: '#fff',
            headerTitleStyle: {fontWeight: 'bold' },
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="Tabnavigator" component={Tabnavigator} />
            <Stack.Screen name="Username" component={Username} />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      )}

    </Stack.Navigator>
  );
}

export default function AuthWrapper() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) return null;

  return (
    <>
      {/* StatusBar configuration for dark content on light background */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff" 
        translucent={false}
        hidden={false}
      />
      <NavigationContainer key={user ? 'user' : 'guest'}>
        <AppNavigator user={user} />
      </NavigationContainer>
    </>
  );
}
//do not add navigation back to home page after logout or deletions as authcjange will handle it 