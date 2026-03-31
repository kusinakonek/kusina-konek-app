import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { wp, hp, fp } from '../src/utils/responsive';
import { CheckCircle, ArrowRight, RotateCcw } from 'lucide-react-native';

export default function OnboardingComplete() {
  const { colors } = useTheme();
  const { role } = useAuth();
  const { completeOnboarding } = useOnboarding();

  const handleComplete = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleRestart = () => {
    router.replace('/onboarding-welcome');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#00C853', '#00A844', '#00E676']}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <CheckCircle size={fp(20)} color="#00C853" />
        </View>

        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]}>
          You're All Set! 🎉
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {role === 'DONOR' 
            ? "You now know how to donate food and help families in your community. Start sharing your blessings today!"
            : "You're ready to find and claim food donations in your area. Let's help you get the food you need!"
          }
        </Text>

        {/* Features recap */}
        <View style={[styles.recapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.recapTitle, { color: colors.text }]}>
            What you learned:
          </Text>
          {role === 'DONOR' ? (
            <>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to view your donation dashboard and impact
              </Text>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to add and manage food donations
              </Text>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to track active donations and communicate
              </Text>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to manage your profile and settings
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to browse and search for available food
              </Text>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to use your cart and claim donations
              </Text>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to track your claims and communicate
              </Text>
              <Text style={[styles.recapItem, { color: colors.textSecondary }]}>
                • How to manage your profile and preferences
              </Text>
            </>
          )}
        </View>

        {/* Help text */}
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          Need help later? You can always find tutorial hints in the Settings menu.
        </Text>
      </View>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={handleRestart} style={styles.restartButton}>
          <RotateCcw size={fp(4)} color={colors.textSecondary} />
          <Text style={[styles.restartText, { color: colors.textSecondary }]}>
            Restart tutorial
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.completeButton, { backgroundColor: '#00C853' }]} 
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Start Using KusinaKonek</Text>
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
    opacity: 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(8),
    alignItems: 'center',
  },
  iconContainer: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(4),
  },
  title: {
    fontSize: fp(8),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: fp(4.5),
    textAlign: 'center',
    lineHeight: fp(6),
    marginBottom: hp(4),
    paddingHorizontal: wp(4),
  },
  recapCard: {
    width: '100%',
    padding: wp(5),
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: hp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recapTitle: {
    fontSize: fp(5.5),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  recapItem: {
    fontSize: fp(4),
    lineHeight: fp(5.5),
    marginBottom: hp(1),
  },
  helpText: {
    fontSize: fp(4),
    textAlign: 'center',
    lineHeight: fp(5.5),
    fontStyle: 'italic',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2.5),
    borderTopWidth: 1,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    gap: wp(2),
  },
  restartText: {
    fontSize: fp(4),
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(6),
    borderRadius: 12,
    gap: wp(2),
  },
  completeButtonText: {
    color: '#fff',
    fontSize: fp(4.5),
    fontWeight: '600',
  },
});