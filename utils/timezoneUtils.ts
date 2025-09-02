// Timezone utility functions for calculating time differences between users

interface TimezoneInfo {
  country: string;
  timezone: string;
  utcOffset: number; // in hours
}

// Comprehensive country timezone data - covers ALL countries from profile setup
const COUNTRY_TIMEZONES: Record<string, TimezoneInfo> = {
  // A
  'Afghanistan': { country: 'Afghanistan', timezone: 'Asia/Kabul', utcOffset: 4.5 },
  'Albania': { country: 'Albania', timezone: 'Europe/Tirane', utcOffset: 1 },
  'Algeria': { country: 'Algeria', timezone: 'Africa/Algiers', utcOffset: 1 },
  'Argentina': { country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', utcOffset: -3 },
  'Australia': { country: 'Australia', timezone: 'Australia/Sydney', utcOffset: 11 }, // Eastern Time (most populated)
  'Austria': { country: 'Austria', timezone: 'Europe/Vienna', utcOffset: 1 },
  'Azerbaijan': { country: 'Azerbaijan', timezone: 'Asia/Baku', utcOffset: 4 },
  
  // B
  'Bahrain': { country: 'Bahrain', timezone: 'Asia/Bahrain', utcOffset: 3 },
  'Bangladesh': { country: 'Bangladesh', timezone: 'Asia/Dhaka', utcOffset: 6 },
  'Belgium': { country: 'Belgium', timezone: 'Europe/Brussels', utcOffset: 1 },
  'Bolivia': { country: 'Bolivia', timezone: 'America/La_Paz', utcOffset: -4 },
  'Bosnia and Herzegovina': { country: 'Bosnia and Herzegovina', timezone: 'Europe/Sarajevo', utcOffset: 1 },
  'Brazil': { country: 'Brazil', timezone: 'America/Sao_Paulo', utcOffset: -3 },
  'Brunei': { country: 'Brunei', timezone: 'Asia/Brunei', utcOffset: 8 },
  'Bulgaria': { country: 'Bulgaria', timezone: 'Europe/Sofia', utcOffset: 2 },
  'Burkina Faso': { country: 'Burkina Faso', timezone: 'Africa/Ouagadougou', utcOffset: 0 },
  
  // C
  'Cambodia': { country: 'Cambodia', timezone: 'Asia/Phnom_Penh', utcOffset: 7 },
  'Canada': { country: 'Canada', timezone: 'America/Toronto', utcOffset: -5 }, // Eastern Time (most populated)
  'Chile': { country: 'Chile', timezone: 'America/Santiago', utcOffset: -3 },
  'China': { country: 'China', timezone: 'Asia/Shanghai', utcOffset: 8 },
  'Colombia': { country: 'Colombia', timezone: 'America/Bogota', utcOffset: -5 },
  'Comoros': { country: 'Comoros', timezone: 'Indian/Comoro', utcOffset: 3 },
  'Croatia': { country: 'Croatia', timezone: 'Europe/Zagreb', utcOffset: 1 },
  'Czech Republic': { country: 'Czech Republic', timezone: 'Europe/Prague', utcOffset: 1 },
  
  // D
  'Denmark': { country: 'Denmark', timezone: 'Europe/Copenhagen', utcOffset: 1 },
  'Djibouti': { country: 'Djibouti', timezone: 'Africa/Djibouti', utcOffset: 3 },
  
  // E
  'Egypt': { country: 'Egypt', timezone: 'Africa/Cairo', utcOffset: 2 },
  'Estonia': { country: 'Estonia', timezone: 'Europe/Tallinn', utcOffset: 2 },
  
  // F
  'Finland': { country: 'Finland', timezone: 'Europe/Helsinki', utcOffset: 2 },
  'France': { country: 'France', timezone: 'Europe/Paris', utcOffset: 1 },
  
  // G
  'Germany': { country: 'Germany', timezone: 'Europe/Berlin', utcOffset: 1 },
  'Ghana': { country: 'Ghana', timezone: 'Africa/Accra', utcOffset: 0 },
  'Greece': { country: 'Greece', timezone: 'Europe/Athens', utcOffset: 2 },
  
  // H
  'Hungary': { country: 'Hungary', timezone: 'Europe/Budapest', utcOffset: 1 },
  
  // I
  'India': { country: 'India', timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  'Indonesia': { country: 'Indonesia', timezone: 'Asia/Jakarta', utcOffset: 7 }, // Western Indonesia Time
  'Iran': { country: 'Iran', timezone: 'Asia/Tehran', utcOffset: 3.5 },
  'Iraq': { country: 'Iraq', timezone: 'Asia/Baghdad', utcOffset: 3 },
  'Ireland': { country: 'Ireland', timezone: 'Europe/Dublin', utcOffset: 0 },
  'Israel': { country: 'Israel', timezone: 'Asia/Jerusalem', utcOffset: 2 },
  'Italy': { country: 'Italy', timezone: 'Europe/Rome', utcOffset: 1 },
  
  // J
  'Japan': { country: 'Japan', timezone: 'Asia/Tokyo', utcOffset: 9 },
  'Jordan': { country: 'Jordan', timezone: 'Asia/Amman', utcOffset: 2 },
  
  // K
  'Kazakhstan': { country: 'Kazakhstan', timezone: 'Asia/Almaty', utcOffset: 6 },
  'Kenya': { country: 'Kenya', timezone: 'Africa/Nairobi', utcOffset: 3 },
  'Kuwait': { country: 'Kuwait', timezone: 'Asia/Kuwait', utcOffset: 3 },
  'Kyrgyzstan': { country: 'Kyrgyzstan', timezone: 'Asia/Bishkek', utcOffset: 6 },
  
  // L
  'Latvia': { country: 'Latvia', timezone: 'Europe/Riga', utcOffset: 2 },
  'Lebanon': { country: 'Lebanon', timezone: 'Asia/Beirut', utcOffset: 2 },
  'Libya': { country: 'Libya', timezone: 'Africa/Tripoli', utcOffset: 2 },
  'Lithuania': { country: 'Lithuania', timezone: 'Europe/Vilnius', utcOffset: 2 },
  
  // M
  'Malaysia': { country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', utcOffset: 8 },
  'Maldives': { country: 'Maldives', timezone: 'Indian/Maldives', utcOffset: 5 },
  'Mali': { country: 'Mali', timezone: 'Africa/Bamako', utcOffset: 0 },
  'Mauritania': { country: 'Mauritania', timezone: 'Africa/Nouakchott', utcOffset: 0 },
  'Mexico': { country: 'Mexico', timezone: 'America/Mexico_City', utcOffset: -6 },
  'Morocco': { country: 'Morocco', timezone: 'Africa/Casablanca', utcOffset: 1 },
  'Myanmar': { country: 'Myanmar', timezone: 'Asia/Yangon', utcOffset: 6.5 },
  
  // N
  'Nepal': { country: 'Nepal', timezone: 'Asia/Kathmandu', utcOffset: 5.75 },
  'Netherlands': { country: 'Netherlands', timezone: 'Europe/Amsterdam', utcOffset: 1 },
  'New Zealand': { country: 'New Zealand', timezone: 'Pacific/Auckland', utcOffset: 13 },
  'Niger': { country: 'Niger', timezone: 'Africa/Niamey', utcOffset: 1 },
  'Nigeria': { country: 'Nigeria', timezone: 'Africa/Lagos', utcOffset: 1 },
  'Norway': { country: 'Norway', timezone: 'Europe/Oslo', utcOffset: 1 },
  
  // O
  'Oman': { country: 'Oman', timezone: 'Asia/Muscat', utcOffset: 4 },
  
  // P
  'Pakistan': { country: 'Pakistan', timezone: 'Asia/Karachi', utcOffset: 5 },
  'Palestine': { country: 'Palestine', timezone: 'Asia/Gaza', utcOffset: 2 },
  'Philippines': { country: 'Philippines', timezone: 'Asia/Manila', utcOffset: 8 },
  'Poland': { country: 'Poland', timezone: 'Europe/Warsaw', utcOffset: 1 },
  'Portugal': { country: 'Portugal', timezone: 'Europe/Lisbon', utcOffset: 0 },
  
  // Q
  'Qatar': { country: 'Qatar', timezone: 'Asia/Qatar', utcOffset: 3 },
  
  // R
  'Romania': { country: 'Romania', timezone: 'Europe/Bucharest', utcOffset: 2 },
  'Russia': { country: 'Russia', timezone: 'Europe/Moscow', utcOffset: 3 }, // Moscow Time (most populated)
  
  // S
  'Saudi Arabia': { country: 'Saudi Arabia', timezone: 'Asia/Riyadh', utcOffset: 3 },
  'Senegal': { country: 'Senegal', timezone: 'Africa/Dakar', utcOffset: 0 },
  'Serbia': { country: 'Serbia', timezone: 'Europe/Belgrade', utcOffset: 1 },
  'Sierra Leone': { country: 'Sierra Leone', timezone: 'Africa/Freetown', utcOffset: 0 },
  'Singapore': { country: 'Singapore', timezone: 'Asia/Singapore', utcOffset: 8 },
  'Slovakia': { country: 'Slovakia', timezone: 'Europe/Bratislava', utcOffset: 1 },
  'Slovenia': { country: 'Slovenia', timezone: 'Europe/Ljubljana', utcOffset: 1 },
  'Somalia': { country: 'Somalia', timezone: 'Africa/Mogadishu', utcOffset: 3 },
  'South Africa': { country: 'South Africa', timezone: 'Africa/Johannesburg', utcOffset: 2 },
  'South Korea': { country: 'South Korea', timezone: 'Asia/Seoul', utcOffset: 9 },
  'Spain': { country: 'Spain', timezone: 'Europe/Madrid', utcOffset: 1 },
  'Sri Lanka': { country: 'Sri Lanka', timezone: 'Asia/Colombo', utcOffset: 5.5 },
  'Sudan': { country: 'Sudan', timezone: 'Africa/Khartoum', utcOffset: 2 },
  'Sweden': { country: 'Sweden', timezone: 'Europe/Stockholm', utcOffset: 1 },
  'Switzerland': { country: 'Switzerland', timezone: 'Europe/Zurich', utcOffset: 1 },
  'Syria': { country: 'Syria', timezone: 'Asia/Damascus', utcOffset: 2 },
  
  // T
  'Tajikistan': { country: 'Tajikistan', timezone: 'Asia/Dushanbe', utcOffset: 5 },
  'Thailand': { country: 'Thailand', timezone: 'Asia/Bangkok', utcOffset: 7 },
  'Tunisia': { country: 'Tunisia', timezone: 'Africa/Tunis', utcOffset: 1 },
  'Turkey': { country: 'Turkey', timezone: 'Europe/Istanbul', utcOffset: 3 },
  'Turkmenistan': { country: 'Turkmenistan', timezone: 'Asia/Ashgabat', utcOffset: 5 },
  
  // U
  'UAE': { country: 'UAE', timezone: 'Asia/Dubai', utcOffset: 4 },
  'Ukraine': { country: 'Ukraine', timezone: 'Europe/Kiev', utcOffset: 2 },
  'United Kingdom': { country: 'United Kingdom', timezone: 'Europe/London', utcOffset: 0 },
  'United States': { country: 'United States', timezone: 'America/New_York', utcOffset: -5 }, // Eastern Time (most populated)
  'Uzbekistan': { country: 'Uzbekistan', timezone: 'Asia/Tashkent', utcOffset: 5 },
  
  // V
  'Venezuela': { country: 'Venezuela', timezone: 'America/Caracas', utcOffset: -4 },
  'Vietnam': { country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', utcOffset: 7 },
  
  // Y
  'Yemen': { country: 'Yemen', timezone: 'Asia/Aden', utcOffset: 3 },
};

export interface TimeDifferenceResult {
  hoursDifference: number;
  userTimeZone: string;
  otherUserTimeZone: string;
  message: string;
  isSignificant: boolean; // true if difference is 3+ hours
}

export function calculateTimeDifference(
  userCountry?: string,
  otherUserCountry?: string
): TimeDifferenceResult | null {
  if (!userCountry || !otherUserCountry) {
    return null;
  }

  // Get timezone info for both users based on country only
  const userTimezone = getTimezoneInfo(userCountry);
  const otherUserTimezone = getTimezoneInfo(otherUserCountry);

  if (!userTimezone || !otherUserTimezone) {
    return null;
  }

  const hoursDifference = Math.abs(userTimezone.utcOffset - otherUserTimezone.utcOffset);
  const isSignificant = hoursDifference >= 3;

  let message = '';
  if (hoursDifference === 0) {
    message = 'You are in the same timezone';
  } else if (hoursDifference < 3) {
    message = `Small time difference of ${formatHours(hoursDifference)}`;
  } else if (hoursDifference < 6) {
    message = `Moderate time difference of ${formatHours(hoursDifference)}`;
  } else if (hoursDifference < 12) {
    message = `Large time difference of ${formatHours(hoursDifference)}`;
  } else {
    message = `Very large time difference of ${formatHours(hoursDifference)}`;
  }

  return {
    hoursDifference,
    userTimeZone: userTimezone.timezone,
    otherUserTimeZone: otherUserTimezone.timezone,
    message,
    isSignificant
  };
}

function getTimezoneInfo(country: string): TimezoneInfo | null {
  // Get timezone info directly from country
  const countryTimezone = COUNTRY_TIMEZONES[country];
  if (countryTimezone) {
    return countryTimezone;
  }

  // If country not found, return null
  console.warn(`Timezone not found for country: ${country}`);
  return null;
}

function formatHours(hours: number): string {
  if (hours === Math.floor(hours)) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (wholeHours === 0) {
      return `${minutes} minutes`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  }
}

export function getLocalTimeForUser(
  selectedDateTime: Date,
  userCountry?: string,
  otherUserCountry?: string
): { userTime: string; otherUserTime: string } | null {
  const timeDiff = calculateTimeDifference(userCountry, otherUserCountry);
  if (!timeDiff) return null;

  const userTimezone = getTimezoneInfo(userCountry);
  const otherUserTimezone = getTimezoneInfo(otherUserCountry);

  if (!userTimezone || !otherUserTimezone) return null;

  // Calculate the time in each timezone
  const utcTime = new Date(selectedDateTime.getTime() - (userTimezone.utcOffset * 60 * 60 * 1000));
  const otherUserTime = new Date(utcTime.getTime() + (otherUserTimezone.utcOffset * 60 * 60 * 1000));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return {
    userTime: formatTime(selectedDateTime),
    otherUserTime: formatTime(otherUserTime)
  };
}
