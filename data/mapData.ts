import { images } from "../constants";

export const markers = [
  {
    id: "1",
    coordinate: {
      latitude: 22.6293867,
      longitude: 88.4354486,
    },
    name: "Sophia",
    description: "Loves hiking and photography. Looking for someone adventurous.",
    type: "User",
    image: images.user1,
    age: 29,
    size: "5'6",
    interests: ["Hiking", "Photography", "Cooking"],
    distance: 1.2,
    bio: "I believe life is about creating beautiful moments. Let's make some together!",
    lastActive: "10 minutes ago",
    location: "Downtown",
  },
  {
    id: "2",
    coordinate: {
      latitude: 22.6345648,
      longitude: 88.4377279,
    },
    name: "Emma",
    description: "Bookworm and coffee lover. Seeking deep conversations.",
    type: "User",
    image: images.user6,
    age: 26,
    size: "5'4",
    interests: ["Reading", "Coffee", "Traveling"],
    distance: 2.0,
    bio: "Avid reader with a passion for exploring new cultures. Let's grab a coffee?",
    lastActive: "5 minutes ago",
    location: "City Center",
  },
  {
    id: "3",
    coordinate: {
      latitude: 22.6281662,
      longitude: 88.4410113,
    },
    name: "Olivia",
    description: "Fitness enthusiast and foodie. Let's go for a run and brunch!",
    type: "User",
    image: images.user3,
    age: 31,
    size: "5'7",
    interests: ["Fitness", "Food", "Music"],
    distance: 3.5,
    bio: "Love staying active and trying out new cuisines. Can you keep up?",
    lastActive: "20 minutes ago",
    location: "Tech Park",
  },
  {
    id: "4",
    coordinate: {
      latitude: 22.6341137,
      longitude: 88.4497463,
    },
    name: "Ava",
    description: "Artist and dreamer. Seeking someone to inspire and be inspired by.",
    type: "User",
    image: images.user4,
    age: 28,
    size: "5'5",
    interests: ["Art", "Yoga", "Nature"],
    distance: 1.8,
    bio: "Art is my passion, and the world is my canvas. Care to paint it with me?",
    lastActive: "15 minutes ago",
    location: "Riverside",
  },
  {
    id: "5",
    coordinate: {
      latitude: 22.5341137,
      longitude: 88.4797463,
    },
    name: "Isabella",
    description: "Entrepreneur with a love for life. Looking for a partner in crime.",
    type: "User",
    image: images.user9,
    age: 33,
    size: "5'8",
    interests: ["Business", "Travel", "Wine"],
    distance: 5.0,
    bio: "Driven and ambitious but always make time for fun. Let's conquer the world together!",
    lastActive: "30 minutes ago",
    location: "Airport Area",
  }
];


export const mapDarkStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#bdbdbd"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#181818"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#1b1b1b"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#2c2c2c"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#8a8a8a"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#373737"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3c3c3c"
        }
      ]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#4e4e4e"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#000000"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#3d3d3d"
        }
      ]
    }
  ];

export const mapStandardStyle = [
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
];