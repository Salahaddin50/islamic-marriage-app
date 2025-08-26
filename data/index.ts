import { images } from "@/constants";

export const friends = [
    {
        id: "1",
        name: "Tynisa Obey",
        phoneNumber: "+1-300-400-0135",
        avatar: images.user1,
    },
    {
        id: "2",
        name: "Florencio Dorance",
        phoneNumber: "+1-309-900-0135",
        avatar: images.user2,
    },
    {
        id: "3", 
        name: "Chantal Shelburne",
        phoneNumber: "+1-400-100-1009",
        avatar: images.user3,
    },
    {
        id: "4",
        name: "Maryland Winkles",
        phoneNumber: "+1-970-200-4550",
        avatar: images.user4,
    },
    {
        id: "5",
        name: "Rodolfo Goode",
        phoneNumber: "+1-100-200-9800",
        avatar: images.user5,
    },
    {
        id: "6",
        name: "Benny Spanbauer",
        phoneNumber: "+1-780-200-9800",
        avatar: images.user6,
    },
    {
        id: "7",
        name: "Tyra Dillon",
        phoneNumber: "+1-943-230-9899",
        avatar: images.user7,
    },
    {
        id: "8",
        name: "Jamel Eusobio",
        phoneNumber: "+1-900-234-9899",
        avatar: images.user8,
    },
    {
        id: "9",
        name: "Pedro Haurad",
        phoneNumber: "+1-240-234-9899",
        avatar: images.user9
    },
    {
        id: "10",
        name: "Clinton Mcclure",
        phoneNumber: "+1-500-234-4555",
        avatar: images.user10
    },
];

export const userAddresses = [
    {
        id: "1",
        name: "Home",
        address: "364 Stillwater Ave, Attleboro, MA 02703",
    },
    {
        id: "2",
        name: "Office",
        address: "73 Virginia Rd, Cuyahoga Falls, OH 44221",
    },
    {
        id: "3",
        name: "Mall Plaza",
        address: "123 Main St, San Francisco, CA 94107",
    },
    {
        id: "4",
        name: "Garden Park",
        address: "600 Bloom St, Portland, OR 97201",
    },
    {
        id: "5",
        name: "Grand City Park",
        address: "26 State St Daphne, AL 36526"
    },
    {
        id: "6",
        name: "Town Square",
        address: "20 Applegate St. Hoboken, NJ 07030"
    },
    {
        id: "7",
        name: "Bank",
        address: "917 W Pine Street Easton, PA 0423"
    }
];

export const faqKeywords = [
    {
        id: "1",
        name: "General"
    },
    {
        id: "2",
        name: "Account"
    },
    {
        id: "3",
        name: "Safety"
    },
    {
        id: "4",
        name: "Matches"
    },
    {
        id: "5",
        name: "Payment"
    }
];

export const faqs = [
    {
        question: 'How do I create a profile on the app?',
        answer: 'To create a profile, download the app, sign up using your email or social media account, and complete your profile details, including adding photos.',
        type: "General"
    },
    {
        question: 'Can I change my profile information after signing up?',
        answer: 'Yes, you can update your profile details at any time by navigating to the "Edit Profile" section in the app settings.',
        type: "Account"
    },
    {
        question: 'What steps does the app take to ensure user safety?',
        answer: 'The app includes features such as profile verification, in-app reporting, and safety tips to provide a secure dating environment.',
        type: "Safety"
    },
    {
        question: 'How do I find and connect with potential matches?',
        answer: 'You can browse profiles, use filters to refine your search, and swipe or like profiles to show interest. If there’s mutual interest, you can start a conversation.',
        type: "Matches"
    },
    {
        question: 'Is there a way to boost my profile visibility?',
        answer: 'Yes, the app offers features like profile boosts and highlights to increase your visibility to other users.',
        type: "Payment"
    },
    {
        question: 'How can I block or report another user?',
        answer: 'To block or report a user, go to their profile, tap the menu icon, and select "Block" or "Report." Provide details for our review team to address the issue.',
        type: "Safety"
    },
    {
        question: 'Can I adjust my preferences for finding matches?',
        answer: 'Yes, you can customize your match preferences by adjusting filters such as age, location, and interests in the settings menu.',
        type: "Matches"
    },
    {
        question: 'What should I do if I encounter a payment issue?',
        answer: 'If you experience payment issues, contact support through the app’s help section or check your payment settings to ensure accurate billing details.',
        type: "Payment"
    },
    {
        question: 'Does the app offer customer support?',
        answer: 'Yes, you can reach our customer support team via the help section in the app for assistance with any issues or questions.',
        type: "General"
    },
];

export const messsagesData = [
    {
        id: "1",
        fullName: "Jhon Smith",
        userImg: images.user1,
        lastSeen: "2023-11-16T04:52:06.501Z",
        lastMessage: 'I love you. see you soon baby',
        messageInQueue: 2,
        lastMessageTime: "12:25 PM",
        isOnline: true,
    },
    {
        id: "2",
        fullName: "Anuska Sharma",
        userImg: images.user2,
        lastSeen: "2023-11-18T04:52:06.501Z",
        lastMessage: 'I Know. you are so busy man.',
        messageInQueue: 0,
        lastMessageTime: "12:15 PM",
        isOnline: false
    },
    {
        id: "3",
        fullName: "Virat Kohili",
        userImg: images.user3,
        lastSeen: "2023-11-20T04:52:06.501Z",
        lastMessage: 'Ok, see u soon',
        messageInQueue: 0,
        lastMessageTime: "09:12 PM",
        isOnline: true
    },
    {
        id: "4",
        fullName: "Shikhor Dhaon",
        userImg: images.user4,
        lastSeen: "2023-11-18T04:52:06.501Z",
        lastMessage: 'Great! Do you Love it.',
        messageInQueue: 0,
        lastMessageTime: "04:12 PM",
        isOnline: true
    },
    {
        id: "5",
        fullName: "Shakib Hasan",
        userImg: images.user5,
        lastSeen: "2023-11-21T04:52:06.501Z",
        lastMessage: 'Thank you !',
        messageInQueue: 2,
        lastMessageTime: "10:30 AM",
        isOnline: true
    },
    {
        id: "6",
        fullName: "Jacksoon",
        userImg: images.user6,
        lastSeen: "2023-11-20T04:52:06.501Z",
        lastMessage: 'Do you want to go out dinner',
        messageInQueue: 3,
        lastMessageTime: "10:05 PM",
        isOnline: false
    },
    {
        id: "7",
        fullName: "Tom Jerry",
        userImg: images.user7,
        lastSeen: "2023-11-20T04:52:06.501Z",
        lastMessage: 'Do you want to go out dinner',
        messageInQueue: 2,
        lastMessageTime: "11:05 PM",
        isOnline: true
    },
    {
        id: "8",
        fullName: "Lucky Luck",
        userImg: images.user8,
        lastSeen: "2023-11-20T04:52:06.501Z",
        lastMessage: 'Can you share the design with me?',
        messageInQueue: 2,
        lastMessageTime: "09:11 PM",
        isOnline: true
    },
    {
        id: "9",
        fullName: "Nate Jack",
        userImg: images.user9,
        lastSeen: "2023-11-20T04:52:06.501Z",
        lastMessage: 'Tell me what you want?',
        messageInQueue: 0,
        lastMessageTime: "06:43 PM",
        isOnline: true
    }
];

export const callData = [
    {
        id: "1",
        fullName: "Roselle Erhman",
        userImg: images.user10,
        status: "Incoming",
        date: "Dec 19, 2024"
    },
    {
        id: "2",
        fullName: "Willard Purnell",
        userImg: images.user9,
        status: "Outgoing",
        date: "Dec 17, 2024"
    },
    {
        id: "3",
        fullName: "Charlotte Hanlin",
        userImg: images.user8,
        status: "Missed",
        date: "Dec 16, 2024"
    },
    {
        id: "4",
        fullName: "Merlin Kevin",
        userImg: images.user7,
        status: "Missed",
        date: "Dec 16, 2024"
    },
    {
        id: "5",
        fullName: "Lavern Laboy",
        userImg: images.user6,
        status: "Outgoing",
        date: "Dec 16, 2024"
    },
    {
        id: "6",
        fullName: "Phyllis Godley",
        userImg: images.user5,
        status: "Incoming",
        date: "Dec 15, 2024"
    },
    {
        id: "7",
        fullName: "Tyra Dillon",
        userImg: images.user4,
        status: "Outgoing",
        date: "Dec 15, 2024"
    },
    {
        id: "8",
        fullName: "Marci Center",
        userImg: images.user3,
        status: "Missed",
        date: "Dec 15, 2024"
    },
    {
        id: "9",
        fullName: "Clinton Mccure",
        userImg: images.user2,
        status: "Outgoing",
        date: "Dec 15, 2024"
    },
];


export const interests = [
    '🎮 Gaming',
    '💃🎤 Dancing & Singing',
    '🌍 Language',
    '🎬 Movie',
    '📚 Book & Novel',
    '🏛️ Architecture',
    '📸 Photography',
    '👗 Fashion',
    '✍️ Writing',
    '🌱 Nature & Plant',
    '🎨 Painting',
    '⚽ Football',
    '🐾 Animals',
    '👥 People & Society',
    '🏋️‍♂️ Gym & Fitness',
    '🍔 Food & Drink',
    '✈️ Travel & Places',
    '🎭 Art',
    '🎶 Music',
    '🌌 Astronomy',
    '🚗 Cars & Automobiles',
    '🏞️ Adventure & Hiking',
    '🔬 Science & Technology',
    '📈 Business & Startups',
    '🧘‍♂️ Meditation & Wellness',
    '🕹️ Esports & Competitive Gaming',
    '👾 Coding & Programming',
    '🎯 Board Games & Puzzles',
    '🛒 Shopping & Trends'
];


export const menbers = [
    {
        id: 1,
        name: "Luciana Julia",
        location: "Portland illinois",
        distance: 5,
        age: 23,
        image: images.menber1,
        height: "5'8\"",
    }, 
    {
        id: 2,
        name: "William Ida",
        location: "Portland illinois",
        distance: 8,
        age: 24,
        image: images.menber2,
        height: "6'1\"",
    },
    {
        id: 3,
        name: "Tracy Fradera",
        location: "Portland illinois",
        distance: 18,
        age: 24,
        image: images.menber3,
        height: "5'6\"",
    },
    {
        id: 4,
        name: "Doreatha Grave",
        location: "Portland illinois",
        distance: 9,
        age: 24,
        image: images.menber4,
        height: "5'9\"",
    },
    {
        id: 5,
        name: "Jacquetta Bobalik",
        location: "Portland illinois",
        distance: 29,
        age: 24,
        image: images.menber5,
        height: "5'7\"",
    },
    {
        id: 6,
        name: "Velia Kwasniak",
        location: "Portland illinois",
        distance: 21,
        age: 24,
        image: images.menber6,
        height: "5'10\"",
    },
    {
        id: 7,
        name: "Karisa Delorm",
        location: "Portland illinois",
        distance: 10,
        age: 24,
        image: images.menber7,
        height: "5'5\"",
    },
    {
        id: 8,
        name: "Cecil Agudelo",
        location: "Portland illinois",
        distance: 15,
        age: 24,
        image: images.menber8,
        height: "6'0\"",
    }
]

export const newMatches = [
    {
        id: 1,
        name: "Luciana",
        location: "Portland illinois",
        distance: 11,
        age: 23,
        image: images.menber1,
        position: "Model"
    }, 
    {
        id: 2,
        name: "William",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber2,
        position: "Artist"
    },
    {
        id: 3,
        name: "Tracy",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber3,
        position: "Vlogger"
    },
    {
        id: 4,
        name: "Doreatha",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber4,
        position: "Student"
    },
    {
        id: 5,
        name: "Jacquetta",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber5,
        position: "Model"
    },
    {
        id: 6,
        name: "Velia",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber6,
        position: "Student"
    },
    {
        id: 7,
        name: "Karisa",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber7,
        position: "Artist"
    },
    {
        id: 8,
        name: "Cecil",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber8,
        position: "Vlogger"
    }
]

export const yourMatches = [
    {
        id: 1,
        name: "Luciana",
        location: "Portland illinois",
        distance: 11,
        age: 23,
        image: images.menber1,
        position: "Model"
    }, 
    {
        id: 2,
        name: "William",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber2,
        position: "Artist"
    },
    {
        id: 3,
        name: "Tracy",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber3,
        position: "Vlogger"
    },
    {
        id: 4,
        name: "Doreatha",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber4,
        position: "Student"
    },
    {
        id: 5,
        name: "Jacquetta",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber5,
        position: "Model"
    },
    {
        id: 6,
        name: "Velia",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber6,
        position: "Student"
    },
    {
        id: 7,
        name: "Karisa",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber7,
        position: "Artist"
    },
    {
        id: 8,
        name: "Cecil",
        location: "Portland illinois",
        distance: 11,
        age: 24,
        image: images.menber8,
        position: "Vlogger"
    }
];

export const notifications = [
    {
        id: "1",
        title: "Enhanced Profile Security!",
        description: "Hume now supports Two-Factor Authentication to keep your account secure. Enable it today!",
        date: "2024-06-04T04:52:06.501Z",
        time: "4:52 PM",
        type: "Security",
        isNew: true
    },
    {
        id: "2",
        title: "Profile Verified!",
        description: "Congratulations! Your profile has been successfully verified. This boosts your visibility on Hume.",
        date: "2024-06-04T04:52:06.501Z",
        time: "08:52 PM",
        type: "Account",
        isNew: true
    },
    {
        id: "3",
        title: "New App Update!",
        description: "Update Hume now to enjoy the latest features, including advanced match filters and video chat.",
        date: "2024-06-04T07:12:06.501Z",
        time: "07:12 AM",
        type: "Update",
        isNew: false
    },
    {
        id: "4",
        title: "Payment Method Linked Successfully!",
        description: "Your payment method has been successfully linked. Enjoy seamless premium subscription access.",
        date: "2024-06-04T11:14:06.501Z",
        time: "11:14 AM",
        type: "Payment",
        isNew: false
    },
    {
        id: "5",
        title: "Welcome to Hume!",
        description: "Your account setup is complete. Start exploring and connecting with amazing people today.",
        date: "2024-06-03T08:39:06.501Z",
        time: "08:39 AM",
        type: "Account",
        isNew: false
    },
    {
        id: "6",
        title: "New Match Alert!",
        description: "You’ve matched with Alex! Start a conversation and get to know each other.",
        date: "2024-06-02T09:52:06.501Z",
        time: "09:52 AM",
        type: "Match",
        isNew: false
    },
    {
        id: "7",
        title: "Scheduled Maintenance Notice!",
        description: "Hume will undergo scheduled maintenance on June 10, 2024, from 02:00 AM to 04:00 AM. Please plan accordingly.",
        date: "2024-06-01T03:22:06.501Z",
        time: "03:22 AM",
        type: "Update",
        isNew: false
    },
    {
        id: "8",
        title: "New Payment Options Available!",
        description: "Hume now supports Google Pay and Apple Pay for seamless subscription management.",
        date: "2024-05-30T06:15:06.501Z",
        time: "06:15 AM",
        type: "Payment",
        isNew: false
    },
    {
        id: "9",
        title: "Invite Friends and Earn Rewards!",
        description: "Invite your friends to Hume and earn credits for every successful referral.",
        date: "2024-05-29T10:00:06.501Z",
        time: "10:00 AM",
        type: "Rewards",
        isNew: false
    },
    {
        id: "10",
        title: "Password Changed Successfully!",
        description: "Your Hume account password has been updated. If you didn't make this change, contact support immediately.",
        date: "2024-05-28T04:52:06.501Z",
        time: "04:52 AM",
        type: "Security",
        isNew: false
    }
];
