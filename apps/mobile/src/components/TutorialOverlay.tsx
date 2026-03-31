import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Spotlight } from './Spotlight';
import { useTheme } from '../../context/ThemeContext';
import { wp, hp, fp } from '../utils/responsive';
import { ArrowRight, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialOverlayProps {
  visible: boolean;
  title: string;
  description: string;
  targetX?: number;
  targetY?: number;
  targetWidth?: number;
  targetHeight?: number;
  borderRadius?: number;
  cardPosition?: 'top' | 'bottom' | 'center';
  currentStep?: number;
  totalSteps?: number;
  onNext?: () => void;
  onSkip?: () => void;
  nextButtonText?: string;
  showSkip?: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  title,
  description,
  targetX,
  targetY,
  targetWidth,
  targetHeight,
  borderRadius,
  cardPosition = 'bottom',
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  nextButtonText = 'Next',
  showSkip = true,
}) => {
  const { colors } = useTheme();

  const getCardPositionStyle = () => {
    if (!targetY) return styles.cardBottom;
    
    const cardHeight = 300; // Increased card height estimate
    const spaceAbove = targetY;
    const spaceBelow = Dimensions.get('window').height - (targetY + (targetHeight || 0));

    if (cardPosition === 'top' || spaceAbove > cardHeight + hp(4)) {
      return {
        position: 'absolute' as const,
        bottom: Dimensions.get('window').height - targetY + hp(3), // More spacing
        left: wp(3), // Less margin for wider card
        right: wp(3),
      };
    } else if (cardPosition === 'center') {
      return styles.cardCenter;
    } else {
      return {
        position: 'absolute' as const,
        top: (targetY + (targetHeight || 0)) + hp(3), // More spacing
        left: wp(3), // Less margin for wider card
        right: wp(3),
      };
    }
  };

  return (
    <Spotlight
      visible={visible}
      targetX={targetX}
      targetY={targetY}
      targetWidth={targetWidth}
      targetHeight={targetHeight}
      borderRadius={borderRadius}
      onBackdropPress={onSkip}
    >
      <View style={[getCardPositionStyle()]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header with skip button */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {title}
              </Text>
              {totalSteps && currentStep && (
                <Text
                  style={[
                    styles.stepIndicator,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {currentStep} of {totalSteps}
                </Text>
              )}
            </View>
            {showSkip && onSkip && (
              <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                <Text
                  style={[
                    styles.skipText,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Skip
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <Text
            style={[
              styles.description,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {description}
          </Text>

          {/* Progress dots */}
          {totalSteps && currentStep && (
            <View style={styles.dotsContainer}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index + 1 <= currentStep ? '#00C853' : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Next button */}
          {onNext && (
            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor: '#00C853',
                },
              ]}
              onPress={onNext}
            >
              <Text style={styles.nextButtonText}>{nextButtonText}</Text>
              <ArrowRight size={fp(5)} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Spotlight>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: wp(6),
    minHeight: hp(25), // Make card taller
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
  },
  cardBottom: {
    position: 'absolute',
    bottom: hp(10), // Move up from bottom
    left: wp(4),
    right: wp(4),
  },
  cardCenter: {
    position: 'absolute',
    top: '35%', // Adjust center position
    left: wp(4),
    right: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(3), // More spacing
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: fp(7.5), // Bigger title
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  stepIndicator: {
    fontSize: fp(4), // Bigger step indicator
    fontWeight: '500',
  },
  skipButton: {
    padding: wp(3),
  },
  skipText: {
    fontSize: fp(4.5), // Bigger skip text
    fontWeight: '600',
  },
  description: {
    fontSize: fp(5), // Much bigger description text
    lineHeight: fp(7), // Better line height
    marginBottom: hp(3),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp(3), // More spacing
    gap: wp(3), // Bigger gap between dots
  },
  dot: {
    width: wp(3), // Bigger dots
    height: wp(3),
    borderRadius: wp(1.5),
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2.2), // Taller button
    paddingHorizontal: wp(8), // Wider button
    borderRadius: 16, // Bigger radius
    gap: wp(3),
  },
  nextButtonText: {
    color: '#fff',
    fontSize: fp(5.5), // Bigger button text
    fontWeight: '700',
  },
});
