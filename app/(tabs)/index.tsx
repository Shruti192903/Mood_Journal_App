import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Get Screen Dimensions for Particles ---
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Sentiment = {
  title: string;
  score: number;
  color: string;
  emoji: string;
  insight: string;
};

type Entry = {
  id: string;
  text: string;
  date: string;
  sentiment: Sentiment;
};

const GoldBarIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 8.44118L12 3L20.5 8.44118L12 13.8824L3.5 8.44118Z"
      stroke="#F9D423"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.5 12.5588L12 18L20.5 12.5588"
      stroke="#F9D423"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.5 16.6765L12 22L20.5 16.6765"
      stroke="#F9D423"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


const sentimentWords: Record<string, Record<string, number>> = {
  veryPositive: { 'extraordinary': 5, 'wonderful': 5, 'fantastic': 5, 'amazing': 5, 'terrific': 4, 'glowing': 5, 'incredible': 5 },
  positive: { 'happy': 3, 'great': 3, 'good': 2, 'pleased': 2, 'glad': 2, 'nice': 2, 'grateful': 4, 'blessed': 4 },
  negative: { 'bad': -2, 'sad': -3, 'angry': -3, 'upset': -2, 'worried': -2, 'anxious': -3, 'frustrated': -3, 'terrible': -4, 'horrible': -4, 'miserable': -4 },
  veryNegative: { 'awful': -5, 'dreadful': -5, 'devastating': -5, 'stressed': -5, 'depressed': -5, 'lonely': -5 },
};

// --- Refreshed Suggestions ---
const SUGGESTIONS = [
  "Need some rest and quiet time.",
  "Didn’t sleep much last night.",
  "This is terrible, I'm so stressed",
  "Just finished my project — so proud!",
  "Grateful for small things.",
];

// --- Particle Component ---
const Particle = memo(() => {
  const anim = useRef(new Animated.Value(0)).current;
  
  // Use useState to set random values once
  const [config] = useState(() => {
    const size = Math.random() * 3 + 2;
    return {
      size,
      startX: Math.random() * screenWidth,
      duration: Math.random() * 5000 + 8000, // 8-13 seconds
      delay: Math.random() * 8000,
    };
  });

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: config.duration,
        delay: config.delay,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [anim, config]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight + 20, -20], // Start from bottom, move to top
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0], // Fade in and out
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          left: config.startX,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
});

// --- Particle Container ---
const ParticleContainer = memo(() => (
  <View style={styles.particleContainer}>
    {Array.from({ length: 30 }).map((_, i) => (
      <Particle key={i} />
    ))}
  </View>
));


const EntryItem = memo(({ item }: { item: Entry }) => {
  const sentiment = item.sentiment;
  return (
    <View style={[styles.entryItem, { borderLeftColor: sentiment.color }]}>
      <View style={styles.entryHeader}>
        <Text style={[styles.entryTitle, { color: sentiment.color }]}>{sentiment.title}</Text>
        <Text style={[styles.entryScore, { color: sentiment.color }]}>{sentiment.score}</Text>
      </View>
      <Text style={styles.entryText}>{item.text}</Text>
      <Text style={styles.entryDate}>{item.date}</Text>
    </View>
  );
});

export default function HomeScreen() {
  const [moodText, setMoodText] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentSentiment, setCurrentSentiment] = useState<Sentiment | null>(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Animate layout changes when list/items appear
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [showHistory, currentSentiment, entries.length]);

  const analyzeSentiment = (text: string): Sentiment => {
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
      if (sentimentWords.veryPositive && sentimentWords.veryPositive[word]) score += sentimentWords.veryPositive[word];
      else if (sentimentWords.positive && sentimentWords.positive[word]) score += sentimentWords.positive[word];
      else if (sentimentWords.negative && sentimentWords.negative[word]) score += sentimentWords.negative[word];
      else if (sentimentWords.veryNegative && sentimentWords.veryNegative[word]) score += sentimentWords.veryNegative[word];
    }
    
    if (score >= 10) {
      return { title: 'Extremely Positive', score, color: '#F9D423', emoji: '🌟', insight: "Incredible energy! You're absolutely glowing!" };
    } else if (score >= 3) {
      return { title: 'Positive', score, color: '#FEF7C3', emoji: '😊', insight: 'Good vibes! Keep it up!' };
    } else if (score > -3) {
      return { title: 'Neutral', score, color: '#8E8E93', emoji: '😐', insight: 'An average day. What could make it better?' };
    } else if (score > -10) {
      return { title: 'Very Negative', score, color: '#FF9500', emoji: '😔', insight: "Remember: tough times don't last, tough people do." };
    } else {
      return { title: 'Extremely Negative', score, color: '#FF3B30', emoji: '💀', insight: 'You\'re going through a lot. Please reach out to someone.' };
    }
  };

  const handleAddEntry = () => {
    if (!moodText.trim()) {
      setError('Please enter some text about your mood');
      return;
    }
    setError('');
    try {
      const sentimentResult = analyzeSentiment(moodText);
      const newEntry: Entry = { id: Date.now().toString(), text: moodText, date: new Date().toLocaleString(), sentiment: sentimentResult };
      setEntries(prev => [newEntry, ...prev]);
      setCurrentSentiment(sentimentResult);
      setMoodText('');
    } catch (err: any) {
      console.error('Error analyzing mood:', err);
      setError(err.message || 'Error analyzing mood. Please try again.');
    }
  };

  const handleSuggestionClick = (text: string) => setMoodText(text);
  const handleClearText = () => { setMoodText(''); setCurrentSentiment(null); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.gradientBackground}>
        <ParticleContainer />
        <ScrollView 
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleContainer}>
            <GoldBarIcon />
            <Text style={styles.title}>MoodFlow</Text>
          </View>
          <Text style={styles.subtitle}>Express yourself, discover your vibe ✨</Text>

          {error ? (
             <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try these:</Text>
            <View style={styles.suggestionsChips}>
              {SUGGESTIONS.map(text => (
                <TouchableOpacity key={text} style={styles.suggestionChip} onPress={() => handleSuggestionClick(text)}>
                  <Text style={styles.suggestionChipText}>{text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>How are you feeling?</Text>
            <TextInput
              style={styles.input}
              value={moodText}
              onChangeText={(t) => { setMoodText(t); if (error) setError(''); if (currentSentiment) setCurrentSentiment(null); }}
              placeholder="Type your thoughts here..."
              placeholderTextColor="rgba(234, 234, 234, 0.3)" 
              multiline
            />
            <View style={styles.inputFooter}>
              <TouchableOpacity onPress={handleClearText} style={styles.clearButton}>
                <LinearGradient
                  colors={['#F9D423', '#FEF7C3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.clearButtonGradient}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.charCount}>{moodText.length} / 500</Text>
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              { opacity: pressed ? 0.9 : 1.0 }
            ]} 
            onPress={handleAddEntry}
          >
            <LinearGradient
              colors={['#FFFFFF', '#EAEAEA']} 
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Analyze Mood</Text>
            </LinearGradient>
          </Pressable>

          {currentSentiment && (
            <View style={[styles.resultCard, { borderTopColor: currentSentiment.color }]}> 
              <View style={styles.resultHeader}>
                <Text style={styles.resultEmoji}>{currentSentiment.emoji}</Text>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultTitle, { color: currentSentiment.color }]}>{currentSentiment.title}</Text>
                  <Text style={styles.resultScore}>Score: {currentSentiment.score}</Text>
                </View>
              </View>
              <Text style={styles.resultInsight}>{currentSentiment.insight}</Text>
            </View>
          )}

          {entries.length > 0 && (
            <TouchableOpacity style={styles.historyToggleButton} onPress={() => setShowHistory(!showHistory)}>
              <LinearGradient
                colors={['#F9D423', '#FEF7C3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.historyToggleGradient}
              >
                <Text style={styles.historyToggleText}>{showHistory ? 'Hide' : 'Show'} Recent History ({entries.length})</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {showHistory && entries.length > 0 && (
            <View style={styles.listContainer}>
              {entries.map(item => <EntryItem key={item.id} item={item} />)}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(249, 212, 35, 0.3)', 
    borderRadius: 5,
  },
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    color: '#F9D423', 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#8E8E93', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 59, 48, 0.1)', 
    borderColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1,
    padding: 10, 
    borderRadius: 16, 
    marginBottom: 10,
    overflow: 'hidden',
  },
  errorText: { 
    color: '#FF8A8A', 
    fontSize: 14, 
    textAlign: 'center',
  },

  suggestionsContainer: { 
    width: '100%', 
    marginBottom: 20 
  },
  suggestionsTitle: { 
    color: '#8E8E93', 
    fontSize: 14, 
    marginBottom: 10 
  },
  suggestionsChips: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  suggestionChip: { 
    backgroundColor: '#2C2C2E', 
    borderWidth: 1,
    borderColor: '#48484A', 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
  },
  suggestionChipText: { 
    color: '#AEAEB2', 
    fontSize: 12, 
    fontWeight: '500' 
  },

  inputCard: { 
    width: '100%', 
    backgroundColor: '#2C2C2E',
    borderRadius: 16, 
    padding: 15, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#48484A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  inputLabel: { 
    color: '#8E8E93', 
    fontSize: 14, 
    fontWeight: '500', 
    marginBottom: 10 
  },
  input: { 
    color: '#FFFFFF', 
    minHeight: 100, 
    fontSize: 16, 
    textAlignVertical: 'top' 
  },
  inputFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10 
  },
  clearButton: { 
    padding: 0,
    borderRadius: 15,
    overflow: 'hidden',
  },
  clearButtonGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: { 
    color: '#000000', 
    fontWeight: '500',
    fontSize: 14,
  },
  charCount: { 
    fontSize: 12, 
    color: '#636366',
  },

  button: { 
    width: '100%', 
    height: 50, 
    borderRadius: 25, 
    marginBottom: 20,
    shadowColor: '#FFF', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  buttonText: { 
    color: '#000000', 
    fontSize: 18, 
    fontWeight: '700' 
  },

  resultCard: { 
    width: '100%', 
    backgroundColor: '#2C2C2E', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20, 
    borderTopWidth: 5,
    borderWidth: 1,
    borderColor: '#48484A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  resultHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    marginBottom: 15 
  },
  resultEmoji: { 
    fontSize: 40 
  },
  resultInfo: { 
    flex: 1 
  },
  resultTitle: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#FFFFFF'
  },
  resultScore: { 
    fontSize: 14, 
    color: '#8E8E93' 
  },
  resultInsight: { 
    fontSize: 16, 
    color: '#EAEAEA', 
    lineHeight: 22 
  },

  historyToggleButton: { 
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  historyToggleGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  historyToggleText: { 
    color: '#000000', 
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center'
  },

  listContainer: { 
    width: '100%' 
  },
  entryItem: { 
    backgroundColor: '#2C2C2E', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#48484A', 
    borderLeftWidth: 4 
  },
  entryHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  entryTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#EAEAEA',
  },
  entryScore: { 
    fontSize: 14, 
    fontWeight: '700',
    color: '#EAEAEA',
  },
  entryText: { 
    fontSize: 14, 
    color: '#AEAEB2',
    lineHeight: 20 
  },
  entryDate: { 
    fontSize: 12, 
    color: '#636366',
    marginTop: 10 
  },
});