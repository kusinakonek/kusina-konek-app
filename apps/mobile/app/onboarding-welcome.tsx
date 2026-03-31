import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { wp, hp, fp } from '../src/utils/responsive';
import { ArrowRight, Heart, Users, MapPin, Gift } from 'lucide-react-native';

export default function OnboardingWelcome() {
  const { colors } = useTheme();
  const { role } = useAuth();
  const { nextStep, skipOnboarding, setCurrentStep } = useOnboarding();

  const handleStart = () => {
    setCurrentStep('dashboard');
    router.replace('/(tabs)'); // Go to main app to start tutorial
  };

  const handleSkip = () => {
    skipOnboarding();
    router.replace('/(tabs)');
  };

  const features = role === 'DONOR' ? [
    {
      icon: <Gift size={fp(8)} color="#00C853" />,
      title: 'Share Food',
      description: 'Easily donate surplus food to help families in need',
    },
    {
      icon: <Users size={fp(8)} color="#00C853" />,
      title: 'Track Impact',
      description: 'See how many families you\'ve helped and track your donations',
    },
    {
      icon: <MapPin size={fp(8)} color="#00C853" />,
      title: 'Set Locations',
      description: 'Choose convenient pickup locations for recipients',
    },
    {
      icon: <Heart size={fp(8)} color="#00C853" />,
      title: 'Get Feedback',
      description: 'Receive ratings and thanks from grateful recipients',
    },
  ] : [
    {
      icon: <Gift size={fp(8)} color="#00C853" />,
      title: 'Find Food',
      description: 'Browse available food donations near your location',
    },
    {
      icon: <MapPin size={fp(8)} color="#00C853" />,
      title: 'Easy Pickup',
      description: 'Get directions to pickup locations and track donations',
    },
    {
      icon: <Users size={fp(8)} color="#00C853" />,
      title: 'Connect',
      description: 'Chat with donors and coordinate pickup times',
    },
    {
      icon: <Heart size={fp(8)} color="#00C853" />,
      title: 'Give Thanks',
      description: 'Rate donations and send appreciation to generous donors',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '10', colors.background]}
        style={styles.gradient}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/KusinaKonek-Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome to KusinaKonek!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {role === 'DONOR' 
              ? "Let's show you how to share food and make a difference"
              : "Let's help you find and claim food donations in your area"
            }
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            Here's what you can do:
          </Text>
          
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.featureIcon}>
                {feature.icon}
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tutorial Info */}
        <View style={[styles.tutorialInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tutorialTitle, { color: colors.text }]}>
            Quick Tutorial
          </Text>
          <Text style={[styles.tutorialDescription, { color: colors.textSecondary }]}>
            We'll guide you through the key features with interactive highlights. 
            It only takes 2-3 minutes and you can skip at any time.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip tutorial
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: '#00C853' }]} 
          onPress={handleStart}
        >
          <Text style={styles.startButtonText}>Start Tutorial</Text>
          <ArrowRight size={fp(5)} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(12),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  logo: {
    width: wp(30),
    height: hp(15),
    marginBottom: hp(2),
  },
  welcomeText: {
    fontSize: fp(9), // Even bigger welcome text
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  subtitle: {
    fontSize: fp(5), // Bigger subtitle
    textAlign: 'center',
    lineHeight: fp(7),
    paddingHorizontal: wp(4),
  },
  featuresContainer: {
    marginBottom: hp(4),
  },
  featuresTitle: {
    fontSize: fp(7), // Bigger features title
    fontWeight: '600',
    marginBottom: hp(3),
  },
  featureCard: {
    flexDirection: 'row',
    padding: wp(5), // More padding
    borderRadius: 16,
    marginBottom: hp(2.5), // More margin
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  featureIcon: {
    marginRight: wp(5), // More spacing
    marginTop: hp(0.5),
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fp(6), // Bigger feature title
    fontWeight: '600',
    marginBottom: hp(0.8),
  },
  featureDescription: {
    fontSize: fp(4.5), // Bigger feature description
    lineHeight: fp(6.5),
  },
  tutorialInfo: {
    padding: wp(4),
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: hp(2),
  },
  tutorialTitle: {
    fontSize: fp(5.5),
    fontWeight: '600',
    marginBottom: hp(1),
  },
  tutorialDescription: {
    fontSize: fp(4),
    lineHeight: fp(5.5),
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2.5),
    borderTopWidth: 1,
  },
  skipButton: {
    padding: wp(3),
  },
  skipText: {
    fontSize: fp(4),
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(2.2), // Taller button
    paddingHorizontal: wp(8), // Wider button
    borderRadius: 16, // Bigger radius
    gap: wp(3),
  },
  startButtonText: {
    color: '#fff',
    fontSize: fp(5.5), // Bigger button text
    fontWeight: '700',
  },
});