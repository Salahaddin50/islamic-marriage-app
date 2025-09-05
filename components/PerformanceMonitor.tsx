/**
 * Performance Monitor Component
 * Shows real-time performance metrics and optimization status
 * Useful for development and performance analysis
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useCacheWarming } from '../src/hooks/useCacheWarming';
import { COLORS } from '../constants';

interface PerformanceMonitorProps {
  visible?: boolean;
  onClose?: () => void;
  showInProduction?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = false,
  onClose,
  showInProduction = false,
}) => {
  const { cacheStats, lastWarmingStats, warmCache, clearCache, isWarming } = useCacheWarming();
  const [renderStats, setRenderStats] = useState({
    renderCount: 0,
    lastRender: Date.now(),
  });

  // Track component renders for performance analysis
  useEffect(() => {
    setRenderStats(prev => ({
      renderCount: prev.renderCount + 1,
      lastRender: Date.now(),
    }));
  });

  // Don't show in production unless explicitly enabled
  if (!__DEV__ && !showInProduction) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getOptimizationScore = () => {
    let score = 0;
    let maxScore = 100;

    // Query cache score (30 points)
    if (cacheStats?.queryCache?.queries > 0) score += 30;
    else if (cacheStats?.queryCache?.queries > 10) score += 25;
    else if (cacheStats?.queryCache?.queries > 5) score += 20;

    // Image cache score (30 points)
    if (cacheStats?.imageCache?.items > 20) score += 30;
    else if (cacheStats?.imageCache?.items > 10) score += 25;
    else if (cacheStats?.imageCache?.items > 5) score += 20;

    // Cache warming score (40 points)
    if (lastWarmingStats?.profilesPreloaded > 20) score += 20;
    if (lastWarmingStats?.imagesPreloaded > 10) score += 10;
    if (lastWarmingStats?.interestsPreloaded) score += 10;

    return Math.min(score, maxScore);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  if (!visible) return null;

  const optimizationScore = getOptimizationScore();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance Monitor</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Optimization Score */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optimization Score</Text>
            <View style={styles.scoreContainer}>
              <View style={[styles.scoreCircle, { borderColor: getScoreColor(optimizationScore) }]}>
                <Text style={[styles.scoreText, { color: getScoreColor(optimizationScore) }]}>
                  {optimizationScore}
                </Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </View>
              <View style={styles.scoreDetails}>
                <Text style={styles.scoreDescription}>
                  {optimizationScore >= 80 ? '🚀 Excellent' : 
                   optimizationScore >= 60 ? '⚡ Good' : '🐌 Needs Improvement'}
                </Text>
              </View>
            </View>
          </View>

          {/* React Query Cache */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Query Cache</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Queries:</Text>
              <Text style={styles.statValue}>{cacheStats?.queryCache?.queries || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Mutations:</Text>
              <Text style={styles.statValue}>{cacheStats?.queryCache?.mutations || 0}</Text>
            </View>
          </View>

          {/* Image Cache */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Image Cache</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cached Images:</Text>
              <Text style={styles.statValue}>{cacheStats?.imageCache?.items || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cache Size:</Text>
              <Text style={styles.statValue}>
                {formatBytes(cacheStats?.imageCache?.sizeBytes || 0)}
              </Text>
            </View>
          </View>

          {/* Cache Warming Stats */}
          {lastWarmingStats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last Cache Warming</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Profiles Preloaded:</Text>
                <Text style={styles.statValue}>{lastWarmingStats.profilesPreloaded}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Images Preloaded:</Text>
                <Text style={styles.statValue}>{lastWarmingStats.imagesPreloaded}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Interests Loaded:</Text>
                <Text style={styles.statValue}>
                  {lastWarmingStats.interestsPreloaded ? '✅' : '❌'}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Warming Time:</Text>
                <Text style={styles.statValue}>
                  {formatTime(lastWarmingStats.totalTime)}
                </Text>
              </View>
              {lastWarmingStats.errors?.length > 0 && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>Errors:</Text>
                  {lastWarmingStats.errors.map((error: string, index: number) => (
                    <Text key={index} style={styles.errorText}>• {error}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Component Render Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Component Performance</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Monitor Renders:</Text>
              <Text style={styles.statValue}>{renderStats.renderCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Last Render:</Text>
              <Text style={styles.statValue}>
                {new Date(renderStats.lastRender).toLocaleTimeString()}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => warmCache({ priority: 'high' })}
              disabled={isWarming}
            >
              <Text style={styles.actionButtonText}>
                {isWarming ? 'Warming Cache...' : 'Warm Cache Now'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={clearCache}
            >
              <Text style={styles.actionButtonText}>Clear All Caches</Text>
            </TouchableOpacity>
          </View>

          {/* Performance Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Tips</Text>
            <View style={styles.tipContainer}>
              <Text style={styles.tip}>
                🚀 Keep optimization score above 80 for best performance
              </Text>
              <Text style={styles.tip}>
                💾 Cache warming happens automatically every 30 minutes
              </Text>
              <Text style={styles.tip}>
                🖼️ Image cache uses LRU eviction when memory is full
              </Text>
              <Text style={styles.tip}>
                ⚡ Virtual scrolling handles 10,000+ items efficiently
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale100,
  },
  title: {
    fontSize: 24,
    fontFamily: 'bold',
    color: COLORS.grayscale900,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.grayscale100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: COLORS.grayscale600,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: COLORS.grayscale50,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'semibold',
    color: COLORS.grayscale900,
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreText: {
    fontSize: 24,
    fontFamily: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.grayscale600,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreDescription: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.grayscale700,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.grayscale600,
    fontFamily: 'medium',
  },
  statValue: {
    fontSize: 14,
    color: COLORS.grayscale900,
    fontFamily: 'semibold',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 12,
    color: COLORS.error,
    fontFamily: 'semibold',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.error,
    fontFamily: 'regular',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'semibold',
  },
  tipContainer: {
    gap: 8,
  },
  tip: {
    fontSize: 13,
    color: COLORS.grayscale600,
    fontFamily: 'regular',
    lineHeight: 18,
  },
});

export default PerformanceMonitor;
