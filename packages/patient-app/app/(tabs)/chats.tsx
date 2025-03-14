import React from 'react';
import ChatsScreen from '../chats';

// Use the ChatsScreen component directly instead of redirecting
// This prevents navigation loops that could cause infinite renders
export default function ChatTabScreen() {
  return <ChatsScreen />;
}
