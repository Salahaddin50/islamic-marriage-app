import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Dimensions,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SIZES } from '../constants';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

interface DropdownItem {
  label: string;
  value: string;
}

interface SearchableDropdownProps {
  data: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  placeholder: string;
  selectedValue?: string;
  error?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  icon?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  data,
  onSelect,
  placeholder,
  selectedValue,
  error,
  disabled = false,
  searchPlaceholder = "Search...",
  icon,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Filter data based on search text (match label, value, or optional country field)
  const text = searchText.trim().toLowerCase();
  const filteredData = data.filter((item: any) => {
    if (!text) return true;
    const label = (item.label || '').toLowerCase();
    const value = (item.value || '').toLowerCase();
    const country = (item.country || '').toLowerCase();
    return label.includes(text) || value.includes(text) || country.includes(text);
  });

  // Find selected item for display
  const selectedItem = data.find(item => item.value === selectedValue);

  const handleSelect = (item: DropdownItem) => {
    onSelect(item);
    setVisible(false);
    setSearchText('');
    setIsFocused(false);
  };

  const handleOpen = () => {
    if (!disabled) {
      setVisible(true);
      setIsFocused(true);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setIsFocused(false);
    setSearchText('');
  };

  const renderItem = ({ item }: { item: DropdownItem }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedValue === item.value && styles.selectedItem
      ]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.dropdownItemText,
        selectedValue === item.value && styles.selectedItemText
      ]}>
        {item.label}
      </Text>
      {selectedValue === item.value && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Main Dropdown Button - styled like Input component */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: isFocused ? COLORS.primary : COLORS.greyscale500,
            backgroundColor: isFocused ? COLORS.tansparentPrimary : COLORS.greyscale500,
          },
          error && styles.inputError,
          disabled && styles.inputDisabled
        ]}
      >
        {icon && (
          <Image
            source={icon}
            style={[
              styles.icon,
              {
                tintColor: isFocused ? COLORS.primary : COLORS.grayTie,
              },
            ]}
          />
        )}
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={handleOpen}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.inputText,
            !selectedItem && styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
          <Text style={[
            styles.arrow,
            { color: isFocused ? COLORS.primary : COLORS.grayTie },
            disabled && styles.disabledText
          ]}>
            {disabled ? '🚫' : visible ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Modal with Search and List */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {placeholder.replace(' *', '')}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={COLORS.grayTie}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
              </View>
            </View>
            
            {/* List */}
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.value}-${item.label}`}
              style={styles.flatList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 5,
  },
  
  // Input-like styling to match Input component
  inputContainer: {
    width: '100%',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding2,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 5,
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.disabled,
  },
  
  icon: {
    marginRight: 10,
    height: 20,
    width: 20,
  },
  
  touchableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  inputText: {
    color: COLORS.black,
    flex: 1,
    fontFamily: 'regular',
    fontSize: getResponsiveFontSize(16),
    paddingLeft: getResponsiveSpacing(4),
  },
  
  placeholderText: {
    color: COLORS.grayTie,
  },
  
  disabledText: {
    color: COLORS.disabled,
  },
  
  arrow: {
    fontSize: getResponsiveFontSize(14),
    marginLeft: 8,
    fontWeight: 'bold',
  },
  
  // Error styling to match Input component
  errorContainer: {
    marginVertical: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'regular',
  },
  
  // Modal styling
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'bold',
    color: COLORS.black,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.greyscale300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    fontSize: getResponsiveFontSize(18),
    color: COLORS.black,
    fontWeight: 'bold',
  },
  
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyscale500,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  
  searchIcon: {
    fontSize: getResponsiveFontSize(20),
    marginRight: 8,
    color: COLORS.grayTie,
  },
  
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.black,
    paddingVertical: 0,
  },
  
  flatList: {
    maxHeight: screenHeight * 0.5,
  },
  
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  
  selectedItem: {
    backgroundColor: COLORS.tansparentPrimary,
  },
  
  dropdownItemText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.black,
    flex: 1,
  },
  
  selectedItemText: {
    color: COLORS.primary,
    fontFamily: 'medium',
  },
  
  checkmark: {
    fontSize: getResponsiveFontSize(18),
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  
  emptyText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'regular',
    color: COLORS.grayTie,
    textAlign: 'center',
  },
});

export default SearchableDropdown;
