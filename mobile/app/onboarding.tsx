import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text, Surface, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../src/core/theme';
import { TokenStorage } from '../src/core/storage/token-storage';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badge: string;
  color: string;
  bgColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    badge: 'BƯỚC 1: GIÁM SÁT REALTIME',
    title: 'Theo Dõi Môi Trường 24/7',
    subtitle: 'Nhiệt độ • Độ ẩm khí • Độ ẩm đất',
    description:
      'Dữ liệu từ trạm cảm biến ESP32 được truyền liên tục về điện thoại theo thời gian thực, giúp bạn nắm bắt chính xác vi khí hậu trong nhà kính và vườn trồng.',
    icon: 'chart-timeline-variant-shimmer',
    color: AppColors.primary,
    bgColor: AppColors.primaryContainer,
  },
  {
    id: '2',
    badge: 'BƯỚC 2: ĐIỀU KHIỂN TƯỚI TIÊU',
    title: 'Tưới Tiêu 2 Chiều An Toàn',
    subtitle: 'Máy bơm • Van điện từ • Hẹn giờ',
    description:
      'Chủ động kích hoạt hệ thống tưới nhỏ giọt, phun sương hoặc quạt làm mát từ bất kỳ đâu. Hệ thống xác thực 2 chiều đảm bảo lệnh được thực thi minh bạch.',
    icon: 'water-pump',
    color: AppColors.info,
    bgColor: AppColors.infoContainer,
  },
  {
    id: '3',
    badge: 'BƯỚC 3: CẢNH BÁO & TRỢ LÝ AI',
    title: 'Cảnh Báo Sớm & Trợ Lý AI',
    subtitle: 'Thông báo FCM • Phân tích cây trồng',
    description:
      'Nhận cảnh báo khẩn cấp ngay khi nhiệt độ vượt ngưỡng an toàn. Trợ lý AI nông nghiệp phân tích dữ liệu, gợi ý thời điểm tưới và phòng chống sâu bệnh.',
    icon: 'robot',
    color: AppColors.secondary,
    bgColor: AppColors.secondaryContainer,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIdx * width, animated: true });
      setCurrentIndex(nextIdx);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    await TokenStorage.setOnboardingSeen();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={styles.topBrand}>
          <MaterialCommunityIcons name="sprout" size={24} color={AppColors.primary} />
          <Text variant="titleMedium" style={styles.brandText}>
            Farm Home
          </Text>
        </View>

        {currentIndex < SLIDES.length - 1 && (
          <Button mode="text" onPress={handleFinish} textColor={AppColors.textSecondary}>
            Bỏ qua
          </Button>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {/* Visual Icon Illustration */}
            <Surface style={[styles.iconSurface, { backgroundColor: slide.bgColor }]} elevation={2}>
              <MaterialCommunityIcons name={slide.icon} size={84} color={slide.color} />
            </Surface>

            {/* Badge */}
            <View style={[styles.badge, { backgroundColor: `${slide.color}1A` }]}>
              <Text variant="labelSmall" style={[styles.badgeText, { color: slide.color }]}>
                {slide.badge}
              </Text>
            </View>

            {/* Content Titles */}
            <Text variant="headlineMedium" style={styles.title}>
              {slide.title}
            </Text>
            <Text variant="titleSmall" style={styles.subtitle}>
              {slide.subtitle}
            </Text>

            <Text variant="bodyMedium" style={styles.description}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationDots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx && [styles.dotActive, { backgroundColor: SLIDES[currentIndex].color }],
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          mode="contained"
          onPress={handleNext}
          buttonColor={SLIDES[currentIndex].color}
          style={styles.actionBtn}
          contentStyle={styles.btnContent}
        >
          {currentIndex === SLIDES.length - 1 ? 'Bắt đầu sử dụng ngay' : 'Tiếp tục ❯'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 10,
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontWeight: '800',
    color: AppColors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconSurface: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontWeight: '800',
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: AppColors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.outline,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    borderRadius: 14,
  },
  btnContent: {
    paddingVertical: 8,
  },
});
