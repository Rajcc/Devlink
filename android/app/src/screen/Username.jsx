// Alternative simple profile creation function to test
  // const createSimpleProfile = async (userId, username) => {
  //   try {
  //     console.log('=== SIMPLE PROFILE CREATION ===');
      
  //     const simpleData = {
  //       username: username,
  //       test: 'simple test'
  //     };
      
  //     console.log('Creating simple profile with data:', simpleData);
      
  //     await firestore().collection('profile').doc(userId).set(simpleData);
  //     console.log('Simple profile created');
      
  //     // Verify
  //     const doc = await firestore().collection('profile').doc(userId).get();
  //     console.log('Simple profile verification - exists:', doc.exists);
  //     console.log('Simple profile data:', doc.data());
      
  //     return doc.exists && doc.data();
      
  //   } catch (error) {
  //     console.error('Simple profile creation failed:', error);
  //     return false;
  //   }
  // };

import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Username = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Simplified and fixed profile creation function
  const createUserProfile = async (userId, username) => {
    try {
      console.log('=== PROFILE CREATION START ===');
      console.log('Creating profile for user:', userId);
      console.log('Username:', username);
      
      const profileRef = firestore().collection('profile').doc(userId);
      console.log('Profile reference created:', profileRef.path);
      
      // Check if profile already exists
      console.log('Checking if profile exists...');
      const profileDoc = await profileRef.get();
      console.log('Profile exists check completed. Exists:', profileDoc.exists);

      // Check if profile document exists AND has meaningful data
      const existingData = profileDoc.exists ? profileDoc.data() : null;
      const hasValidData = existingData && existingData.username && typeof existingData.followersCount === 'number';
      
      if (!profileDoc.exists || !hasValidData) {
        if (profileDoc.exists && !hasValidData) {
          console.log('Profile exists but has incomplete data, recreating...');
          console.log('Existing data:', existingData);
        } else {
          console.log('Profile does not exist, creating new profile...');
        }
        
        // Use simpler data structure without serverTimestamp for now
        const initialProfile = {
          username: username,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          avatar: 'https://cdn.britannica.com/84/232784-050-1769B477/Siberian-Husky-dog.jpg',
          bio: '',
          location: '',
          website: '',
          joinedDate: new Date().toLocaleDateString('en-US'),
          createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp
          updatedAt: new Date().toISOString()
        };

        console.log('Profile data to be saved:');
        console.log('- username:', initialProfile.username);
        console.log('- followersCount:', initialProfile.followersCount);
        console.log('- followingCount:', initialProfile.followingCount);
        console.log('- postsCount:', initialProfile.postsCount);
        console.log('- avatar:', initialProfile.avatar);
        console.log('- bio:', initialProfile.bio);
        console.log('- location:', initialProfile.location);
        console.log('- website:', initialProfile.website);
        console.log('- joinedDate:', initialProfile.joinedDate);
        
        // Force overwrite the document (don't merge)
        console.log('Attempting to overwrite profile document...');
        
        try {
          await profileRef.set(initialProfile, { merge: false }); // Explicitly don't merge
          console.log('Profile document set() completed without errors');
        } catch (writeError) {
          console.error('Error during profile write:', writeError);
          throw writeError;
        }
        
        // Wait longer for Firestore to process
        console.log('Waiting for Firestore to process...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time
        
        // Verify the document was created with data
        console.log('Verifying profile document creation...');
        let verifyDoc;
        let attempts = 0;
        const maxAttempts = 5;
        
        // Retry verification multiple times
        while (attempts < maxAttempts) {
          try {
            verifyDoc = await profileRef.get();
            console.log(`Verification attempt ${attempts + 1}:`);
            console.log('- Document exists:', verifyDoc.exists);
            
            if (verifyDoc.exists) {
              const data = verifyDoc.data();
              console.log('- Document has data:', data ? Object.keys(data).length > 0 : false);
              
              if (data && Object.keys(data).length > 0) {
                console.log('✅ Profile document created successfully with data');
                console.log('Saved profile data:', JSON.stringify(data, null, 2));
                return { success: true, data: data };
              } else {
                console.log('⚠️ Document exists but has no data, retrying...');
              }
            } else {
              console.log('⚠️ Document does not exist yet, retrying...');
            }
            
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between attempts
            }
          } catch (verifyError) {
            console.error(`Verification attempt ${attempts + 1} failed:`, verifyError);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        // If we get here, verification failed
        console.error('❌ Profile document verification failed after all attempts');
        throw new Error('Profile document was created but data verification failed');
        
      } else if (hasValidData) {
        console.log('Profile document already exists with valid data');
        const existingData = profileDoc.data();
        console.log('Existing profile data:', JSON.stringify(existingData, null, 2));
        
        // Update the existing profile with new username if different
        if (existingData.username !== username) {
          console.log('Updating username in existing profile...');
          await profileRef.update({
            username: username,
            updatedAt: new Date().toISOString()
          });
          console.log('Username updated in profile');
        }
        
        return { success: true, data: existingData, existed: true };
      }
    } catch (error) {
      console.error('❌ ERROR in createUserProfile:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', error);
      
      // Check for specific Firebase errors
      if (error.code === 'permission-denied') {
        console.error('🚫 PERMISSION DENIED - Check Firestore security rules');
        throw new Error('Permission denied. Check Firestore security rules for the profile collection.');
      } else if (error.code === 'network-request-failed') {
        console.error('🌐 NETWORK ERROR - Check internet connection');
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'unavailable') {
        console.error('🔄 FIRESTORE UNAVAILABLE - Service temporarily unavailable');
        throw new Error('Firestore service is temporarily unavailable. Please try again.');
      }
      
      throw error;
    } finally {
      console.log('=== PROFILE CREATION END ===');
    }
  };

  // Function to force recreate profile (for debugging)
  const forceRecreateProfile = async (userId, username) => {
    try {
      console.log('=== FORCE RECREATING PROFILE ===');
      
      // Delete existing profile document first
      await firestore().collection('profile').doc(userId).delete();
      console.log('Existing profile deleted');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new profile with complete data
      const newProfile = {
        username: username,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        avatar: 'https://cdn.britannica.com/84/232784-050-1769B477/Siberian-Husky-dog.jpg',
        bio: '',
        location: '',
        website: '',
        joinedDate: new Date().toLocaleDateString('en-US'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await firestore().collection('profile').doc(userId).set(newProfile);
      console.log('New profile created successfully');
      
      // Verify
      const doc = await firestore().collection('profile').doc(userId).get();
      console.log('Verification - exists:', doc.exists);
      console.log('Verification - data:', doc.data());
      
      return { success: doc.exists && doc.data(), data: doc.data() };
    } catch (error) {
      console.error('Force recreate failed:', error);
      throw error;
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    setLoading(true);

    try {
      console.log('=== USERNAME SAVE START ===');
      const currentUser = auth().currentUser;
      console.log('Current user:', currentUser ? currentUser.uid : 'No user');
      console.log('User email:', currentUser?.email);
      
      if (!currentUser || !currentUser.uid) {
        Alert.alert('Error', 'User not found. Please try logging in again.');
        setLoading(false);
        return;
      }

      console.log('Saving username for user:', currentUser.uid);
      console.log('Username to save:', username.trim());

      // First, test if basic Firestore write works
      console.log('Testing basic Firestore write...');
      const testResult = await createSimpleProfile(currentUser.uid, username.trim());
      
      if (!testResult) {
        throw new Error('Basic Firestore write test failed');
      }
      
      console.log('✅ Basic Firestore test passed');

      // Update username in users collection
      console.log('Updating users collection...');
      await firestore().collection('users').doc(currentUser.uid).set({
        username: username.trim(),
        email: currentUser.email,
        updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('✅ Username saved successfully in users collection');

      // Create full profile document (try force recreate first if there's an empty document)
      console.log('Creating full user profile...');
      
      // First try force recreating to ensure clean slate
      let profileResult;
      try {
        profileResult = await forceRecreateProfile(currentUser.uid, username.trim());
      } catch (recreateError) {
        console.log('Force recreate failed, trying normal creation:', recreateError.message);
        profileResult = await createUserProfile(currentUser.uid, username.trim());
      }
      
      if (profileResult.success) {
        console.log('✅ Profile creation completed successfully');
        
        Alert.alert(
          'Success', 
          profileResult.existed 
            ? 'Username updated successfully!' 
            : 'Username and profile created successfully!', 
          [{
            text: 'OK',
            onPress: () => navigation.replace('Tabnavigator')
          }]
        );
      } else {
        throw new Error('Profile creation failed');
      }
      
    } catch (error) {
      console.error('❌ ERROR in handleSaveUsername:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error object:', error);
      
      Alert.alert(
        'Error', 
        `Failed to save username and profile: ${error.message}\n\nPlease check the console for detailed error information.`
      );
    } finally {
      setLoading(false);
      console.log('=== USERNAME SAVE END ===');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose Your Username</Text>
      
      <TextInput 
        style={styles.userInput}
        placeholder="Enter Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />
      
      <Pressable 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSaveUsername}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>

      {loading && (
        <Text style={styles.loadingText}>Setting up your profile...</Text>
      )}
    </SafeAreaView>
  );
};

export default Username;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  userInput: {
    height: 50,
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'black',
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
});