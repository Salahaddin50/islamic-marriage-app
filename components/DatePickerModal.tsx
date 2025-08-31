import React, { useMemo, useState, FC } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import DatePicker from 'react-native-modern-datepicker';
import { COLORS } from '../constants';

// Suppress React defaultProps warnings for cleaner console
const error = console.error;
console.error = (...args) => {
  if (/defaultProps/.test(args[0])) return;
  if (/Unexpected text node/.test(args[0])) return; // Suppress text node warnings
  error(...args);
};

interface DatePickerModalProps {
  open: boolean;
  startDate: string;
  selectedDate: string;
  onClose: () => void;
  onChangeStartDate: (date: string) => void;
}

const DatePickerModal: FC<DatePickerModalProps> = ({
  open,
  startDate,
  selectedDate,
  onClose,
  onChangeStartDate,
}) => {
  const [selectedStartDate, setSelectedStartDate] = useState(selectedDate);
  const [showYearList, setShowYearList] = useState(false);

  // Helpers to format between picker and app formats
  const toPickerFmt = (d: string) => d?.includes('/') ? d : d?.replace(/-/g, '/');
  const fromPickerFmt = (d: string) => d?.includes('-') ? d : d?.replace(/\//g, '-');

  // Parse current selection
  const [selYear, selMonth, selDay] = useMemo(() => {
    const base = toPickerFmt(selectedStartDate || '').split('/');
    const year = Number(base[0]) || new Date().getFullYear() - 18;
    const month = base[1] || '01';
    const day = base[2] || '01';
    return [year, month, day] as [number, string, string];
  }, [selectedStartDate]);

  const [displayYear, setDisplayYear] = useState<number>(selYear);

  // Compute boundaries (min from prop, max = today - 18 years)
  const minDatePicker = useMemo(() => toPickerFmt(startDate), [startDate]);
  const maxDatePicker = useMemo(() => {
    const today = new Date();
    const max = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const mm = String(max.getMonth() + 1).padStart(2, '0');
    const dd = String(max.getDate()).padStart(2, '0');
    return `${max.getFullYear()}/${mm}/${dd}`;
  }, []);

  // Generate quick year list (descending)
  const yearOptions = useMemo(() => {
    const startY = Number(minDatePicker?.slice(0, 4)) || 1950;
    const maxY = Number(maxDatePicker?.slice(0, 4));
    const years: number[] = [];
    for (let y = maxY; y >= startY; y--) years.push(y);
    return years;
  }, [minDatePicker, maxDatePicker]);

  const jumpYears = (delta: number) => {
    const startY = yearOptions[yearOptions.length - 1];
    const maxY = yearOptions[0];
    const next = Math.min(maxY, Math.max(startY, displayYear + delta));
    setDisplayYear(next);
  };

  const handleDateChange = (date: string) => {
    setSelectedStartDate(fromPickerFmt(date));
    onChangeStartDate(fromPickerFmt(date));
  };

  const handleOnPressStartDate = () => {
    onClose();
  };

  const modalVisible = open;
  const calendarCurrent = `${displayYear}/${selMonth}/${selDay}`;
  const calendarKey = `dp-${displayYear}-${selMonth}-${selDay}`;

  return (
    <Modal animationType="slide" transparent={true} visible={modalVisible}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Quick Year Controls */}
          <View style={styles.yearRow}>
            <TouchableOpacity style={styles.yearButton} onPress={() => jumpYears(-10)}>
              <Text style={styles.yearButtonText}>{'<<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.yearCenter} onPress={() => setShowYearList(true)}>
              <Text style={styles.yearCenterText}>{displayYear}</Text>
              <Text style={styles.yearHint}>Tap to choose year</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.yearButton} onPress={() => jumpYears(10)}>
              <Text style={styles.yearButtonText}>{'>>'}</Text>
            </TouchableOpacity>
          </View>

          <DatePicker
            key={calendarKey}
            mode="calendar"
            minimumDate={minDatePicker}
            maximumDate={maxDatePicker}
            current={calendarCurrent}
            selected={toPickerFmt(selectedStartDate)}
            onDateChange={handleDateChange}
            onSelectedChange={(date) => setSelectedStartDate(fromPickerFmt(date))}
            options={{
              backgroundColor: COLORS.primary,
              textHeaderColor: COLORS.white,
              textDefaultColor: '#FFFFFF',
              selectedTextColor: COLORS.primary,
              mainColor: COLORS.white,
              textSecondaryColor: '#FFFFFF',
              borderColor: COLORS.primary,
            }}
          />
          <TouchableOpacity onPress={handleOnPressStartDate}>
            <Text style={{ color: 'white' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Year full list selector */}
      <Modal animationType="fade" transparent={true} visible={showYearList} onRequestClose={() => setShowYearList(false)}>
        <View style={styles.yearListOverlay}>
          <View style={styles.yearListCard}>
            <Text style={styles.yearListTitle}>Select Year</Text>
            <FlatList
              data={yearOptions}
              keyExtractor={(y) => String(y)}
              initialScrollIndex={Math.max(0, yearOptions.findIndex(y => y === displayYear))}
              getItemLayout={(_, index) => ({ length: 40, offset: 40 * index, index })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.yearListItem, item === displayYear && styles.yearListItemActive]}
                  onPress={() => { setDisplayYear(item); setShowYearList(false); }}
                >
                  <Text style={[styles.yearListItemText, item === displayYear && styles.yearListItemTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowYearList(false)} style={styles.yearListClose}>
              <Text style={styles.yearListCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 35,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  yearRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  yearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  yearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  yearCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearCenterText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  yearHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  yearListOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearListCard: {
    width: '80%',
    maxWidth: 360,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  yearListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  yearListItem: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearListItemActive: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  yearListItemText: {
    fontSize: 14,
    color: '#222',
  },
  yearListItemTextActive: {
    fontWeight: '700',
  },
  yearListClose: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  yearListCloseText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DatePickerModal;