import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { reviewsApi } from '../../../src/api';

const AVAILABLE_TAGS = ['Clean', 'Fast', 'Friendly', 'Affordable', 'Professional'];

export default function ReviewScreen() {
  const { booking_id, station_id, station_name } = useLocalSearchParams<{
    booking_id: string;
    station_id?: string;
    station_name?: string;
  }>();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (!booking_id) {
      Alert.alert('Error', 'Missing booking information');
      return;
    }

    if (rating < 1) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await reviewsApi.create(booking_id, rating, comment, selectedTags);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit review');
      }

      Alert.alert('Thank you!', 'Your review has been submitted.', [
        {
          text: 'OK',
          onPress: () => {
            // Go back to booking history
            router.replace('/(tabs)/profile/bookingHistory/bookinghistory');
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How was your experience?</Text>
          {station_name ? <Text style={styles.subtitle}>{station_name}</Text> : null}
        </View>

        {/* Star rating */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setRating(n)}
              style={styles.starButton}
            >
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={44}
                color="#FF7A00"
              />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 ? (
          <Text style={styles.ratingLabel}>
            {rating === 1
              ? 'Poor'
              : rating === 2
              ? 'Fair'
              : rating === 3
              ? 'Good'
              : rating === 4
              ? 'Very Good'
              : 'Excellent'}
          </Text>
        ) : (
          <Text style={styles.ratingLabelMuted}>Tap to rate</Text>
        )}

        {/* Comment */}
        <Text style={styles.label}>Your review (optional)</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={5}
          value={comment}
          onChangeText={setComment}
          placeholder="Tell us what you liked or what could be better..."
          placeholderTextColor="#999"
          maxLength={1000}
        />
        <Text style={styles.charCount}>{comment.length} / 1000</Text>

        {/* Tags */}
        <Text style={styles.label}>What stood out? (optional)</Text>
        <View style={styles.tagsRow}>
          {AVAILABLE_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selected && styles.tagSelected]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Review</Text>
          )}
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#263547',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 6,
  },
  starButton: {
    marginHorizontal: 6,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF7A00',
    textAlign: 'center',
    marginBottom: 24,
  },
  ratingLabelMuted: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#263547',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    marginRight: 8,
    marginBottom: 8,
  },
  tagSelected: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  tagText: {
    color: '#263547',
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF7A00',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
});