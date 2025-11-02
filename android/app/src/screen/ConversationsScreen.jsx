import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Post from '../Post';
import { useUserData } from '../users'; // <-- use context for cached posts and user data

const ConversationsScreen = () => {
  const { loading, followingPosts,getCachedImageUri}= useUserData();
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: 'white' }}>Loading conversations...</Text>
      </View>
    );
  }


  // Handle case when there are no posts yet
  if (!followingPosts || followingPosts.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: 'white' }}>No posts available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.feed}>
      {followingPosts.map((item, index) => (
        
        <Post
          key={item.id || item.postId || index}
          postsId={item.id || item.postId} // If Firestore posts have id use it, else index fallback
          name={item.username || 'Anonymous'}
          image={item.imageUrl || item.avatarUrl}
          Avatar={item.userAvatar} // adjust depending on your schema
          caption={item.caption || item.content}
          initialLikeCount={item.likeCount || 0}
          initialLikedBy={item.likedBy|| []} 
          createdAt={item.createdAt}

        />
      ))}
    </ScrollView>
  );
};

export default ConversationsScreen;

const styles = StyleSheet.create({
  feed: {
    paddingVertical: 10,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
