// ISO 3166-1 alpha-2 country code → approximate geographic centroid
export const CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AF: { lat: 33.9,  lng: 67.7  }, // Afghanistan
  AL: { lat: 41.1,  lng: 20.2  }, // Albania
  DZ: { lat: 28.0,  lng: 3.0   }, // Algeria
  AO: { lat: -11.2, lng: 17.9  }, // Angola
  AR: { lat: -38.4, lng: -63.6 }, // Argentina
  AM: { lat: 40.1,  lng: 45.0  }, // Armenia
  AU: { lat: -25.3, lng: 133.8 }, // Australia
  AT: { lat: 47.5,  lng: 14.6  }, // Austria
  AZ: { lat: 40.1,  lng: 47.6  }, // Azerbaijan
  BD: { lat: 23.7,  lng: 90.4  }, // Bangladesh
  BY: { lat: 53.7,  lng: 28.0  }, // Belarus
  BE: { lat: 50.5,  lng: 4.5   }, // Belgium
  BJ: { lat: 9.3,   lng: 2.3   }, // Benin
  BO: { lat: -16.3, lng: -63.6 }, // Bolivia
  BA: { lat: 44.2,  lng: 17.7  }, // Bosnia and Herzegovina
  BR: { lat: -14.2, lng: -51.9 }, // Brazil
  BF: { lat: 12.4,  lng: -1.6  }, // Burkina Faso
  MM: { lat: 21.9,  lng: 95.9  }, // Myanmar
  BI: { lat: -3.4,  lng: 29.9  }, // Burundi
  KH: { lat: 12.6,  lng: 104.9 }, // Cambodia
  CM: { lat: 3.8,   lng: 11.5  }, // Cameroon
  CA: { lat: 56.1,  lng: -106.3}, // Canada
  CF: { lat: 6.6,   lng: 20.9  }, // Central African Republic
  TD: { lat: 15.5,  lng: 18.7  }, // Chad
  CL: { lat: -35.7, lng: -71.5 }, // Chile
  CN: { lat: 35.9,  lng: 104.2 }, // China
  CO: { lat: 4.6,   lng: -74.3 }, // Colombia
  CG: { lat: -0.2,  lng: 15.8  }, // Congo
  CD: { lat: -4.0,  lng: 21.8  }, // DR Congo
  HR: { lat: 45.1,  lng: 15.2  }, // Croatia
  CU: { lat: 21.5,  lng: -79.5 }, // Cuba
  CY: { lat: 35.1,  lng: 33.4  }, // Cyprus
  CZ: { lat: 49.8,  lng: 15.5  }, // Czech Republic
  DK: { lat: 56.3,  lng: 9.5   }, // Denmark
  DJ: { lat: 11.6,  lng: 43.1  }, // Djibouti
  DO: { lat: 18.7,  lng: -70.2 }, // Dominican Republic
  EC: { lat: -1.8,  lng: -78.2 }, // Ecuador
  EG: { lat: 26.8,  lng: 30.8  }, // Egypt
  SV: { lat: 13.8,  lng: -88.9 }, // El Salvador
  ER: { lat: 15.2,  lng: 39.8  }, // Eritrea
  ET: { lat: 9.1,   lng: 40.5  }, // Ethiopia
  FI: { lat: 61.9,  lng: 25.7  }, // Finland
  FR: { lat: 46.2,  lng: 2.2   }, // France
  GA: { lat: -0.8,  lng: 11.6  }, // Gabon
  GE: { lat: 42.3,  lng: 43.4  }, // Georgia
  DE: { lat: 51.2,  lng: 10.5  }, // Germany
  GH: { lat: 7.9,   lng: -1.0  }, // Ghana
  GR: { lat: 39.1,  lng: 21.8  }, // Greece
  GT: { lat: 15.8,  lng: -90.2 }, // Guatemala
  GN: { lat: 11.0,  lng: -10.9 }, // Guinea
  HT: { lat: 19.0,  lng: -72.3 }, // Haiti
  HN: { lat: 15.2,  lng: -86.2 }, // Honduras
  HU: { lat: 47.2,  lng: 19.5  }, // Hungary
  IN: { lat: 20.6,  lng: 78.9  }, // India
  ID: { lat: -0.8,  lng: 113.9 }, // Indonesia
  IR: { lat: 32.4,  lng: 53.7  }, // Iran
  IQ: { lat: 33.2,  lng: 43.7  }, // Iraq
  IE: { lat: 53.4,  lng: -8.2  }, // Ireland
  IL: { lat: 31.0,  lng: 34.9  }, // Israel
  IT: { lat: 41.9,  lng: 12.6  }, // Italy
  JM: { lat: 18.1,  lng: -77.3 }, // Jamaica
  JP: { lat: 36.2,  lng: 138.3 }, // Japan
  JO: { lat: 30.6,  lng: 36.2  }, // Jordan
  KZ: { lat: 48.0,  lng: 66.9  }, // Kazakhstan
  KE: { lat: -0.0,  lng: 37.9  }, // Kenya
  KP: { lat: 40.3,  lng: 127.5 }, // North Korea
  KR: { lat: 35.9,  lng: 127.8 }, // South Korea
  KW: { lat: 29.3,  lng: 47.5  }, // Kuwait
  KG: { lat: 41.2,  lng: 74.8  }, // Kyrgyzstan
  LA: { lat: 19.9,  lng: 102.5 }, // Laos
  LB: { lat: 33.9,  lng: 35.5  }, // Lebanon
  LY: { lat: 26.3,  lng: 17.2  }, // Libya
  LT: { lat: 55.2,  lng: 23.9  }, // Lithuania
  MK: { lat: 41.6,  lng: 21.7  }, // North Macedonia
  MG: { lat: -18.8, lng: 46.9  }, // Madagascar
  MW: { lat: -13.3, lng: 34.3  }, // Malawi
  MY: { lat: 4.2,   lng: 108.0 }, // Malaysia
  ML: { lat: 17.6,  lng: -4.0  }, // Mali
  MR: { lat: 21.0,  lng: -10.9 }, // Mauritania
  MX: { lat: 23.6,  lng: -102.6}, // Mexico
  MD: { lat: 47.4,  lng: 28.4  }, // Moldova
  MN: { lat: 46.9,  lng: 103.8 }, // Mongolia
  MA: { lat: 31.8,  lng: -7.1  }, // Morocco
  MZ: { lat: -18.7, lng: 35.5  }, // Mozambique
  NA: { lat: -22.9, lng: 18.5  }, // Namibia
  NP: { lat: 28.4,  lng: 84.1  }, // Nepal
  NL: { lat: 52.1,  lng: 5.3   }, // Netherlands
  NZ: { lat: -40.9, lng: 174.9 }, // New Zealand
  NI: { lat: 12.9,  lng: -85.2 }, // Nicaragua
  NE: { lat: 17.6,  lng: 8.1   }, // Niger
  NG: { lat: 9.1,   lng: 8.7   }, // Nigeria
  NO: { lat: 60.5,  lng: 8.5   }, // Norway
  OM: { lat: 21.5,  lng: 55.9  }, // Oman
  PK: { lat: 30.4,  lng: 69.3  }, // Pakistan
  PA: { lat: 8.5,   lng: -80.8 }, // Panama
  PG: { lat: -6.3,  lng: 143.9 }, // Papua New Guinea
  PY: { lat: -23.4, lng: -58.4 }, // Paraguay
  PE: { lat: -9.2,  lng: -75.0 }, // Peru
  PH: { lat: 12.9,  lng: 121.8 }, // Philippines
  PL: { lat: 51.9,  lng: 19.1  }, // Poland
  PT: { lat: 39.4,  lng: -8.2  }, // Portugal
  QA: { lat: 25.4,  lng: 51.2  }, // Qatar
  RO: { lat: 45.9,  lng: 24.9  }, // Romania
  RU: { lat: 61.5,  lng: 105.3 }, // Russia
  RW: { lat: -1.9,  lng: 29.9  }, // Rwanda
  SA: { lat: 23.9,  lng: 45.1  }, // Saudi Arabia
  SN: { lat: 14.5,  lng: -14.5 }, // Senegal
  RS: { lat: 44.0,  lng: 21.0  }, // Serbia
  SL: { lat: 8.5,   lng: -11.8 }, // Sierra Leone
  SO: { lat: 5.2,   lng: 46.2  }, // Somalia
  ZA: { lat: -30.6, lng: 22.9  }, // South Africa
  SS: { lat: 7.9,   lng: 29.7  }, // South Sudan
  ES: { lat: 40.5,  lng: -3.7  }, // Spain
  LK: { lat: 7.9,   lng: 80.8  }, // Sri Lanka
  SD: { lat: 15.6,  lng: 32.5  }, // Sudan
  SE: { lat: 60.1,  lng: 18.6  }, // Sweden
  CH: { lat: 46.8,  lng: 8.2   }, // Switzerland
  SY: { lat: 34.8,  lng: 38.9  }, // Syria
  TW: { lat: 23.7,  lng: 120.9 }, // Taiwan
  TJ: { lat: 38.9,  lng: 71.3  }, // Tajikistan
  TZ: { lat: -6.4,  lng: 34.9  }, // Tanzania
  TH: { lat: 15.9,  lng: 100.9 }, // Thailand
  TL: { lat: -8.9,  lng: 125.7 }, // Timor-Leste
  TG: { lat: 8.6,   lng: 0.8   }, // Togo
  TN: { lat: 33.9,  lng: 9.6   }, // Tunisia
  TR: { lat: 38.9,  lng: 35.2  }, // Turkey
  TM: { lat: 38.9,  lng: 59.6  }, // Turkmenistan
  UG: { lat: 1.4,   lng: 32.3  }, // Uganda
  UA: { lat: 48.4,  lng: 31.2  }, // Ukraine
  AE: { lat: 24.0,  lng: 54.0  }, // UAE
  GB: { lat: 55.4,  lng: -3.4  }, // United Kingdom
  US: { lat: 37.1,  lng: -95.7 }, // United States
  UY: { lat: -32.5, lng: -55.8 }, // Uruguay
  UZ: { lat: 41.4,  lng: 64.6  }, // Uzbekistan
  VE: { lat: 6.4,   lng: -66.6 }, // Venezuela
  VN: { lat: 14.1,  lng: 108.3 }, // Vietnam
  YE: { lat: 15.6,  lng: 48.5  }, // Yemen
  ZM: { lat: -13.1, lng: 27.8  }, // Zambia
  ZW: { lat: -20.0, lng: 30.0  }, // Zimbabwe
}
