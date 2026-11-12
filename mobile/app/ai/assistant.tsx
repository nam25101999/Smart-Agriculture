import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Surface, Appbar, Avatar, IconButton, Chip, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../../src/core/theme';
import { useFarmStore } from '../../src/store/farm-store';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  recommendation?: {
    action: string;
    reason: string;
  };
}

export default function AIAssistantScreen() {
  const router = useRouter();
  const { selectedFarmId } = useFarmStore();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Nông nghiệp của Farm Home. Tôi có thể giúp bạn phân tích chỉ số cảm biến ESP32, tư vấn lịch tưới tối ưu và phát hiện sớm dịch bệnh cây trồng.',
      time: 'Vừa xong',
    },
    {
      id: '2',
      sender: 'ai',
      text: '⚠️ Phát hiện cảnh báo: Nhiệt độ tại Nhà kính 01 đang ở mức 37.8°C (vượt ngưỡng 35°C). Độ ẩm không khí 65.5%, độ ẩm đất 42%. Bạn nên kích hoạt quạt thông gió làm mát ngay để tránh cây bị sốc nhiệt.',
      time: 'Vừa xong',
      recommendation: {
        action: 'Bật Quạt Làm Mát trong 30 phút',
        reason: 'Hạ nhiệt độ nhà màng xuống dưới 32°C an toàn cho rau thủy canh.',
      },
    },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const prompt = inputText.trim().toLowerCase();
    setInputText('');

    // Phản hồi AI thông minh dựa trên ngữ cảnh IoT
    setTimeout(() => {
      let aiResponseText = 'Tôi đã nhận được câu hỏi. Căn cứ vào số liệu đo từ cảm biến, hệ thống khuyến nghị bạn duy trì độ ẩm đất từ 40% - 60% và kiểm tra chu kỳ tưới nhỏ giọt.';
      if (prompt.includes('tưới') || prompt.includes('nước') || prompt.includes('bơm')) {
        aiResponseText = 'Độ ẩm đất hiện tại đang ở mức 42% (ổn định). Tuy nhiên do nhiệt độ cao 37.8°C, lượng bốc hơi nhanh, bạn nên tưới dặm nhẹ khoảng 10-15 phút vào lúc 16:30 chiều mát.';
      } else if (prompt.includes('nhiệt độ') || prompt.includes('nóng')) {
        aiResponseText = 'Nhiệt độ 37.8°C là mức rất cao đối với cây trồng trong nhà màng. Hãy bật quạt thông gió, đồng thời kéo lưới cắt nắng giảm 50% bức xạ mặt trời.';
      } else if (prompt.includes('bệnh') || prompt.includes('sâu') || prompt.includes('nấm')) {
        aiResponseText = 'Với độ ẩm không khí 65-75% và nhiệt độ cao, cần cảnh giác với nấm phấn trắng và bệnh héo rũ lá. Hãy kiểm tra mặt dưới lá và bổ sung nấm đối kháng Trichoderma.';
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content
          title="Trợ lý AI Nông Nghiệp"
          subtitle="Phân tích vi khí hậu & Tư vấn cây trồng"
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
        />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.messagesScroll}>
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <View
                key={msg.id}
                style={[styles.messageBubbleWrapper, isAI ? styles.msgLeft : styles.msgRight]}
              >
                {isAI && (
                  <Surface style={styles.aiAvatar} elevation={1}>
                    <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" />
                  </Surface>
                )}
                <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
                  <Text variant="bodyMedium" style={isAI ? styles.textAI : styles.textUser}>
                    {msg.text}
                  </Text>

                  {msg.recommendation && (
                    <Card style={styles.recCard} mode="outlined">
                      <Card.Content style={styles.recContent}>
                        <View style={styles.recHeader}>
                          <MaterialCommunityIcons name="lightbulb-on" size={18} color={AppColors.warning} />
                          <Text variant="labelLarge" style={styles.recAction}>
                            {msg.recommendation.action}
                          </Text>
                        </View>
                        <Text variant="bodySmall" style={styles.recReason}>
                          {msg.recommendation.reason}
                        </Text>
                      </Card.Content>
                    </Card>
                  )}

                  <Text variant="labelSmall" style={styles.msgTime}>
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Prompts */}
        <View style={styles.promptContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              icon="water-outline"
              compact
              style={styles.promptChip}
              onPress={() => handleQuickPrompt('Hôm nay có cần tưới thêm nước không?')}
            >
              Cần tưới nước không?
            </Chip>
            <Chip
              icon="thermometer-alert"
              compact
              style={styles.promptChip}
              onPress={() => handleQuickPrompt('Nhiệt độ cao như vậy ảnh hưởng gì?')}
            >
              Nhiệt độ cao xử lý sao?
            </Chip>
            <Chip
              icon="leaf"
              compact
              style={styles.promptChip}
              onPress={() => handleQuickPrompt('Làm sao phòng ngừa bệnh nấm lá?')}
            >
              Phòng ngừa nấm lá
            </Chip>
          </ScrollView>
        </View>

        {/* Input Bar */}
        <Surface style={styles.inputBar} elevation={3}>
          <RNTextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi AI về nông trại, cây trồng, lịch tưới..."
            placeholderTextColor={AppColors.outline}
            style={styles.textInput}
            onSubmitEditing={handleSend}
          />
          <IconButton
            icon="send"
            iconColor={AppColors.primary}
            size={24}
            disabled={!inputText.trim()}
            onPress={handleSend}
          />
        </Surface>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.primary,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#E8F5E9',
    fontSize: 12,
  },
  chatArea: {
    flex: 1,
  },
  messagesScroll: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  msgLeft: {
    justifyContent: 'flex-start',
  },
  msgRight: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
  },
  bubbleAI: {
    backgroundColor: AppColors.surface,
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 4,
  },
  textAI: {
    color: AppColors.text,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFFFFF',
    lineHeight: 20,
  },
  msgTime: {
    marginTop: 6,
    alignSelf: 'flex-end',
    color: AppColors.outline,
    fontSize: 10,
  },
  recCard: {
    backgroundColor: AppColors.warningContainer,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 0,
  },
  recContent: {
    padding: 10,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recAction: {
    fontWeight: '700',
    color: AppColors.warning,
    marginLeft: 6,
  },
  recReason: {
    color: AppColors.text,
  },
  promptContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  promptChip: {
    marginRight: 8,
    backgroundColor: AppColors.surface,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: AppColors.surface,
  },
  textInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: AppColors.surfaceVariant,
    borderRadius: 22,
    fontSize: 14,
    color: AppColors.text,
  },
});

