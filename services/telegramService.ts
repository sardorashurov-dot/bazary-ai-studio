
export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export interface TelegramResult {
  success: boolean;
  error?: string;
}

export const sendToTelegram = async (
  token: string,
  chatId: string,
  mediaUrl: string,
  caption: string,
  isVideo: boolean = false
): Promise<TelegramResult> => {
  // 1. Clean up Chat ID (handle links like t.me/channel or @channel)
  let cleanId = chatId.trim();
  if (cleanId.includes('t.me/')) {
    cleanId = '@' + cleanId.split('t.me/')[1].split('/')[0];
  }
  
  // Ensure it starts with @ for strings or -100 for private channel IDs
  const formattedChatId = (cleanId.startsWith('@') || cleanId.startsWith('-')) 
    ? cleanId 
    : (isNaN(Number(cleanId)) ? `@${cleanId}` : cleanId);

  const endpoint = isVideo ? 'sendVideo' : 'sendPhoto';
  const url = `https://api.telegram.org/bot${token}/${endpoint}`;

  try {
    const formData = new FormData();
    formData.append('chat_id', formattedChatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');

    let blob: Blob;
    if (mediaUrl.startsWith('data:')) {
      const response = await fetch(mediaUrl);
      blob = await response.blob();
      formData.append(isVideo ? 'video' : 'photo', blob, isVideo ? 'video.mp4' : 'photo.jpg');
    } else if (mediaUrl.startsWith('blob:')) {
      const response = await fetch(mediaUrl);
      blob = await response.blob();
      formData.append(isVideo ? 'video' : 'photo', blob, isVideo ? 'video.mp4' : 'photo.jpg');
    } else {
      formData.append(isVideo ? 'video' : 'photo', mediaUrl);
    }

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('Telegram API Error Detailed:', data);
      // More user-friendly explanations for common errors
      let userError = data.description || 'Unknown API Error';
      if (userError.includes('chat not found')) {
        userError = 'Канал не найден. Убедитесь, что бот добавлен в Администраторы канала и ID введен верно.';
      } else if (userError.includes('admin rights')) {
        userError = 'У бота нет прав для публикации. Сделайте его администратором.';
      }
      
      return { 
        success: false, 
        error: userError 
      };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Telegram request failed:', error);
    return { 
      success: false, 
      error: error.message || 'Network Error' 
    };
  }
};
