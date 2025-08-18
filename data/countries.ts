// Comprehensive countries and cities data
export interface CountryData {
  name: string;
  cities: string[];
}

export const countriesData: CountryData[] = [
  {
    name: 'Afghanistan',
    cities: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Lashkar Gah', 'Taloqan', 'Pul-e-Khumri', 'Ghazni', 'Others']
  },
  {
    name: 'Albania',
    cities: ['Tirana', 'Durrës', 'Vlorë', 'Elbasan', 'Shkodër', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë', 'Others']
  },
  {
    name: 'Azerbaijan',
    cities: ['Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Quba', 'Lankaran', 'Shaki', 'Yevlakh', 'Shirvan', 'Nakhchivan', 'Others']
  },
  {
    name: 'Algeria',
    cities: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra', 'Others']
  },
  {
    name: 'Argentina',
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Others']
  },
  {
    name: 'Australia',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Others']
  },
  {
    name: 'Austria',
    cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Others']
  },
  {
    name: 'Bahrain',
    cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali', 'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs', 'Al-Malikiyah', 'Others']
  },
  {
    name: 'Bangladesh',
    cities: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Comilla', 'Narayanganj', 'Gazipur', 'Others']
  },
  {
    name: 'Belgium',
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Others']
  },
  {
    name: 'Bolivia',
    cities: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija', 'Cobija', 'Trinidad', 'Riberalta', 'Others']
  },
  {
    name: 'Bosnia and Herzegovina',
    cities: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar', 'Bijeljina', 'Brčko', 'Prijedor', 'Trebinje', 'Doboj', 'Others']
  },
  {
    name: 'Brazil',
    cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Others']
  },
  {
    name: 'Brunei',
    cities: ['Bandar Seri Begawan', 'Kuala Belait', 'Seria', 'Tutong', 'Bangar', 'Muara', 'Lumapas', 'Kampong Spang', 'Kampong Sungai Liang', 'Kampong Mulaut', 'Others']
  },
  {
    name: 'Burkina Faso',
    cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya', 'Pouytenga', 'Kaya', 'Tenkodogo', 'Orodara', 'Fada Ngourma', 'Others']
  },
  {
    name: 'Bulgaria',
    cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Others']
  },
  {
    name: 'Cambodia',
    cities: ['Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville', 'Poipet', 'Kampong Cham', 'Ta Khmau', 'Pursat', 'Kampong Speu', 'Kratie', 'Others']
  },
  {
    name: 'Canada',
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'Others']
  },
  {
    name: 'Chile',
    cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán', 'Others']
  },
  {
    name: 'China',
    cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing', 'Foshan', 'Others']
  },
  {
    name: 'Colombia',
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Others']
  },
  {
    name: 'Comoros',
    cities: ['Moroni', 'Mutsamudu', 'Fomboni', 'Domoni', 'Tsémbéhou', 'Ouani', 'Mramani', 'Koni-Djodjo', 'Mirontsy', 'Adda-Douéni', 'Others']
  },
  {
    name: 'Croatia',
    cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Sesvete', 'Karlovac', 'Varaždin', 'Others']
  },
  {
    name: 'Czech Republic',
    cities: ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec', 'Olomouc', 'Budejovice', 'Hradec Kralove', 'Usti nad Labem', 'Pardubice', 'Others']
  },
  {
    name: 'Djibouti',
    cities: ['Djibouti City', 'Ali Sabieh', 'Dikhil', 'Tadjourah', 'Obock', 'Holhol', 'Yoboki', 'Arta', 'Balho', 'Randa', 'Others']
  },
  {
    name: 'Denmark',
    cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Others']
  },
  {
    name: 'Egypt',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El-Mahalla El-Kubra', 'Tanta', 'Asyut', 'Others']
  },
  {
    name: 'Estonia',
    cities: ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve', 'Viljandi', 'Rakvere', 'Maardu', 'Sillamäe', 'Kuressaare', 'Others']
  },
  {
    name: 'Finland',
    cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori', 'Others']
  },
  {
    name: 'France',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Others']
  },
  {
    name: 'Germany',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Others']
  },
  {
    name: 'Ghana',
    cities: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Sunyani', 'Cape Coast', 'Obuasi', 'Teshie', 'Madina', 'Others']
  },
  {
    name: 'Greece',
    cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Ioannina', 'Kavala', 'Chania', 'Lamia', 'Others']
  },
  {
    name: 'Hungary',
    cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely', 'Others']
  },
  {
    name: 'India',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Others']
  },
  {
    name: 'Indonesia',
    cities: ['Jakarta', 'Surabaya', 'Bandung', 'Bekasi', 'Medan', 'Tangerang', 'Depok', 'Semarang', 'Palembang', 'Makassar', 'Others']
  },
  {
    name: 'Iran',
    cities: ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Qom', 'Ahvaz', 'Kermanshah', 'Urmia', 'Others']
  },
  {
    name: 'Iraq',
    cities: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Kirkuk', 'Sulaymaniyah', 'Nasiriyah', 'Amarah', 'Duhok', 'Others']
  },
  {
    name: 'Ireland',
    cities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan', 'Others']
  },
  {
    name: 'Israel',
    cities: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Be\'er Sheva', 'Bnei Brak', 'Holon', 'Others']
  },
  {
    name: 'Italy',
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Others']
  },
  {
    name: 'Japan',
    cities: ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Saitama', 'Others']
  },
  {
    name: 'Jordan',
    cities: ['Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Quwaysimah', 'Wadi as-Sir', 'Aqaba', 'Madaba', 'As-Salt', 'Jerash', 'Others']
  },
  {
    name: 'Kazakhstan',
    cities: ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Karaganda', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Others']
  },
  {
    name: 'Kenya',
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Kitale', 'Malindi', 'Garissa', 'Kakamega', 'Others']
  },
  {
    name: 'Kuwait',
    cities: ['Kuwait City', 'Al Ahmadi', 'Hawalli', 'As Salimiyah', 'Sabah as Salim', 'Al Farwaniyah', 'Al Fahahil', 'Al Mahbula', 'Ar Riqqah', 'Ar Rabiyah', 'Others']
  },
  {
    name: 'Kyrgyzstan',
    cities: ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Tokmok', 'Uzgen', 'Naryn', 'Talas', 'Batken', 'Kant', 'Others']
  },
  {
    name: 'Latvia',
    cities: ['Riga', 'Daugavpils', 'Liepaja', 'Jelgava', 'Jurmala', 'Ventspils', 'Rezekne', 'Jekabpils', 'Valmiera', 'Ogre', 'Others']
  },
  {
    name: 'Lebanon',
    cities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek', 'Byblos', 'Aley', 'Others']
  },
  {
    name: 'Libya',
    cities: ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Bayda', 'Zawiya', 'Ajdabiya', 'Tobruk', 'Sabha', 'Derna', 'Others']
  },
  {
    name: 'Lithuania',
    cities: ['Vilnius', 'Kaunas', 'Klaipeda', 'Siauliai', 'Panevezys', 'Alytus', 'Marijampole', 'Mazeikiai', 'Jonava', 'Utena', 'Others']
  },
  {
    name: 'Malaysia',
    cities: ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Seremban', 'Kuala Terengganu', 'Kota Kinabalu', 'Klang', 'Others']
  },
  {
    name: 'Maldives',
    cities: ['Male', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi', 'Thinadhoo', 'Ungoofaaru', 'Naifaru', 'Dhidhdhoo', 'Fonadhoo', 'Eydhafushi', 'Others']
  },
  {
    name: 'Mali',
    cities: ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Ségou', 'Kayes', 'Gao', 'Kati', 'Tombouctou', 'Markala', 'Others']
  },
  {
    name: 'Mauritania',
    cities: ['Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Zouérat', 'Rosso', 'Boghé', 'Sélibaby', 'Atar', 'Akjoujt', 'Others']
  },
  {
    name: 'Mexico',
    cities: ['Mexico City', 'Ecatepec', 'Guadalajara', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Monterrey', 'Nezahualcóyotl', 'Others']
  },
  {
    name: 'Morocco',
    cities: ['Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Others']
  },
  {
    name: 'Myanmar',
    cities: ['Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Bago', 'Pathein', 'Monywa', 'Meiktila', 'Myitkyina', 'Lashio', 'Others']
  },
  {
    name: 'Nepal',
    cities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Janakpur', 'Others']
  },
  {
    name: 'Netherlands',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Others']
  },
  {
    name: 'New Zealand',
    cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua', 'Others']
  },
  {
    name: 'Nigeria',
    cities: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Others']
  },
  {
    name: 'Niger',
    cities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso', 'Tillabéri', 'Diffa', 'Tessaoua', 'Arlit', 'Others']
  },
  {
    name: 'Norway',
    cities: ['Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Others']
  },
  {
    name: 'Oman',
    cities: ['Muscat', 'Seeb', 'Salalah', 'Bawshar', 'Sohar', 'As Suwayq', 'Ibri', 'Saham', 'Barka', 'Rustaq', 'Others']
  },
  {
    name: 'Pakistan',
    cities: ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta', 'Others']
  },
  {
    name: 'Palestine',
    cities: ['Gaza', 'Hebron', 'Nablus', 'Ramallah', 'Khan Yunis', 'Rafah', 'Jenin', 'Tulkarm', 'Qalqilya', 'Bethlehem', 'Others']
  },
  {
    name: 'Philippines',
    cities: ['Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati', 'Pasig', 'Taguig', 'Cebu City', 'Davao City', 'Antipolo', 'Others']
  },
  {
    name: 'Poland',
    cities: ['Warsaw', 'Krakow', 'Lodz', 'Wroclaw', 'Poznan', 'Gdansk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Others']
  },
  {
    name: 'Portugal',
    cities: ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Almada', 'Coimbra', 'Funchal', 'Setubal', 'Agualva-Cacem', 'Others']
  },
  {
    name: 'Qatar',
    cities: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor', 'Dukhan', 'Lusail', 'Al Shamal', 'Mesaieed', 'Al Wukair', 'Others']
  },
  {
    name: 'Romania',
    cities: ['Bucharest', 'Cluj-Napoca', 'Timisoara', 'Iasi', 'Constanta', 'Craiova', 'Brasov', 'Galati', 'Ploiesti', 'Oradea', 'Others']
  },
  {
    name: 'Russia',
    cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don', 'Others']
  },
  {
    name: 'Saudi Arabia',
    cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hofuf', 'Others']
  },
  {
    name: 'Senegal',
    cities: ['Dakar', 'Touba', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor', 'Diourbel', 'Tambacounda', 'Mbour', 'Rufisque', 'Others']
  },
  {
    name: 'Sierra Leone',
    cities: ['Freetown', 'Bo', 'Kenema', 'Koidu', 'Makeni', 'Waterloo', 'Port Loko', 'Kailahun', 'Bonthe', 'Moyamba', 'Others']
  },
  {
    name: 'Somalia',
    cities: ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Merca', 'Galkayo', 'Baidoa', 'Berbera', 'Las Anod', 'Garowe', 'Others']
  },
  {
    name: 'Sudan',
    cities: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Obeid', 'Nyala', 'Gedaref', 'El Fasher', 'Wad Madani', 'Atbara', 'Others']
  },
  {
    name: 'Serbia',
    cities: ['Belgrade', 'Novi Sad', 'Nis', 'Kragujevac', 'Subotica', 'Pancevo', 'Zrenjanin', 'Leskovac', 'Novi Pazar', 'Vranje', 'Others']
  },
  {
    name: 'Singapore',
    cities: ['Singapore City', 'Jurong', 'Woodlands', 'Tampines', 'Sengkang', 'Hougang', 'Yishun', 'Bedok', 'Punggol', 'Ang Mo Kio', 'Others']
  },
  {
    name: 'Slovakia',
    cities: ['Bratislava', 'Kosice', 'Presov', 'Zilina', 'Banska Bystrica', 'Nitra', 'Trnava', 'Martin', 'Trencin', 'Poprad', 'Others']
  },
  {
    name: 'Slovenia',
    cities: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Trbovlje', 'Kamnik', 'Others']
  },
  {
    name: 'South Africa',
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Kimberley', 'Others']
  },
  {
    name: 'South Korea',
    cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang', 'Others']
  },
  {
    name: 'Spain',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Others']
  },
  {
    name: 'Sri Lanka',
    cities: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura', 'Ratnapura', 'Batticaloa', 'Matara', 'Kurunegala', 'Others']
  },
  {
    name: 'Sweden',
    cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Others']
  },
  {
    name: 'Switzerland',
    cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Others']
  },
  {
    name: 'Syria',
    cities: ['Damascus', 'Aleppo', 'Homs', 'Hamah', 'Latakia', 'Deir ez-Zor', 'Raqqa', 'Al-Hasakah', 'Qamishli', 'Tartus', 'Others']
  },
  {
    name: 'Tajikistan',
    cities: ['Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa', 'Istaravshan', 'Konibodom', 'Isfara', 'Panjakent', 'Tursunzoda', 'Vahdat', 'Others']
  },
  {
    name: 'Thailand',
    cities: ['Bangkok', 'Chiang Mai', 'Pattaya', 'Phuket', 'Hat Yai', 'Nakhon Ratchasima', 'Khon Kaen', 'Udon Thani', 'Pak Kret', 'Chon Buri', 'Others']
  },
  {
    name: 'Tunisia',
    cities: ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Kasserine', 'Others']
  },
  {
    name: 'Turkey',
    cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin', 'Others']
  },
  {
    name: 'Turkmenistan',
    cities: ['Ashgabat', 'Turkmenbashi', 'Balkanabat', 'Dashoguz', 'Mary', 'Türkmenabat', 'Tejen', 'Serdar', 'Baýramaly', 'Abadan', 'Others']
  },
  {
    name: 'UAE',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Dibba Al-Fujairah', 'Others']
  },
  {
    name: 'Ukraine',
    cities: ['Kiev', 'Kharkiv', 'Odessa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol', 'Others']
  },
  {
    name: 'United Kingdom',
    cities: ['London', 'Birmingham', 'Glasgow', 'Liverpool', 'Bristol', 'Manchester', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester', 'Others']
  },
  {
    name: 'United States',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Others']
  },
  {
    name: 'Uzbekistan',
    cities: ['Tashkent', 'Namangan', 'Samarkand', 'Andijan', 'Nukus', 'Fergana', 'Bukhara', 'Qarshi', 'Kokand', 'Margilan', 'Others']
  },
  {
    name: 'Venezuela',
    cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'San Cristóbal', 'Maturín', 'Ciudad Bolívar', 'Cumana', 'Others']
  },
  {
    name: 'Vietnam',
    cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Bien Hoa', 'Hue', 'Nha Trang', 'Can Tho', 'Rach Gia', 'Quy Nhon', 'Vung Tau', 'Others']
  },
  {
    name: 'Yemen',
    cities: ['Sanaa', 'Aden', 'Taiz', 'Al Hudaydah', 'Mukalla', 'Ibb', 'Dhamar', 'Amran', 'Saada', 'Sayyan', 'Others']
  }
].sort((a, b) => a.name.localeCompare(b.name));

// Helper function to get countries as dropdown items
export const getCountriesAsDropdownItems = () => {
  return countriesData.map(country => ({
    label: country.name,
    value: country.name
  }));
};

// Helper function to get cities for a specific country
export const getCitiesForCountry = (countryName: string) => {
  const country = countriesData.find(c => c.name === countryName);
  return country ? country.cities.map(city => ({
    label: city,
    value: city
  })) : [];
};

export default countriesData;
