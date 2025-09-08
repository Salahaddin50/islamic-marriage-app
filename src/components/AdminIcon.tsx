import React from 'react';
import { View, Text, Platform } from 'react-native';

interface AdminIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Bulletproof icon component for admin panel
export const AdminIcon: React.FC<AdminIconProps> = ({ 
  name, 
  size = 20, 
  color = '#374151', 
  style 
}) => {
  
  if (Platform.OS === 'web') {
    // Use Font Awesome on web - guaranteed to work
    const iconMap: { [key: string]: string } = {
      // Common admin icons mapped to Font Awesome classes
      'home': 'fas fa-home',
      'dashboard': 'fas fa-tachometer-alt',
      'users': 'fas fa-users',
      'user': 'fas fa-user',
      'person': 'fas fa-user',
      'mail': 'fas fa-envelope',
      'email': 'fas fa-envelope',
      'lock': 'fas fa-lock',
      'lock-closed': 'fas fa-lock',
      'eye': 'fas fa-eye',
      'eye-off': 'fas fa-eye-slash',
      'shield': 'fas fa-shield-alt',
      'shield-checkmark': 'fas fa-shield-alt',
      'shield-outline': 'fas fa-shield-alt',
      'arrow-back': 'fas fa-arrow-left',
      'arrow-forward': 'fas fa-arrow-right',
      'log-out': 'fas fa-sign-out-alt',
      'logout': 'fas fa-sign-out-alt',
      'settings': 'fas fa-cog',
      'cog': 'fas fa-cog',
      'bar-chart': 'fas fa-chart-bar',
      'chart': 'fas fa-chart-bar',
      'calendar': 'fas fa-calendar',
      'trash': 'fas fa-trash',
      'delete': 'fas fa-trash',
      'edit': 'fas fa-edit',
      'pencil': 'fas fa-edit',
      'search': 'fas fa-search',
      'filter': 'fas fa-filter',
      'close': 'fas fa-times',
      'x': 'fas fa-times',
      'check': 'fas fa-check',
      'checkmark': 'fas fa-check',
      'checkbox': 'fas fa-check-square',
      'square-outline': 'far fa-square',
      'heart': 'fas fa-heart',
      'heart-outline': 'far fa-heart',
      'star': 'fas fa-star',
      'star-outline': 'far fa-star',
      'link': 'fas fa-link',
      'external-link': 'fas fa-external-link-alt',
      'videocam': 'fas fa-video',
      'video': 'fas fa-video',
      'camera': 'fas fa-camera',
      'image': 'fas fa-image',
      'images': 'fas fa-images',
      'play': 'fas fa-play',
      'pause': 'fas fa-pause',
      'stop': 'fas fa-stop',
      'refresh': 'fas fa-sync-alt',
      'reload': 'fas fa-sync-alt',
      'add': 'fas fa-plus',
      'plus': 'fas fa-plus',
      'minus': 'fas fa-minus',
      'remove': 'fas fa-minus',
      'info': 'fas fa-info-circle',
      'warning': 'fas fa-exclamation-triangle',
      'error': 'fas fa-exclamation-circle',
      'success': 'fas fa-check-circle',
      'menu': 'fas fa-bars',
      'hamburger': 'fas fa-bars',
      'dots-vertical': 'fas fa-ellipsis-v',
      'dots-horizontal': 'fas fa-ellipsis-h',
      'more': 'fas fa-ellipsis-h',
    };

    const iconClass = iconMap[name] || 'fas fa-circle';
    
    return (
      <i 
        className={`${iconClass} admin-icon`}
        style={{
          fontSize: `${size}px`,
          color: color,
          width: `${size}px`,
          height: `${size}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      />
    );
  }

  // Fallback for native - simple colored square with symbol
  const symbolMap: { [key: string]: string } = {
    'home': '🏠',
    'dashboard': '📊',
    'users': '👥',
    'user': '👤',
    'person': '👤',
    'mail': '✉️',
    'email': '✉️',
    'lock': '🔒',
    'lock-closed': '🔒',
    'eye': '👁️',
    'eye-off': '🙈',
    'shield': '🛡️',
    'shield-checkmark': '🛡️',
    'shield-outline': '🛡️',
    'arrow-back': '←',
    'arrow-forward': '→',
    'log-out': '🚪',
    'logout': '🚪',
    'settings': '⚙️',
    'cog': '⚙️',
    'bar-chart': '📊',
    'chart': '📊',
    'calendar': '📅',
    'trash': '🗑️',
    'delete': '🗑️',
    'edit': '✏️',
    'pencil': '✏️',
    'search': '🔍',
    'filter': '🔽',
    'close': '✖️',
    'x': '✖️',
    'check': '✓',
    'checkmark': '✓',
    'checkbox': '☑️',
    'square-outline': '☐',
    'heart': '❤️',
    'heart-outline': '♡',
    'star': '⭐',
    'star-outline': '☆',
    'link': '🔗',
    'external-link': '🔗',
    'videocam': '📹',
    'video': '📹',
    'camera': '📷',
    'image': '🖼️',
    'images': '🖼️',
    'play': '▶️',
    'pause': '⏸️',
    'stop': '⏹️',
    'refresh': '🔄',
    'reload': '🔄',
    'add': '➕',
    'plus': '➕',
    'minus': '➖',
    'remove': '➖',
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌',
    'success': '✅',
    'menu': '☰',
    'hamburger': '☰',
    'dots-vertical': '⋮',
    'dots-horizontal': '⋯',
    'more': '⋯',
  };

  const symbol = symbolMap[name] || '●';

  return (
    <View style={[{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }, style]}>
      <Text style={{
        fontSize: size * 0.8,
        color: color,
        textAlign: 'center',
      }}>
        {symbol}
      </Text>
    </View>
  );
};
