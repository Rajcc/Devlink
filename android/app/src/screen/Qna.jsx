import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  SafeAreaView, Modal, FlatList, Dimensions, StatusBar, Platform, Alert, TextInput
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useUserData } from '../users';
import Firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');
const getStatusBarHeight = () => {
  return Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
};

const Qna = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const selectedQuestionIdFromRoute = route.params?.selectedQuestionId;
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const { 
    profile, 
    loading, 
    followingQuestions, 
    currentUser,
    cacheImage,
    getCachedImageUri 
  } = useUserData();

  const currentUsername = profile?.username;

  useFocusEffect(
    React.useCallback(() => {
      if (!route.params?.selectedQuestionId) {
        setSelectedQuestion(null);
      }
    }, [route.params?.selectedQuestionId])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (selectedQuestion) {
        const unsubscribe = Firestore()
          .collection('questions')
          .doc(selectedQuestion.id)
          .onSnapshot((doc) => {
            if (doc.exists) {
              const updated = doc.data();
              setSelectedQuestion(prev => ({
                ...prev,
                ...updated,
                answers: updated.answers || []
              }));
            }
          });

        return () => unsubscribe();
      }
    }, [selectedQuestion?.id])
  );

  useEffect(() => {
    if (selectedQuestionIdFromRoute && questions.length > 0) {
      const specificQuestion = questions.find(q => q.id === selectedQuestionIdFromRoute);
      if (specificQuestion) {
        setSelectedQuestion(specificQuestion);
      }
    }
  }, [selectedQuestionIdFromRoute, questions]);

  useEffect(() => {
    if (selectedQuestionIdFromRoute && selectedQuestion) {
      navigation.setParams({ selectedQuestionId: undefined });
    }
  }, [selectedQuestionIdFromRoute, selectedQuestion, navigation]);

  const toDate = (timestamp) => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.toDate) return timestamp.toDate();
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (typeof timestamp === 'number') return new Date(timestamp);
    return new Date();
  };

  const questions = useMemo(() => {
    if (!followingQuestions || followingQuestions.length === 0) {
      return [];
    }

    return followingQuestions.map(question => ({
      id: question.id,
      title: question.title || question.question || 'Untitled Question',
      content: question.content || question.description || '',
      username: question.username || 'Anonymous',
      userImage: getCachedImageUri(question.userImage || question.avatar || 'https://placehold.co/100'),
      timestamp: toDate(question.createdAt || question.timestamp),
      answers: (question.answers || []).map(ans => ({
        ...ans,
        timestamp: toDate(ans.timestamp || ans.createdAt),
        replies: (ans.replies || []).map(reply => ({
          ...reply,
          timestamp: toDate(reply.timestamp)
        }))
      })),
      tags: question.tags || [],
      authorId: question.userId || question.authorId,
      imageUrl: question.imageUrl ? getCachedImageUri(question.imageUrl) : null
    }));
  }, [followingQuestions, getCachedImageUri]);

  const filteredQuestions = useMemo(() => {
    if (!questions || questions.length === 0) {
      return [];
    }

    return questions
      .filter(q => q.username !== currentUsername)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [questions, currentUsername]);

  const formatDate = (date) => {
    try {
      const validDate = toDate(date);
      return validDate.toLocaleDateString() + ' ' +
        validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'now';
    
    const now = new Date();
    const itemTime = toDate(timestamp);
    const diffMs = now - itemTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return itemTime.toLocaleDateString();
  };

  // Question Card
  const QuestionCard = React.memo(({ question }) => (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => {
        setTimeout(() => setSelectedQuestion(question), 150);
      }}
    >
      <View style={styles.questionHeader}>
        <Image source={{ uri: question.userImage }} style={styles.userAvatar} />
        <View style={styles.questionMeta}>
          <Text style={styles.username}>@{question.username}</Text>
          <Text style={styles.timestamp}>{formatDate(question.timestamp)}</Text>
        </View>
      </View>
      <Text style={styles.questionTitle}>{question.title}</Text>
      <Text style={styles.questionContent} numberOfLines={2}>
        {question.content}
      </Text>
      
      {question.imageUrl && (
        <Image source={{ uri: question.imageUrl }} style={styles.questionImage} />
      )}
      
      {question.tags && question.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {question.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.answerCount}>
        <Text style={styles.answerCountText}>
          {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
        </Text>
      </View>
    </TouchableOpacity>
  ));

  // Reply Item Component
  const ReplyItem = React.memo(({ reply, parentAnswerId }) => {
  return (
    <View style={styles.replyContainer}>
      <Image 
        source={{ uri: getCachedImageUri(reply.userImage) || reply.userImage || 'https://placehold.co/100' }} 
        style={styles.replyAvatar} 
      />
      <View style={styles.replyContent}>
        <Text style={styles.replyText}>
          <Text style={styles.replyUsername}>{reply.username}</Text> {reply.content}
        </Text>
        
        {/* Add code block rendering for replies */}
        {reply.code && (
          <View style={styles.replyCodeBlock}>
            <Text style={styles.codeText}>{reply.code}</Text>
          </View>
        )}
        
        {/* Add image rendering for replies - check both formats */}
        {reply.image && (
          <Image 
            source={{ uri: reply.image.uri || reply.image }} 
            style={styles.replyImage} 
          />
        )}
        
        <View style={styles.replyActions}>
          <Text style={styles.replyTimestamp}>
            {formatTimestamp(reply.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
});

  // Answer Component
  const AnswerItem = React.memo(({ answer }) => {
    return (
      <View style={styles.answerItem}>
        <View style={styles.answerHeader}>
          <View style={styles.answerUserInfo}>
            <Image 
              source={{ uri: getCachedImageUri(answer.userImage) || answer.userImage || 'https://placehold.co/100' }} 
              style={styles.answerUserAvatar} 
            />
            <Text style={styles.answerUsername}>@{answer.username}</Text>
          </View>
          <Text style={styles.answerTimestamp}>{formatTimestamp(answer.timestamp)}</Text>
        </View>
        <Text style={styles.answerContent}>{answer.content}</Text>
        {answer.code && (
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{answer.code}</Text>
          </View>
        )}
        {answer.image && (
          <Image source={{ uri: answer.image.uri }} style={styles.answerImage} />
        )}

        {/* Replies Section */}
        {answer.replies && answer.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            <Text style={styles.repliesTitle}>
              {answer.replies.length} {answer.replies.length === 1 ? 'Reply' : 'Replies'}
            </Text>
            {answer.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} parentAnswerId={answer.id} />
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.replyButton} 
          onPress={() => navigation.navigate('Answer', {
            question: selectedQuestion,
            replytouser: answer,
            isreply: true
          })}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>
    );
  });

  // Question List View
  const QuestionListView = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1e1e" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Developer Q&A</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#aaa', fontSize: 16 }}>Loading questions...</Text>
        </View>
      ) : filteredQuestions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
          <Text style={{ color: '#aaa', fontSize: 18, fontWeight: '600' }}>
            {followingQuestions.length === 0 
              ? "Follow some users to see their questions here" 
              : "No questions from followed users yet"
            }
          </Text>
          {followingQuestions.length === 0 && (
            <Text style={{ color: '#999', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
              Discover and follow other developers to see their questions and contribute with your answers.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredQuestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <QuestionCard question={item} />}
          contentContainerStyle={styles.questionsList}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
        />
      )}
    </View>
  );

  // Question Detail View
  const QuestionDetailView = React.memo(() => {
    const sortedAnswers = useMemo(() => {
      if (!selectedQuestion?.answers) return [];
      return [...selectedQuestion.answers].sort((a, b) => 
        toDate(b.timestamp) - toDate(a.timestamp)
      );
    }, [selectedQuestion]);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e1e1e" />
        <View style={styles.statusBarSpacer} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedQuestion(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.answerButton}
            onPress={() => navigation.navigate('Answer', { question: selectedQuestion })}
          >
            <Text style={styles.answerButtonText}>Answer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.questionDetail}>
          {/* Question Section */}
          <View style={styles.questionDetailHeader}>
            <Image source={{ uri: selectedQuestion.userImage }} style={styles.detailUserAvatar} />
            <View style={styles.detailUserInfo}>
              <Text style={styles.detailUsername}>@{selectedQuestion.username}</Text>
              <Text style={styles.detailTimestamp}>{formatDate(selectedQuestion.timestamp)}</Text>
            </View>
          </View>
          <Text style={styles.detailTitle}>{selectedQuestion.title}</Text>
          <Text style={styles.detailContent}>{selectedQuestion.content}</Text>

          {selectedQuestion.imageUrl && (
            <Image source={{ uri: selectedQuestion.imageUrl }} style={styles.questionImage} />
          )}

          {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
            <View style={styles.detailTagsContainer}>
              {selectedQuestion.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* All Answers Section */}
          <View style={styles.answersSection}>
            <Text style={styles.answersTitle}>
              {sortedAnswers.length === 0
                ? 'No Answers Yet'
                : `${sortedAnswers.length} ${sortedAnswers.length === 1 ? 'Answer' : 'Answers'}`
              }
            </Text>
            {sortedAnswers.map((answer) => (
              <AnswerItem key={answer.id} answer={answer} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e' }}>
        <Text style={{ color: 'white' }}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <>
      {selectedQuestion ? <QuestionDetailView /> : <QuestionListView />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  statusBarSpacer: {
    height: getStatusBarHeight(),
    backgroundColor: '#1e1e1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 70,
    paddingTop: getStatusBarHeight()
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    paddingVertical: 8,
    position: 'absolute',
    left: 16, 
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  answerButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'absolute',
    right: 16,
  },
  answerButtonText: {
    color: '#1e1e1e',
    fontWeight: '600',
  },
  questionsList: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    borderBottomRadius: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  questionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  questionImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  questionMeta: {
    flex: 1,
  },
  username: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#e8f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  answerCount: {
    alignSelf: 'flex-end',
  },
  answerCountText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionDetail: {
    flex: 1,
    padding: 16,
  },
  questionDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  detailUserInfo: {
    flex: 1,
  },
  detailUsername: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  detailTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  detailContent: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 16,
  },
  answersSection: {
    marginTop: 24,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  answerItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  answerUsername: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  answerTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  answerContent: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00ff00',
  },
  answerImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'cover',
  },
  repliesContainer: {
    marginTop: 16,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#555',
  },
  repliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 12,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  replyAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyText: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 18,
  },
  replyUsername: {
    fontWeight: '600',
    color: '#007AFF',
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  replyTimestamp: {
    color: '#666',
    fontSize: 11,
  },
  replyButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  replyButtonText: {
    color: '#1e1e1e',
    fontWeight: '600',
    fontSize: 13,
  },
  replyCodeBlock: {
  backgroundColor: '#1a1a1a',
  borderRadius: 6,
  padding: 8,
  marginTop: 8,
  borderWidth: 1,
  borderColor: '#444',
},
replyImage: {
  width: '100%',
  height: 150,
  borderRadius: 8,
  marginTop: 8,
  resizeMode: 'cover',
},
});
export default Qna;