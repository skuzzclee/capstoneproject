// src/pages/Game.jsx
import React, { useEffect, useState, useMemo, useRef  } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitScore, getGameLeaderboard, getGames, submitFeedback, fetchMyFeedback } from "../services/api";
import "../styles/Game.css";
import useTextToSpeech from "../hooks/useTextToSpeech";
import {
    DigitalFootprintJourney2D,
    PersonalInfoJourney2D,
    PasswordsJourney2D,
    SocialMediaJourney2D,
  } from "./TopicJourneyMiniGame";
import lessonVideo1 from "../assets/v1.mp4";
import lessonVideo2 from "../assets/video2.mp4";
import lessonVideo3 from "../assets/video3.mp4";
import lessonVideo4 from "../assets/video4.mp4";

// -------------------- STATIC CONTENT -------------------- //

const LESSON_VIDEOS = {
  1: lessonVideo1,
  2: lessonVideo2,
  3: lessonVideo3,
  4: lessonVideo4
};

const getVideoType = (src) => {
  if (!src) return "";
  if (src.endsWith(".mp4")) return "video/mp4";
  if (src.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
};


const OBJECTIVES = {
  1: [
    "Understand what a digital footprint is.",
    "Tell the difference between active and passive digital footprints.",
    "Recognize risks of oversharing online (photos, IDs, locations).",
    "Practice thinking before posting or installing apps.",
  ],
  2: [
    "Define personal information and why it is valuable.",
    "Identify different types of personal and sensitive information.",
    "Recognize how attackers exploit personal information.",
    "Apply best practices to protect data online.",
  ],
  3: [
    "Recognize strong passwords and passphrases.",
    "Understand why reusing passwords is dangerous.",
    "Spot scammy, rushed messages that try to steal passwords.",
  ],
  4: [
    "Understand public vs private accounts on social media.",
    "Recognize risky friend requests and DMs.",
    "Use privacy settings to control who can see and contact you.",
  ],
};

const REFLECTION_QUESTIONS = {
  1: [
    "Have you ever posted something you later wanted to delete?",
    "Before your next post, what will you check first?",
  ],
  2: [
    "What personal information about you is already online?",
    "Who would you ask if you’re unsure about sharing something?",
  ],
  3: [
    "Are your current passwords strong and unique?",
    "What account will you secure first after this lesson?",
  ],
  4: [
    "Are your social media accounts public or private right now?",
    "Is there anyone in your friends list you don’t really know?",
  ],
};

const QUESTION_BANK = {
  1: [
      {
        topic: "Digital Footprint",
        question:
          "Alex posts a photo of their new school ID on social media because they’re excited. What is the biggest cybersecurity risk?",
        options: [
          "Friends may like the post too much",
          "Personal information can be used for identity theft",
          "The photo quality is poor",
          "The post will disappear after 24 hours",
        ],
        correctIndex: 1,
        explanation:
          "The school ID shows personal details like name, school, and possibly ID number. Attackers can use this information for identity theft or social engineering.",
      },
      {
        topic: "Digital Footprint",
        question:
          "Sam downloads a free game app that asks for access to location, contacts, and microphone—even though the game doesn’t need them. What type of digital footprint is being created?",
        options: [
          "Active only",
          "Passive only",
          "Both active and passive",
          "No digital footprint",
        ],
        correctIndex: 2,
        explanation:
          "Installing the app is an active choice, and the extra data collected in the background creates a passive footprint. So it’s both active and passive.",
      },
      {
        topic: "Digital Footprint",
        question:
          "Taylor receives an email that says: “Hi Taylor, we noticed unusual activity on your account. Click here to confirm your birthday.” Why is this dangerous?",
        options: [
          "The email might be spam",
          "Sharing personal details can help attackers steal accounts",
          "Birthdays are not important",
          "Emails can’t be trusted at all",
        ],
        correctIndex: 1,
        explanation:
          "Attackers often ask for personal details like birthdays to reset passwords or break into accounts. This kind of email is a common phishing trick.",
      },
      {
        topic: "Digital Footprint",
        question:
          "Jordan sets their social media account to “Public” so more people can follow them. What is the cybersecurity impact?",
        options: [
          "Nothing changes",
          "Only friends can see posts",
          "More personal information is exposed to strangers",
          "The account becomes more secure",
        ],
        correctIndex: 2,
        explanation:
          "A public profile means more strangers can see your posts, photos, and bio. This exposes more of your digital footprint to people you don’t know.",
      },
      {
        topic: "Digital Footprint",
        question:
          "Chris deletes an old post that shared their home city and sports team. Which statement is most accurate?",
        options: [
          "The information is completely gone forever",
          "Deleted posts can still exist in screenshots or backups",
          "Hackers can’t see deleted content",
          "Only friends can access deleted posts",
        ],
        correctIndex: 1,
        explanation:
          "Even if you delete a post, it may still be saved in backups, screenshots, or archives. That’s why thinking before posting is so important.",
      },
      {
        topic: "Digital Footprint",
        question:
          "Jamie wants to reduce their digital footprint. Which action is the BEST choice?",
        options: [
          "Share less personal information online",
          "Accept all website cookies",
          "Use the same password everywhere",
          "Turn off privacy settings",
        ],
        correctIndex: 0,
        explanation:
          "Sharing less personal information online directly reduces your digital footprint. The other options actually increase your risk.",
      },
    ],
    2: [
      {
        topic: "Personal Information",
        question:
          "Maria posts a photo of her new sports jersey. The photo also shows her full name and school logo. What is the cybersecurity risk?",
        options: [
          "Her friends may copy her style",
          "Attackers can use the information to identify and target her",
          "The post will get fewer likes",
          "Nothing—this information is harmless",
        ],
        correctIndex: 1,
        explanation:
          "Her full name plus school logo can help attackers identify where she studies and who she is. That can be used for scams, social engineering, or tracking.",
      },
      {
        topic: "Personal Information",
        question:
          "A player in an online game asks Leo for his age and city so they can 'team up better.' What should Leo do?",
        options: [
          "Share the information to be polite",
          "Share only his age",
          "Refuse and keep personal information private",
          "Share fake information",
        ],
        correctIndex: 2,
        explanation:
          "Even simple details like age and city can be used to learn more about you. The safest choice is to keep that personal information private and not share it in game chats.",
      },
      {
        topic: "Personal Information",
        question:
          "Nina receives an email saying: 'We detected a problem with your account. Please reply with your password to fix it.' Why is this dangerous?",
        options: [
          "Emails are slow",
          "Real companies never ask for passwords",
          "The message has bad grammar",
          "Passwords are easy to remember",
        ],
        correctIndex: 1,
        explanation:
          "Legitimate companies will never ask you to send your password by email or message. This is a common trick to steal login details.",
      },
      {
        topic: "Personal Information",
        question:
          "A free flashlight app asks for access to contacts, photos, and location. What is the BEST action?",
        options: [
          "Allow all permissions",
          "Install it anyway—it’s free",
          "Deny unnecessary permissions or uninstall the app",
          "Share fewer photos",
        ],
        correctIndex: 2,
        explanation:
          "A simple flashlight app doesn’t need access to your contacts, photos, or location. Denying extra permissions or uninstalling protects your personal data.",
      },
      {
        topic: "Personal Information",
        question:
          "Ethan logs into his bank account using free public Wi-Fi at a café. What personal information is at risk?",
        options: [
          "His favorite food",
          "His device battery life",
          "Login credentials and financial information",
          "His username only",
        ],
        correctIndex: 2,
        explanation:
          "Using public Wi-Fi for banking can expose login details and financial information if the connection is not secure. That’s very risky for personal data.",
      },
      {
        topic: "Personal Information",
        question:
          "Bonus: True or False — Sharing personal information is safe as long as you trust the person asking.",
        options: ["True", "False", "Only with friends", "Only at school"],
        correctIndex: 1,
        explanation:
          "Even if you trust the person now, messages can be hacked, forwarded, or seen by others. Important personal and sensitive details should stay private.",
      },
    ],
    3: [
      {
        topic: "Passwords & Passphrases",
        question:
          "Liam uses the password 'gamer123' for his email, game accounts, and school portal. What is the main cybersecurity risk?",
        options: [
          "He will forget his password",
          "If one account is hacked, attackers can access all of them",
          "His friends will guess it and log in for fun",
          "The password is too long",
        ],
        correctIndex: 1,
        explanation:
          "Reusing the same password on many accounts means if one site is hacked or leaked, attackers can try that same password everywhere else.",
      },
      {
        topic: "Passwords & Passphrases",
        question:
          "Which of these is the strongest password or passphrase?",
        options: [
          "dragon123",
          "myname2008",
          "T!ger-Lemon_Sky-42",
          "abcdef",
        ],
        correctIndex: 2,
        explanation:
          "A strong passphrase is long and mixes words, numbers, and symbols. 'T!ger-Lemon_Sky-42' is much harder to guess or crack than the other options.",
      },
      {
        topic: "Passwords & Passphrases",
        question:
          "A message pops up saying: 'Your account will be deleted in 10 minutes! Click here and enter your password to keep it.' What is the safest response?",
        options: [
          "Click quickly and type your password before time runs out",
          "Ignore it and go to the official website or app to check",
          "Share the link with friends to warn them",
          "Reply to the message with your password",
        ],
        correctIndex: 1,
        explanation:
          "Messages that rush or scare you are often phishing. You should ignore the link and check using the official app or website instead.",
      },
      {
        topic: "Passwords & Passphrases",
        question:
          "Noah’s friend asks for his password so they can 'help play' a game on his account. What should Noah do?",
        options: [
          "Share it only with close friends",
          "Change it after sharing",
          "Refuse and keep his password private",
          "Write it on paper and give it back later",
        ],
        correctIndex: 2,
        explanation:
          "Passwords should never be shared, even with friends. Once someone else knows it, you lose control of your account and data.",
      },
      {
        topic: "Passwords & Passphrases",
        question:
          "A website sends Mia a one-time code (OTP) to log in. Then someone messages her pretending to be 'support' and asks for the code. What should she do?",
        options: [
          "Give them the code so they can fix her account",
          "Ask a friend if it’s okay to share the code",
          "Ignore the message and never share her one-time code",
          "Change her username instead",
        ],
        correctIndex: 2,
        explanation:
          "One-time codes are like temporary keys. Real support will never ask for them. Sharing the code lets attackers log in as if they were you.",
      },
    ],
    4: [
      {
        topic: "Social Media & Privacy",
        question:
          "Ava sets her social media account to public so anyone can see her posts and stories. What is the main cybersecurity risk?",
        options: [
          "Only her friends can see her posts",
          "More strangers can see her photos and personal information",
          "Her account will load slower",
          "Her battery will drain faster",
        ],
        correctIndex: 1,
        explanation:
          "A public profile allows strangers to see posts, photos, bio, and sometimes even comments or friends. That can expose a lot of personal information.",
      },
      {
        topic: "Social Media & Privacy",
        question:
          "Ben gets a friend request from someone he doesn’t know with no mutual friends. Their profile looks cool. What is the safest choice?",
        options: [
          "Accept to be friendly",
          "Message them and share personal details",
          "Ignore or decline the request",
          "Send them his phone number to chat",
        ],
        correctIndex: 2,
        explanation:
          "If you don’t know the person and have no mutual friends, it’s safest to ignore or decline the request. Strangers online may not be who they say they are.",
      },
      {
        topic: "Social Media & Privacy",
        question:
          "Chloe posts a live video showing the front of her house and street name while she is home alone. What is the risk?",
        options: [
          "Viewers will get bored",
          "People might copy her video style",
          "Strangers could learn where she lives and when she is alone",
          "Her friends will know her internet speed",
        ],
        correctIndex: 2,
        explanation:
          "Sharing your exact location or home details publicly can help strangers figure out where you live and your routine, which is a serious safety risk.",
      },
      {
        topic: "Social Media & Privacy",
        question:
          "A stranger sends a direct message saying: 'You won a prize! Send a screenshot of your ID or school card to claim it.' What should you do?",
        options: [
          "Send the ID so you don’t lose the prize",
          "Ask them if the prize is real",
          "Block or report the account and do not send anything",
          "Send a photo with some parts covered",
        ],
        correctIndex: 2,
        explanation:
          "No legitimate prize will ask for ID or school cards in a DM. This is a trick to collect personal information. Blocking or reporting is the safest action.",
      },
      {
        topic: "Social Media & Privacy",
        question:
          "Diego tags his friends and shares their full names and school name in every public post. Why can this be dangerous?",
        options: [
          "His friends will get more followers",
          "The posts will be harder to delete",
          "It makes it easier for strangers to find and contact them",
          "It uses more mobile data",
        ],
        correctIndex: 2,
        explanation:
          "Tagging friends with full names and school publicly gives strangers more information to look them up, message them, or try to scam them.",
      },
      {
        topic: "Social Media & Privacy",
        question:
          "Bonus: True or False — It’s always safe to share anything if your account is set to private.",
        options: ["True", "False", "Only with family", "Only if posts disappear"],
        correctIndex: 1, // False
        explanation:
          "Even on private accounts, screenshots and forwards can share your posts beyond your followers. Privacy settings help, but smart choices still matter.",
      },
    ],
};

// Short “comic-style” lesson intro
const LESSON_INTRO = {
  1: {
    title: "My Digital Footprint",
    text: [
      "Everything you do online leaves tiny footprints behind—just like walking on the beach! These footprints show where you’ve been, what you’ve liked, and what you’ve shared.",
      "Every photo you post on Instagram, comment you make on TikTok, or message you send in a game chat becomes part of your online record. Even if you delete something, it might still be saved, shared, or screenshotted by others.",
      "Whether you’re sharing a meme, posting a selfie, or chatting with friends in a game, remember: your online footprints can travel far and last a long time. So make sure they lead to something positive, kind, and something you’ll be proud of!",
    ],
    quickTip: "Think before posting online and ask a guardian if you’re unsure.",
  },
  2: {
    title: "Personal Information = Treasure",
    text: [
      "Your personal information is like the treasure inside your own chest — special and valuable!",
      "Things like your name, birthday, address, school, and passwords are pieces of that treasure.",
      "You are the guardian of your treasure, and sneaky pirates (strangers online) might try to steal it. Never share your treasure with someone you don’t know, and only show it to people you trust, like a parent, guardian, or teacher.",
    ],
    quickTip: "Keep your personal info safe — ask your parent/guardian before sharing anything online.",
  },
  3: {
    title: "Passwords & Passphrases",
    text: [
      "Think of your online accounts like a magical castle — full of important things that only you should see.",
      "Passwords are the strong doors and secret codes that keep your castle safe. A weak password is like a door that swings open easily, letting sneaky intruders in.",
      "We’ll build strong passphrases that are hard to guess but easy to remember.",
    ],
    quickTip: "Use strong passwords and never share them — let your parent/guardian help you manage them.",
  },
  4: {
    title: "Social Media & Privacy",
    text: [
      "All your pictures, messages, and game scores are your toys. You get to choose who can play with your toys and who can’t.",
      "Privacy settings are like the lid on your toy box — they keep strangers from grabbing your toys.",
      "Only let people you trust, like family or friends, see your stuff.",
    ],
    quickTip: "Check your privacy settings with a guardian and only connect with people you know.",
  },
};

const STORY_LESSON = {
  1: {

    intro: [
      "Everything you do online leaves tiny footprints behind.",
      "Posts, likes, searches, and messages all become part of your online record.",
      "Your digital footprint can last a long time — even forever."
    ],

    objectives: [
      "Define what a digital footprint is",
      "Differentiate between active and passive digital footprints",
      "Identify cybersecurity risks related to digital footprints",
      "Apply best practices to protect your digital presence"
    ],

    concepts: [
      {
        title: "What Is a Digital Footprint?",
        points: [
          "Social media posts and comments",
          "Online searches",
          "App usage",
          "Photos, videos, and likes",
          "Location data",
          "Website cookies and trackers"
        ],
        note: "Even deleted content may still exist in screenshots or backups."
      },
      {
        title: "Types of Digital Footprints",
        points: [
          "🟢 Active: posts, comments, messages, accounts",
          "🔵 Passive: browsing history, cookies, IP address, location"
        ]
      },
      {
        title: "Why Digital Footprints Matter",
        points: [
          "Identity theft",
          "Account takeovers",
          "Phishing attacks",
          "Reputation damage",
          "Targeted scams"
        ]
      }
    ],

    example: {
      title: "Real-Life Example (OSINT)",
      text:
        "A cybercriminal finds your birthday and school online and uses this information to guess passwords or create phishing emails."
    },

    bestPractices: [
      "Think before you post",
      "Use strong, unique passwords",
      "Enable multi-factor authentication (MFA)",
      "Review privacy settings regularly",
      "Limit location sharing",
      "Avoid oversharing personal details",
      "Be cautious with quizzes and fun apps"
    ],

    takeaways: [
      "Your digital footprint is permanent and powerful",
      "Cybersecurity starts with personal responsibility",
      "Small actions online can have big consequences",
      "You control your footprint if you’re aware of it"
    ]
  },
  2: {
    title: "Personal Info & Privacy",

    intro: [
      "Your personal information is like the treasure inside your own chest — special and valuable!",
      "Things like your name, birthday, address, school, and passwords are pieces of that treasure.",
      "You are the guardian of your treasure, and sneaky pirates (strangers online) might try to steal it.",
      "Never share your treasure with someone you don’t know, and only show it to people you trust, like a parent, guardian, or teacher."
    ],

    objectives: [
      "Define personal information and why it is valuable",
      "Identify different types of personal information",
      "Recognize how attackers exploit personal information",
      "Apply best practices to protect personal data online"
    ],

    concepts: [
      {
        title: "What Is Personal Information?",
        points: [
          "Steal identities",
          "Access accounts",
          "Create convincing scams",
          "Track or impersonate individuals"
        ],
        note: "Sensitive information should NEVER be shared publicly."
      },
      {
        title: "Types of Personal Information",
        points: [
          "🟢 Basic Personal Information: Full name, Date of birth, Email address, Phone number, Home address, School or workplace",
          "🔵 Sensitive Personal Information: Passwords, Social Insurance / Social Security numbers, Government ID numbers, Medical information"
        ]
      },
      {
        title: "Why Personal Information Is Valuable to Cybercriminals",
        points: [
          "Phishing and social engineering",
          "Identity theft",
          "Account takeover",
          "Fraud and scams",
          "Password guessing"
        ]
      }
    ],

    example: {
      title: "Real-World Scenario",
      text:
        "A scammer: Learns your name and school from social media, Sends a fake “school account” email, Asks you to reset your password"
    },

    bestPractices: [
      "Share the minimum information needed",
      "Use strong, unique passwords",
      "Enable multi-factor authentication (MFA)",
      "Double-check links and senders",
      "Keep accounts private when possible",
      "Review app permissions",
      "Never share passwords—even with friends",
      "Ask an adult or IT support if unsure"
    ],

    takeaways: [
      "Personal information is valuable and powerful",
      "Once shared, control is difficult to regain",
      "Cybersecurity starts with smart choices",
      "When in doubt: don’t share"
    ]
  },

  3: {
    title: "Passwords & Passphrases",

    intro: [
      "Your personal information is like the treasure inside your own chest — special and valuable!",
      "Things like your name, birthday, address, school, and passwords are pieces of that treasure.",
      "You are the guardian of your treasure, and sneaky pirates (strangers online) might try to steal it.",
      "Never share your treasure with someone you don’t know, and only show it to people you trust, like a parent, guardian, or teacher."
    ],

    objectives: [
      "Explain what passwords and passphrases are",
      "Identify the difference between a weak password and a strong passphrase",
      "Understand common password-related attacks",
      "Apply best practices for creating and protecting passwords"
    ],

    concepts: [
      {
        title: "What is a Password?",
        points: [
          "Numbers",
          "Letters",
          "Symbols"
        ],
        note: "Short or simple passwords are easy to guess or crack."
      },
      {
        title: "What Is a Passphrase?",
        points: [
          "A passphrase is a longer password made of multiple words that is easier to remember andmuch harder to break.",
        ]
      },
      {
        title: "Common Password Attacks",
        points: [
          "Brute-force attacks – trying many combinations",
          "Dictionary attacks – using common words",
          "Phishing – tricking users into revealing passwords",
          "Credential stuffing – using leaked passwords on other sites"
        ]
      },
      {
        title: "Why Passwords Matter in Cybersecurity",
        points: [
          "Protects Email accounts",
          "Social media",
          "Online games",
          "School or work systems",
          "Banking and shopping accounts"
        ],
      }
    ],

    example: {
      title: "Real-World Scenario",
      text:
        "An attacker gets a leaked password from one website and tries it on: Email, Social Media, Gaming accounts"
    },

    bestPractices: [
      "At least 12–16 characters",
      "Mix of upper/lowercase letters",
      "Numbers and symbols",
      "No personal information",
      "Unique for each account"
    ],

    takeaways: [
      "Passwords are your first defense",
      "Longer passphrases are stronger and safer",
      "Never reuse passwords",
      "MFA adds powerful protection"
    ]
  },

  4: {
    title: "Social Media and Privacy Settings",

    intro: [
      "Think of your online accounts — like your social media, games, or chat apps — as a toy box. All your pictures, messages, and game scores are your toys. You get to choose who can play.",
      "Privacy settings are like the lid on your toy box — they keep strangers from grabbing your toys.",
      "Only let people you trust, like family or friends, see your stuff.",
      "And remember, even if you show one toy to a friend, sometimes others might see it too, so always be careful what you share online!"
    ],

    objectives: [
      "Explain how social media affects cybersecurity and privacy",
      "Identify common risks of public social media profiles",
      "Understand what privacy settings do and why they matter",
      "Apply best practices to secure social media accounts"
    ],

    concepts: [
      {
        title: "Why Social Media Matters in Cybersecurity",
        points: [
          "Gather personal information",
          "Create convincing phishing scams",
          "Guess passwords or security questions",
          "Impersonate users",
          "Track locations and routines"
        ],
        note: "What you share online can be seen by more people than you expect."
      },
      {
        title: "Common Social Media Risks",
        points: [
          "Public profiles",
          "Oversharing personal details",
          "Location tagging",
          "Accepting unknown friend/follower requests",
          "Fake accounts and impersonation",
          "Third-party apps connected to accounts"
        ],
      },
      {
        title: "Public vs. Private Accounts",
        points: [
          "🟢 Public Accounts: Anyone can see posts, Higher risk of data misuse, Content can be copied or shared",
          "🔵 Private Accounts: You control who sees your content, Lower exposure to strangers, Better protection for personal information"
        ]
      },
      {
        title: "What Are Privacy Settings?",
        points: [
          "Who can see posts and stories",
          "Who can comment or message",
          "Who can tag or mention you",
          "Whether your account appears in searches",
          "What data apps can access"
        ]
      }
    ],

    example: {
      title: "Real-World Scenario",
      text:
        "A scammer: Learns your name and school from social media, Sends a fake “school account” email, Asks you to reset your password"
    },

    bestPractices: [
      "Set profiles to private (when possible)",
      "Review privacy settings regularly",
      "Limit who can message or tag you",
      "Turn off location sharing",
      "Remove old or unused apps",
      "Enable multi-factor authentication (MFA)",
      "Accept requests only from people you know"
    ],

    takeaways: [
      "Social media is a major source of personal data",
      "Privacy settings reduce—but don’t eliminate—risk",
      "Public profiles increase exposure to attacks",
      "You control what you share and who sees it"
    ]
  },
};



const STORYLINES = {
  1: "Help Alex clean up their digital footprints before a cyber villain uses them for a fake profile.",
  2: "Guard your treasure chest of personal information from sneaky data pirates.",
  3: "Forge unbreakable passphrases to lock every digital door in your account castle.",
  4: "Patrol your social media city and keep out suspicious friend requests and lurkers.",
};

// 🔹 Mini-game memory pairs per topic
const MINIGAME_DATA = {
    1: [
      {
        id: "id-photo",
        front: "Post school ID photo",
        back: "Reveals full name & school → identity theft risk",
      },
      {
        id: "live-location",
        front: "Share live location in story",
        back: "Strangers can track where you are",
      },
      {
        id: "old-posts",
        front: "Delete an old embarrassing post",
        back: "Might still exist in screenshots or backups",
      },
    ],
    2: [
      {
        id: "bank-details",
        front: "Type bank details in chat",
        back: "Can be used for fraud and stealing money",
      },
      {
        id: "password-share",
        front: "Tell password to a friend",
        back: "Friend or others can access your accounts",
      },
      {
        id: "public-birthday",
        front: "Public birthday on profile",
        back: "Used for password guesses and security questions",
      },
    ],
    3: [
      {
        id: "weak-password",
        front: "Use password123",
        back: "Easy for attackers to guess in seconds",
      },
      {
        id: "reuse-password",
        front: "Same password on all sites",
        back: "One leak opens ALL your accounts",
      },
      {
        id: "strong-passphrase",
        front: "Use T1ger!Rainbow!Tree",
        back: "Long, unique passphrase → much safer",
      },
    ],
    4: [
      {
        id: "public-profile",
        front: "Profile set to public",
        back: "Anyone (even strangers) can see your posts",
      },
      {
        id: "unknown-request",
        front: "Accept random friend request",
        back: "Lets strangers see your info & message you",
      },
      {
        id: "privacy-check",
        front: "Review privacy settings",
        back: "You control who can see and contact you",
      },
    ],
  };
  

// 🔹 Gamified LESSON CARDS per topic (game-type presentation of the lesson)
const LESSON_FLOW = {
  1: [
    {
      title: "Your Invisible Footprints",
      prompt:
        "Which action creates a digital footprint that might still exist even after you delete it?",
      choices: [
        {
          label: "Posting a selfie with your school logo online",
          correct: true,
          explanation:
            "Photos posted online can be saved, screenshotted, or shared by others, even if you delete the original.",
        },
        {
          label: "Talking to a friend at school in person",
          correct: false,
          explanation:
            "Face-to-face chats are not part of your *digital* footprint.",
        },
        {
          label: "Writing your thoughts in a paper notebook",
          correct: false,
          explanation:
            "Paper notes aren’t automatically uploaded to the internet.",
        },
      ],
    },
    {
      title: "Active vs Passive",
      prompt:
        "Which example shows a *passive* digital footprint (data collected automatically)?",
      choices: [
        {
          label: "Typing a comment on your friend’s video",
          correct: false,
          explanation:
            "Typing and posting is an intentional action—an active digital footprint.",
        },
        {
          label: "An app tracking your location while you play",
          correct: true,
          explanation:
            "Location tracking happens in the background. That’s a passive digital footprint.",
        },
        {
          label: "Posting a poll on your story",
          correct: false,
          explanation:
            "Choosing to post is also active—it’s something you do on purpose.",
        },
      ],
    },
    {
      title: "Why Footprints Matter",
      prompt:
        "Why do hackers and scammers care so much about your digital footprint?",
      choices: [
        {
          label: "They want to help you clean up old posts",
          correct: false,
          explanation:
            "Attackers aren’t online to help you—they want information they can exploit.",
        },
        {
          label:
            "They can use your info for identity theft or targeted scams",
          correct: true,
          explanation:
            "Details like birthday, school, and interests can be used for social engineering and phishing.",
        },
        {
          label: "They are bored and just scroll for fun",
          correct: false,
          explanation:
            "Real attackers are looking for valuable data, not just entertainment.",
        },
      ],
    },
    {
      title: "Cyber Sleuths",
      prompt:
        "A cybercriminal finds your birthday and school on social media. What could they do with that?",
      choices: [
        {
          label:
            "Guess your passwords or send fake emails that sound very real",
          correct: true,
          explanation:
            "This is OSINT: they combine small pieces of data to craft believable attacks.",
        },
        {
          label: "Make harmless memes about your school mascot",
          correct: false,
          explanation:
            "They’re more likely to use the information for attacks than jokes.",
        },
        {
          label: "Automatically improve your account’s security",
          correct: false,
          explanation:
            "Attackers do not protect your accounts—they try to break into them.",
        },
      ],
    },
    {
      title: "Manage Your Footprint",
      prompt: "Which habit BEST helps protect your digital footprint?",
      choices: [
        {
          label: "Posting your location in real time to show where you are",
          correct: false,
          explanation:
            "Live location can reveal where you are right now, which can be dangerous.",
        },
        {
          label: "Thinking before you post and limiting what you share",
          correct: true,
          explanation:
            "Pausing to think and sharing less personal info keeps your trail safer.",
        },
        {
          label: "Using the same password on all your accounts",
          correct: false,
          explanation:
            "Reusing passwords makes it easier for attackers if one site is hacked.",
        },
      ],
    },
    {
      title: "Key Takeaway",
      prompt: "Which statement about digital footprints is the MOST accurate?",
      choices: [
        {
          label: "Everything you delete online is gone forever",
          correct: false,
          explanation:
            "Deleted posts can still exist in backups, screenshots, or other people’s devices.",
        },
        {
          label: "Small actions online can have big consequences later",
          correct: true,
          explanation:
            "Even a single post can affect your privacy, reputation, or security.",
        },
        {
          label: "Only adults need to worry about digital footprints",
          correct: false,
          explanation:
            "Everyone who uses the internet has a footprint—kids and teens too.",
        },
      ],
    },
  ],

  2: [
    {
      title: "Treasure Chest Data",
      prompt:
        "Which of these is considered personal information that can identify you?",
      choices: [
        {
          label: "Your favorite movie genre",
          correct: false,
          explanation:
            "Likes and interests are less sensitive by themselves (but can still add up).",
        },
        {
          label: "Your full name and exact home address",
          correct: true,
          explanation:
            "Those directly identify who and where you are—very sensitive.",
        },
        {
          label: "Your favorite color and pet’s nickname only",
          correct: false,
          explanation:
            "On their own these are less risky, but can still be clues for password guesses.",
        },
      ],
    },
    {
      title: "Basic vs Sensitive",
      prompt:
        "Which piece of information is MOST sensitive and should NEVER be shared in chat?",
      choices: [
        {
          label: "Your school name and grade level",
          correct: false,
          explanation:
            "That’s important, but there is something even more sensitive here.",
        },
        {
          label: "Your government ID or banking details",
          correct: true,
          explanation:
            "These can be used for serious fraud and identity theft—never share them.",
        },
        {
          label: "Your favorite sports team",
          correct: false,
          explanation:
            "That’s more like a fun preference, not sensitive data.",
        },
      ],
    },
    {
      title: "Why Hackers Want Your Info",
      prompt:
        "How can attackers use small pieces of your personal information?",
      choices: [
        {
          label: "To send you thank-you messages for being online",
          correct: false,
          explanation:
            "Attackers aren’t thankful—they’re trying to abuse your data.",
        },
        {
          label:
            "To combine them into a profile for scams, identity theft, or account takeover",
          correct: true,
          explanation:
            "Even small details can be stitched together for powerful social engineering.",
        },
        {
          label: "To help you remember your passwords",
          correct: false,
          explanation:
            "They want to *steal* your passwords, not help you manage them.",
        },
      ],
    },
    {
      title: "Leaky Habits",
      prompt:
        "Which situation is MOST likely to expose your personal information?",
      choices: [
        {
          label: "Using strong, unique passwords on each website",
          correct: false,
          explanation:
            "That habit actually protects you instead of exposing you.",
        },
        {
          label: "Oversharing on social media and public profiles",
          correct: true,
          explanation:
            "Posting too many details publicly gives attackers more to work with.",
        },
        {
          label: "Asking a parent to check a suspicious link",
          correct: false,
          explanation:
            "That’s a safe move, not a risky one.",
        },
      ],
    },
    {
      title: "Smart Cyber Habits",
      prompt:
        "Which action is the BEST example of protecting your personal information?",
      choices: [
        {
          label: "Sharing your one-time code with a friend you trust",
          correct: false,
          explanation:
            "Codes and passwords should never be shared, even with friends.",
        },
        {
          label:
            "Using strong passwords and enabling multi-factor authentication (MFA)",
          correct: true,
          explanation:
            "MFA and strong passwords make it much harder for attackers to get in.",
        },
        {
          label: "Clicking every quiz and survey on social media",
          correct: false,
          explanation:
            "Many quizzes collect data or can be used for social engineering.",
        },
      ],
    },
    {
      title: "When in Doubt…",
      prompt:
        "Someone online asks for your birthday and exact location. You’re not sure if it’s okay. What’s the BEST move?",
      choices: [
        {
          label: "Share it quickly so they don’t get upset",
          correct: false,
          explanation:
            "Your safety is more important than anyone’s feelings online.",
        },
        {
          label: "Don’t share and ask a parent/guardian or teacher first",
          correct: true,
          explanation:
            "If you’re unsure, pause and ask a trusted adult. You control your data.",
        },
        {
          label: "Give them slightly wrong information to trick them",
          correct: false,
          explanation:
            "It’s better to avoid the conversation or block/report than play along.",
        },
      ],
    },
  ],

  3: [
    {
      title: "Build the Strongest Lock",
      prompt: "Which password is the strongest and hardest to guess?",
      choices: [
        {
          label: "password123",
          correct: false,
          explanation:
            "Very common and easy to guess—attackers try this first.",
        },
        {
          label: "T1ger!Rainbow!Tree",
          correct: true,
          explanation:
            "Long, unusual passphrases with numbers and symbols are much harder to crack.",
        },
        {
          label: "myname2024",
          correct: false,
          explanation:
            "Using your name and a simple year makes it easier to guess.",
        },
      ],
    },
    {
      title: "One Key for Every Door?",
      prompt:
        "What happens if you reuse the same password on many different websites?",
      choices: [
        {
          label: "It’s safer because it’s easy to remember",
          correct: false,
          explanation:
            "Easy to remember also means easy for attackers to reuse everywhere.",
        },
        {
          label:
            "If one site is hacked, attackers can get into all your other accounts",
          correct: true,
          explanation:
            "This is called a credential stuffing attack. One leak can unlock many accounts if you reuse passwords.",
        },
        {
          label: "Websites will block you for using the same password",
          correct: false,
          explanation:
            "Some warn you, but the real danger is attackers, not the site.",
        },
      ],
    },
    {
      title: "Rushed Messages",
      prompt:
        "A message says: 'Click this link in the next 2 minutes or your account will be deleted!' What should you do?",
      choices: [
        {
          label: "Click quickly so you don’t lose anything",
          correct: false,
          explanation:
            "That’s exactly what scammers want—fast clicks without thinking.",
        },
        {
          label: "Ignore it and log in through the official app or website",
          correct: true,
          explanation:
            "Go directly to the real app/website to check. Don’t trust the scary link.",
        },
        {
          label: "Send the link to your friends to warn them",
          correct: false,
          explanation:
            "Sharing the link spreads the scam. Report or delete it instead.",
        },
      ],
    },
  ],

  4: [
    {
      title: "Public or Private?",
      prompt:
        "What is a risk of changing your social media profile from private to public?",
      choices: [
        {
          label: "Only your close friends can see your posts",
          correct: false,
          explanation:
            "That’s what private mode does. Public mode does the opposite.",
        },
        {
          label: "More strangers can see your photos and personal details",
          correct: true,
          explanation:
            "Public profiles can be viewed by anyone, including people you don’t know.",
        },
        {
          label: "Your account becomes more secure",
          correct: false,
          explanation:
            "Public mode usually exposes more information, not less.",
        },
      ],
    },
    {
      title: "Friend or Fake?",
      prompt:
        "Someone you don’t know sends a friend request with no mutual friends. What’s the safest action?",
      choices: [
        {
          label: "Accept so you have more followers",
          correct: false,
          explanation:
            "Follower count isn’t worth the risk of letting strangers see your life.",
        },
        {
          label: "Ignore or decline the request",
          correct: true,
          explanation:
            "If you don’t know them, you don’t need to let them into your online space.",
        },
        {
          label: "Send them your phone number to check who they are",
          correct: false,
          explanation:
            "Sharing your number gives them even more ways to contact or scam you.",
        },
      ],
    },
    {
      title: "Tune Your Settings",
      prompt: "Which action helps you stay safer on social media?",
      choices: [
        {
          label: "Letting anyone tag you in posts",
          correct: false,
          explanation:
            "Tags can expose you to strangers and unwanted posts.",
        },
        {
          label: "Reviewing privacy settings with a trusted adult",
          correct: true,
          explanation:
            "Checking who can see, tag, or message you is a powerful safety step.",
        },
        {
          label: "Posting your location in real time",
          correct: false,
          explanation:
            "Live location can reveal where you are right now, which can be risky.",
        },
      ],
    },
  ],
};

const RANK_TIERS = [
  { threshold: 0, label: "Trainee" },
  { threshold: 20, label: "Rookie" },
  { threshold: 40, label: "Cyber Scout" },
  { threshold: 60, label: "Defender" },
  { threshold: 80, label: "Guardian" },
];




function DigitalFootprintMiniGame() {
    const pairs = [
      {
        id: "id-photo",
        front: "Post school ID photo",
        back: "Shows full name & school → identity theft risk",
      },
      {
        id: "live-loc",
        front: "Share live location in story",
        back: "Strangers can track where you are in real time",
      },
      {
        id: "delete-post",
        front: "Delete old oversharing post",
        back: "Might still exist in screenshots or backups",
      },
    ];
  
    const buildDeck = () =>
      [...pairs]
        .flatMap((p) => [
          { uid: p.id + "-a", pairId: p.id, label: p.front },
          { uid: p.id + "-b", pairId: p.id, label: p.back },
        ])
        .sort(() => Math.random() - 0.5);
  
    const [cards, setCards] = useState(buildDeck);
    const [flipped, setFlipped] = useState([]); // indices
    const [matched, setMatched] = useState([]); // pairIds
    const [moves, setMoves] = useState(0);
    const [done, setDone] = useState(false);
  
    const handleFlip = (index) => {
      if (done) return;
      if (flipped.includes(index)) return;
  
      const card = cards[index];
      if (!card || matched.includes(card.pairId)) return;
  
      if (flipped.length === 0) {
        setFlipped([index]);
        return;
      }
  
      if (flipped.length === 1) {
        const firstIndex = flipped[0];
        const firstCard = cards[firstIndex];
        const secondCard = cards[index];
        setFlipped([firstIndex, index]);
        setMoves((m) => m + 1);
  
        setTimeout(() => {
          if (!firstCard || !secondCard) return;
  
          if (firstCard.pairId === secondCard.pairId) {
            setMatched((prev) => {
              const updated = [...prev, firstCard.pairId];
              if (updated.length === pairs.length) setDone(true);
              return updated;
            });
            setFlipped([]);
          } else {
            setFlipped([]);
          }
        }, 650);
      }
    };
  
    const restart = () => {
      setCards(buildDeck());
      setFlipped([]);
      setMatched([]);
      setMoves(0);
      setDone(false);
    };
  
    return (
      <div className="mini-game-wrapper">
        <h2 className="mini-title">🧠 Digital Footprint Memory Lab</h2>
        <p className="mini-desc">
          Match each <strong>online action</strong> with its{" "}
          <strong>cybersecurity effect</strong>. This shows how small posts can
          create a big digital footprint.
        </p>
  
        <div className="mini-game-hud">
          <div>
            Pairs matched: <strong>{matched.length}</strong> / {pairs.length}
          </div>
          <div>
            Moves: <strong>{moves}</strong>
          </div>
          <button className="mini-restart-btn" type="button" onClick={restart}>
            🔁 Shuffle cards
          </button>
        </div>
  
        <div className="mini-game-grid">
          {cards.map((c, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(c.pairId);
  
            return (
              <button
                key={c.uid}
                type="button"
                className={`mini-card ${isFlipped ? "flipped" : ""} ${
                  matched.includes(c.pairId) ? "matched" : ""
                }`}
                onClick={() => handleFlip(idx)}
              >
                <div className="mini-card-inner">
                  <div className="mini-card-front">?</div>
                  <div className="mini-card-back">{c.label}</div>
                </div>
              </button>
            );
          })}
        </div>
  
        {done && (
          <div className="mini-complete-banner">
            🎉 Nice! You connected actions and consequences. Your digital footprint
            makes a story—make sure it’s a safe one.
          </div>
        )}
      </div>
    );
  }

  function PersonalInfoMiniGame() {
    const SCENES = [
      {
        id: 1,
        text: "A stranger in a game chat asks for your full name and school so you can 'join their secret team.'",
        safeAnswer: "shield",
        hint: "Strangers online should never know your real identity or school.",
      },
      {
        id: 2,
        text: "Your teacher, during online class, asks for your school email to send the quiz link.",
        safeAnswer: "share",
        hint: "Trusted adults from school may need limited info for class.",
      },
      {
        id: 3,
        text: "A pop-up website says: 'Win a free phone! Just enter your birthday and home address.'",
        safeAnswer: "shield",
        hint: "If it sounds too good to be true, it probably is.",
      },
      {
        id: 4,
        text: "An official banking app you installed asks for a one-time code you requested.",
        safeAnswer: "share",
        hint: "One-time codes are okay if YOU started the login or transaction.",
      },
      {
        id: 5,
        text: "A new online friend wants your exact location so they can 'visit someday.'",
        safeAnswer: "shield",
        hint: "Never share your real-time location with people you don’t know offline.",
      },
    ];
  
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [hearts, setHearts] = useState(3);
    const [feedback, setFeedback] = useState(null); // {type, text}
    const [finished, setFinished] = useState(false);
  
    const current = SCENES[index];
  
    const handleChoice = (choice) => {
      if (!current || finished) return;
  
      const correct = choice === current.safeAnswer;
  
      if (correct) {
        setScore((s) => s + 150);
        setFeedback({
          type: "correct",
          text: "Nice! You kept your treasure safe. 🛡️",
        });
      } else {
        setHearts((h) => Math.max(0, h - 1));
        setFeedback({
          type: "wrong",
          text: "Careful! That move could expose your personal info. ⚠️",
        });
      }
  
      setTimeout(() => {
        setFeedback(null);
  
        // end if last scene or no hearts left
        if (index === SCENES.length - 1 || (choice !== current.safeAnswer && hearts - 1 <= 0)) {
          setFinished(true);
        } else {
          setIndex((i) => i + 1);
        }
      }, 900);
    };
  
    const restart = () => {
      setIndex(0);
      setScore(0);
      setHearts(3);
      setFeedback(null);
      setFinished(false);
    };
  
    const progressPercent = Math.round(((index + (finished ? 1 : 0)) / SCENES.length) * 100);
  
    return (
      <div className="mini-game-wrapper info-guardian">
        <div className="mini-header-row">
          <h2 className="mini-title">🪙 Info Guardian: Share or Shield?</h2>
          <button className="mini-restart-link" type="button" onClick={restart}>
            🔁 Restart
          </button>
        </div>
  
        <p className="mini-desc">
          Decide if you should <strong>SHARE</strong> a small detail or completely{" "}
          <strong>SHIELD</strong> it. Protect your treasure chest of personal data!
        </p>
  
        <div className="info-hud">
          <div className="info-score">
            Score: <span>{score}</span>
          </div>
          <div className="info-hearts">
            {"❤️".repeat(hearts)}
            {"🖤".repeat(3 - hearts)}
          </div>
          <div className="info-progress-bar">
            <div
              className="info-progress-fill"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
  
        {!finished && current && (
          <div className="info-card">
            <div className="info-tag-row">
              <span className="info-tag">Scenario {index + 1}</span>
            </div>
            <p className="info-question">{current.text}</p>
  
            <div className="info-actions">
              <button
                type="button"
                className="info-btn shield"
                onClick={() => handleChoice("shield")}
              >
                🛡 Shield it
                <span className="info-btn-sub">Keep this private</span>
              </button>
              <button
                type="button"
                className="info-btn share"
                onClick={() => handleChoice("share")}
              >
                📤 Safe share
                <span className="info-btn-sub">Okay in this context</span>
              </button>
            </div>
  
            <p className="info-hint">💡 Hint: {current.hint}</p>
  
            {feedback && (
              <div
                className={`info-feedback ${
                  feedback.type === "correct" ? "info-feedback-correct" : "info-feedback-wrong"
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>
        )}
  
        {finished && (
          <div className="mini-complete-banner info-complete">
            <h3>Game Over! 🧠</h3>
            <p>
              Final score: <strong>{score}</strong>
            </p>
            <p>
              Remember: if you’re not sure, <strong>shield it</strong> and ask a trusted adult
              first.
            </p>
          </div>
        )}
      </div>
    );
  }
  
  
  function PasswordsMiniGame() {
    const MISSIONS = [
      {
        id: 1,
        title: "Secure your game account",
        prompt: "Your friend uses 'gamer123'. Build something much stronger.",
      },
      {
        id: 2,
        title: "Protect your school portal",
        prompt: "Teachers warn about reused passwords. Make a unique passphrase.",
      },
      {
        id: 3,
        title: "Lock down your email",
        prompt: "This account controls everything. Make it ultra-strong.",
      },
    ];
  
    const words = ["Tiger", "Rainbow", "Galaxy", "Pineapple", "Robot", "Storm"];
    const numbers = ["2024", "99", "42", "07", "3000"];
    const symbols = ["!", "@", "#", "✨", "?"];
  
    const [missionIndex, setMissionIndex] = useState(0);
    const [selected, setSelected] = useState([]);
    const [locked, setLocked] = useState(false);
    const [missionComplete, setMissionComplete] = useState(false);
  
    const mission = MISSIONS[missionIndex];
    const password = selected.join("");
  
    const hasWord = words.some((w) => password.includes(w));
    const hasNumber = numbers.some((n) => password.includes(n));
    const hasSymbol = symbols.some((s) => password.includes(s));
    const longEnough = password.length >= 12;
  
    const criteria = [
      { label: "Uses at least one word", ok: hasWord },
      { label: "Contains numbers", ok: hasNumber },
      { label: "Includes symbols", ok: hasSymbol },
      { label: "12 or more characters", ok: longEnough },
    ];
  
    const strengthScore =
      (hasWord ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0) + (longEnough ? 1 : 0);
  
    const strengthLabel =
      strengthScore <= 1
        ? "Weak"
        : strengthScore === 2
        ? "Okay"
        : strengthScore === 3
        ? "Strong"
        : "Ultra-Strong";
  
    const toggleToken = (token) => {
      if (locked) return;
      setSelected((prev) =>
        prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]
      );
    };
  
    const lockMission = () => {
      if (strengthScore < 3) return;
      setLocked(true);
      setMissionComplete(true);
    };
  
    const nextMission = () => {
      if (missionIndex < MISSIONS.length - 1) {
        setMissionIndex((i) => i + 1);
        setSelected([]);
        setLocked(false);
        setMissionComplete(false);
      }
    };
  
    const resetAll = () => {
      setMissionIndex(0);
      setSelected([]);
      setLocked(false);
      setMissionComplete(false);
    };
  
    const allDone = missionIndex === MISSIONS.length - 1 && missionComplete;
  
    return (
      <div className="mini-game-wrapper pass-lab">
        <div className="mini-header-row">
          <h2 className="mini-title">🔐 Password Mission Lab</h2>
          <button className="mini-restart-link" type="button" onClick={resetAll}>
            🔁 Restart missions
          </button>
        </div>
  
        <div className="mission-header">
          <span className="mission-pill">
            Mission {missionIndex + 1} of {MISSIONS.length}
          </span>
          <h3 className="mission-title">{mission.title}</h3>
          <p className="mission-prompt">{mission.prompt}</p>
        </div>
  
        <div className="pass-lab-output">
          <div className="pass-label">Your passphrase:</div>
          <div className="pass-value">
            {password || <span className="placeholder">Click tiles to build it…</span>}
          </div>
        </div>
  
        <div className="pass-strength-row">
          <span>Strength:</span>
          <div className={`pass-strength-badge level-${strengthScore}`}>
            {strengthLabel}
          </div>
          <div className="pass-strength-bar">
            <div
              className="pass-strength-fill"
              style={{ width: `${(strengthScore / 4) * 100}%` }}
            />
          </div>
        </div>
  
        <div className="pass-criteria">
          {criteria.map((c) => (
            <div
              key={c.label}
              className={`criteria-item ${c.ok ? "ok" : ""}`}
            >
              {c.ok ? "✅" : "⬜"} {c.label}
            </div>
          ))}
        </div>
  
        <div className="pass-token-row">
          <div className="token-group">
            <div className="token-group-label">Words</div>
            <div className="token-grid">
              {words.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`token-chip ${selected.includes(w) ? "selected" : ""}`}
                  onClick={() => toggleToken(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
  
          <div className="token-group">
            <div className="token-group-label">Numbers</div>
            <div className="token-grid">
              {numbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`token-chip ${selected.includes(n) ? "selected" : ""}`}
                  onClick={() => toggleToken(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
  
          <div className="token-group">
            <div className="token-group-label">Symbols</div>
            <div className="token-grid">
              {symbols.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`token-chip ${selected.includes(s) ? "selected" : ""}`}
                  onClick={() => toggleToken(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
  
        <div className="pass-actions">
          {!missionComplete && (
            <button
              type="button"
              className="mini-primary-btn"
              onClick={lockMission}
              disabled={strengthScore < 3}
            >
              🔒 Lock this password
            </button>
          )}
  
          {missionComplete && !allDone && (
            <button type="button" className="mini-primary-btn" onClick={nextMission}>
              ▶ Next mission
            </button>
          )}
        </div>
  
        {allDone && (
          <div className="mini-complete-banner">
            🎉 Mission complete! You built strong passwords for all your key accounts.  
            Never reuse them on different websites.
          </div>
        )}
      </div>
    );
  }
  

  function SocialMediaMiniGame() {
    const [isPublic, setIsPublic] = useState(false);
    const [showLocation, setShowLocation] = useState(false);
    const [dmsOpen, setDmsOpen] = useState(true);
  
    const riskPoints =
      (isPublic ? 2 : 0) + (showLocation ? 2 : 0) + (dmsOpen ? 1 : 0);
  
    const riskLabel =
      riskPoints <= 1
        ? "Low"
        : riskPoints <= 3
        ? "Medium"
        : "High";
  
    const riskEmoji =
      riskLabel === "Low" ? "😌" : riskLabel === "Medium" ? "😬" : "😱";
  
    const safeSetup = riskPoints <= 1;
  
    return (
      <div className="mini-game-wrapper privacy-sim">
        <h2 className="mini-title">📱 Social Media Privacy Simulator</h2>
        <p className="mini-desc">
          Change your settings and see what <strong>strangers</strong> vs{" "}
          <strong>friends</strong> can see. Try to keep the risk meter low!
        </p>
  
        <div className="privacy-layout">
          {/* PHONE PREVIEW */}
          <div className="phone-preview">
            <div className="phone-header">
              <span className="phone-name">@you</span>
              <span
                className={`phone-badge ${
                  isPublic ? "public" : "private"
                }`}
              >
                {isPublic ? "Public" : "Private"}
              </span>
            </div>
  
            <div className="phone-post">
              <div className="phone-avatar">🧑‍💻</div>
              <div className="phone-post-body">
                <div className="phone-line">Hanging out after school!</div>
                {showLocation && (
                  <div className="phone-line small">
                    📍 Live near: <strong>Your City</strong>
                  </div>
                )}
                {isPublic ? (
                  <div className="phone-line small">
                    🌍 Visible to <strong>anyone</strong> on the internet
                  </div>
                ) : (
                  <div className="phone-line small">
                    👀 Visible to <strong>approved followers only</strong>
                  </div>
                )}
              </div>
            </div>
  
            <div className="phone-inbox">
              <div className="phone-inbox-header">Inbox</div>
              <div className="phone-inbox-row">
                <span>👤</span>
                <span className="phone-inbox-text">
                  {dmsOpen
                    ? "Random account: hey, wanna chat? 👀"
                    : "Only friends can send you messages."}
                </span>
              </div>
            </div>
          </div>
  
          {/* CONTROLS + RISK METER */}
          <div className="privacy-controls">
            <div className="privacy-setting">
              <div className="privacy-label">Profile Visibility</div>
              <p className="privacy-help">
                Public lets anyone see your posts. Private limits this to followers.
              </p>
              <div className="toggle-row">
                <button
                  type="button"
                  className={`toggle-pill ${!isPublic ? "active" : ""}`}
                  onClick={() => setIsPublic(false)}
                >
                  🔒 Private
                </button>
                <button
                  type="button"
                  className={`toggle-pill ${isPublic ? "active" : ""}`}
                  onClick={() => setIsPublic(true)}
                >
                  🌍 Public
                </button>
              </div>
            </div>
  
            <div className="privacy-setting">
              <div className="privacy-label">Location Sharing</div>
              <p className="privacy-help">
                Live location can show strangers where you are right now.
              </p>
              <div className="toggle-row">
                <button
                  type="button"
                  className={`toggle-pill ${!showLocation ? "active" : ""}`}
                  onClick={() => setShowLocation(false)}
                >
                  🚫 Off
                </button>
                <button
                  type="button"
                  className={`toggle-pill ${showLocation ? "active" : ""}`}
                  onClick={() => setShowLocation(true)}
                >
                  📍 On
                </button>
              </div>
            </div>
  
            <div className="privacy-setting">
              <div className="privacy-label">Direct Messages</div>
              <p className="privacy-help">
                Allowing anyone to DM you can invite spam or creepy messages.
              </p>
              <div className="toggle-row">
                <button
                  type="button"
                  className={`toggle-pill ${!dmsOpen ? "active" : ""}`}
                  onClick={() => setDmsOpen(false)}
                >
                  ✅ Friends only
                </button>
                <button
                  type="button"
                  className={`toggle-pill ${dmsOpen ? "active" : ""}`}
                  onClick={() => setDmsOpen(true)}
                >
                  📥 Anyone
                </button>
              </div>
            </div>
  
            <div className="risk-meter">
              <div className="risk-label-row">
                <span>Risk level</span>
                <span className={`risk-tag risk-${riskLabel.toLowerCase()}`}>
                  {riskEmoji} {riskLabel}
                </span>
              </div>
              <div className="risk-bar">
                <div
                  className="risk-fill"
                  style={{ width: `${(riskPoints / 5) * 100}%` }}
                />
              </div>
  
              {safeSetup ? (
                <p className="mini-hint good">
                  🎉 Great! You’re keeping your posts and DMs under control.
                </p>
              ) : (
                <p className="mini-hint">
                  Hint: Try turning off live location and limiting who can DM you.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  

  function TopicMiniGame({ topicId, userId, gameId, onScoreSaved }) {
    switch (topicId) {
      case 1:
        return <DigitalFootprintJourney2D userId={userId} gameId={gameId} onScoreSave={onScoreSaved} embedded={true} />;
      case 2:
        return <PersonalInfoJourney2D userId={userId} gameId={gameId} onScoreSave={onScoreSaved} embedded={true}  />;
      case 3:
        return <PasswordsJourney2D userId={userId} gameId={gameId} onScoreSave={onScoreSaved} embedded={true} />;
      case 4:
        return <SocialMediaJourney2D userId={userId} gameId={gameId} onScoreSave={onScoreSaved} embedded={true} />;
      default:
        return (
          <div className="mini-game-wrapper">
            <p>Mini-game for this chapter is coming soon. 🚧</p>
          </div>
        );
    }
  }

// -------------------- COMPONENT -------------------- //

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const numericGameId = Number(gameId);
  const videoRef = useRef(null);
  const [videoRatio, setVideoRatio] = useState("16 / 9");
  const [questions, setQuestions] = useState([]);
  const [gameTitle, setGameTitle] = useState("CyberQuest.TO Quiz");
  const [gameEmoji, setGameEmoji] = useState("🎮");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [rankLabel, setRankLabel] = useState(RANK_TIERS[0].label);

  // lesson vs quiz mode
  const [mode, setMode] = useState("lesson");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonSelected, setLessonSelected] = useState(null);
  const [lessonRevealed, setLessonRevealed] = useState(false);

  const userId = Number(localStorage.getItem("user_id"));

  const { speak, stop, speaking, supported } = useTextToSpeech();
  const [autoNarrate, setAutoNarrate] = useState(true);

  // ----- load game + questions ----- //
  useEffect(() => {
    const loadGame = async () => {
      const allGames = await getGames();
      const currentGame = allGames.find((g) => g.id === numericGameId);
      if (currentGame) {
        setGameTitle(currentGame.title);
        setGameEmoji(currentGame.emoji);
      }

      const qs = QUESTION_BANK[numericGameId] || [];
      setQuestions(qs);

      // reset quiz state
      setCurrentIndex(0);
      setSelectedIndex(null);
      setScore(0);
      setFinished(false);
      setShowFeedback(false);
      setIsCorrect(false);
      setStreak(0);
      setBestStreak(0);

      // reset lesson state
      setMode("lesson");
      setLessonIndex(0);
      setLessonSelected(null);
      setLessonRevealed(false);
    };

    loadGame();
  }, [numericGameId]);

  // leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getGameLeaderboard(numericGameId);
        setLeaderboard(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLeaderboard();
  }, [numericGameId]);

    // ===================== FEEDBACK TAB (Topic 4) =====================
    const [fbForm, setFbForm] = useState({
      topic_id: numericGameId,        // will be 4 on topic 4
      rating: 5,
      category: "suggestion",
      message: "",
    });
  
    const [fbBusy, setFbBusy] = useState(false);
    const [fbList, setFbList] = useState([]);
    const [fbLoaded, setFbLoaded] = useState(false);
  
    // keep topic_id synced when switching gameId
    useEffect(() => {
      setFbForm((p) => ({ ...p, topic_id: numericGameId }));
      setFbList([]);
      setFbLoaded(false);
    }, [numericGameId]);

    
  const loadMyFeedback = async () => {
    try {
      const res = await fetchMyFeedback(numericGameId);
      setFbList(res.data || []);
    } catch (e) {
      setFbList([]);
    } finally {
      setFbLoaded(true);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (!fbForm.message.trim()) {
      alert("Please type your feedback.");
      return;
    }

    setFbBusy(true);
    try {
      await submitFeedback({
        topic_id: numericGameId,
        rating: fbForm.rating,
        category: fbForm.category,
        message: fbForm.message.trim(),
      });

      alert("✅ Feedback submitted. Thank you!");
      setFbForm((p) => ({ ...p, message: "" }));
      await loadMyFeedback();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to submit feedback.");
    } finally {
      setFbBusy(false);
    }
  };

  // auto-load feedback when tab is opened
  useEffect(() => {
    if (mode === "feedback" && !fbLoaded) {
      loadMyFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fbLoaded]);

  

  // ----- derived values & narration ----- //

  const currentQuestion = questions[currentIndex] || null;
  const quizPercent = questions.length
    ? Math.round((currentIndex / questions.length) * 100)
    : 0;
  const objectives = OBJECTIVES[numericGameId] || [];
  const reflections = REFLECTION_QUESTIONS[numericGameId] || [];
  const story = STORYLINES[numericGameId];

  const lessonSteps = LESSON_FLOW[numericGameId] || [];
  const currentLesson = lessonSteps[lessonIndex] || null;

  const topicId = numericGameId; 
  const videoSrc = LESSON_VIDEOS[topicId];

  const narrationText = useMemo(() => {
    if (!currentQuestion || !questions.length) return "";
    const baseIntro = `CyberQuest.TO quiz. Topic: ${currentQuestion.topic}. Question ${
      currentIndex + 1
    } of ${questions.length}.`;
    const questionPart = currentQuestion.question;
    const optionsPart = currentQuestion.options
      .map((opt, idx) => `Option ${idx + 1}: ${opt}.`)
      .join(" ");
    return `${baseIntro} ${questionPart} Here are your choices. ${optionsPart}`;
  }, [currentQuestion, currentIndex, questions.length]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
    }
  }, [numericGameId]);

  useEffect(() => {
    if (!autoNarrate || !currentQuestion || !narrationText) return;
    if (mode !== "quiz") return; // only auto-read in quiz mode
    speak(narrationText, { rate: 0.95, pitch: 1.05 });
    return () => {
      stop();
    };
  }, [autoNarrate, currentQuestion, narrationText, speak, stop, mode]);

  useEffect(() => {
    let label = RANK_TIERS[0].label;
    for (const tier of RANK_TIERS) {
      if (score >= tier.threshold) label = tier.label;
    }
    setRankLabel(label);
  }, [score]);

  // ----- LESSON handlers (game-type presentation of lessons) ----- //

  const handleLessonChoice = (idx) => {
    if (lessonRevealed) return;
    setLessonSelected(idx);
    setLessonRevealed(true);
  };

  const handleLessonNext = () => {
    if (!lessonRevealed) return;
    const next = lessonIndex + 1;
    if (next < lessonSteps.length) {
      setLessonIndex(next);
      setLessonSelected(null);
      setLessonRevealed(false);
    } else {
      // after finishing all lesson cards → switch to quiz mode
      setMode("quiz");
      setLessonIndex(0);
      setLessonSelected(null);
      setLessonRevealed(false);
    }
  };

  // ----- QUIZ handlers ----- //

  const refreshLeaderboard = async () => {
    try {
      const data = await getGameLeaderboard(numericGameId);
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMainButton = async () => {
    if (selectedIndex === null) return;
    const question = questions[currentIndex];

    // first click: check answer
    if (!showFeedback) {
      const correct = selectedIndex === question.correctIndex;
      setIsCorrect(correct);
      setShowFeedback(true);

      if (correct) {
        setScore((prev) => prev + 10);
        setStreak((prev) => {
          const newStreak = prev + 1;
          setBestStreak((best) => Math.max(best, newStreak));
          return newStreak;
        });
      } else {
        setStreak(0);
      }
      return;
    }

    // second click: next / finish
    const nextIndex = currentIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedIndex(null);
      setShowFeedback(false);
      setIsCorrect(false);
      return;
    }

    // finish quiz
    setFinished(true);
    setShowFeedback(false);

    try {
      await submitScore({
        user_id: userId,
        game_id: numericGameId,
        score,
      });
      await refreshLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  // ----- early return (after hooks) ----- //

  if (!questions.length || !currentQuestion) {
    return <p className="game-loading">Loading questions...</p>;
  }

  function MiniGame({ topicId }) {
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]); // indices of currently flipped
    const [matchedPairIds, setMatchedPairIds] = useState([]); // list of pair ids
    const [moves, setMoves] = useState(0);
    const [completed, setCompleted] = useState(false);
  
    // build & shuffle deck whenever topic changes
    useEffect(() => {
      const pairs = MINIGAME_DATA[topicId] || [];
      const deck = pairs.flatMap((pair) => [
        { uid: pair.id + "-a", pairId: pair.id, label: pair.front },
        { uid: pair.id + "-b", pairId: pair.id, label: pair.back },
      ]);
  
      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setFlipped([]);
      setMatchedPairIds([]);
      setMoves(0);
      setCompleted(false);
    }, [topicId]);
  
    const handleFlip = (index) => {
      if (completed) return;
  
      // already matched? ignore
      const card = cards[index];
      if (!card) return;
      if (matchedPairIds.includes(card.pairId)) return;
  
      // already flipped? ignore
      if (flipped.includes(index)) return;
  
      // first flip
      if (flipped.length === 0) {
        setFlipped([index]);
        return;
      }
  
      // second flip
      if (flipped.length === 1) {
        const firstIndex = flipped[0];
        const firstCard = cards[firstIndex];
  
        const newFlipped = [firstIndex, index];
        setFlipped(newFlipped);
        setMoves((m) => m + 1);
  
        // check match after short delay so player can see both cards
        setTimeout(() => {
          if (!firstCard || !card) return;
  
          if (firstCard.pairId === card.pairId) {
            // found a match
            setMatchedPairIds((prev) => {
              const updated = [...prev, card.pairId];
              // all pairs matched?
              const totalPairs = MINIGAME_DATA[topicId]?.length || 0;
              if (updated.length === totalPairs && totalPairs > 0) {
                setCompleted(true);
              }
              return updated;
            });
            setFlipped([]);
          } else {
            // not a match → flip back
            setFlipped([]);
          }
        }, 700);
  
        return;
      }
    };
  
    const handleRestart = () => {
      const pairs = MINIGAME_DATA[topicId] || [];
      const deck = pairs.flatMap((pair) => [
        { uid: pair.id + "-a", pairId: pair.id, label: pair.front },
        { uid: pair.id + "-b", pairId: pair.id, label: pair.back },
      ]);
      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setFlipped([]);
      setMatchedPairIds([]);
      setMoves(0);
      setCompleted(false);
    };
  
    return (
      <div className="mini-game-wrapper">
        <div className="mini-game-hud">
          <div>
            <span className="mini-hud-label">Pairs matched:</span>{" "}
            <strong>{matchedPairIds.length}</strong> /{" "}
            {MINIGAME_DATA[topicId]?.length || 0}
          </div>
          <div>
            <span className="mini-hud-label">Moves:</span>{" "}
            <strong>{moves}</strong>
          </div>
          <button type="button" className="mini-restart-btn" onClick={handleRestart}>
            🔁 Shuffle cards
          </button>
        </div>
  
        <div className="mini-game-grid">
          {cards.map((card, index) => {
            const isFlipped =
              flipped.includes(index) || matchedPairIds.includes(card.pairId);
  
            return (
              <button
                key={card.uid}
                type="button"
                className={`mini-card ${isFlipped ? "flipped" : ""} ${
                  matchedPairIds.includes(card.pairId) ? "matched" : ""
                }`}
                onClick={() => handleFlip(index)}
              >
                <div className="mini-card-inner">
                  <div className="mini-card-front">?</div>
                  <div className="mini-card-back">{card.label}</div>
                </div>
              </button>
            );
          })}
        </div>
  
        {completed && (
          <div className="mini-complete-banner">
            🎉 Nice memory! You matched all the cyber quest pairs in {moves} moves.
          </div>
        )}
      </div>
    );
  }
  const storyLesson = STORY_LESSON?.[numericGameId];
  

  // -------------------- UI -------------------- //

  return (
    <div className="game-page">
      <header className="game-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ⬅ Back
        </button>

        <div className="game-header-title">
          <span className="game-header-emoji">{gameEmoji}</span>
          <h1>{gameTitle}</h1>
        </div>

        <div className="game-meta">
          <div className="game-score-badge">
            Score: <span>{score}</span>
          </div>
          <div className="game-streak-badge">
            Streak: <span>{streak}</span>
            {bestStreak > 1 && (
              <span className="game-streak-best">Best: {bestStreak}</span>
            )}
          </div>
          <div className="game-rank-pill">Rank: {rankLabel}</div>
        </div>
      </header>

      <main className="game-main">
        <section className="quiz-card">
          {/* Mode toggle: lesson vs quiz */}
          <div className="game-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${mode === "lesson" ? "active" : ""}`}
              onClick={() => setMode("lesson")}
            >
              📖 Story Lesson
            </button>
                      
            <button
              type="button"
              className={`mode-btn ${mode === "minigame" ? "active" : ""}`}
              onClick={() => setMode("minigame")}
            >
              🎮 Mini Game
            </button>
                      
            <button
              type="button"
              className={`mode-btn ${mode === "quiz" ? "active" : ""}`}
              onClick={() => setMode("quiz")}
            >
              🎯 Quiz Challenge
            </button>

            <button
              type="button"
              className={`mode-btn ${mode === "feedback" ? "active" : ""}`}
              onClick={() => setMode("feedback")}
            >
              📝 Feedback
            </button>

          </div>

          {mode === "feedback" && (
            // If you want Feedback ONLY for topic 4:
             numericGameId !== 4 ? <p>Feedback is available for Topic 4 only.</p> :
            <div className="feedback-wrapper">
              <h2 className="feedback-title">📝 Feedback (Topic {numericGameId})</h2>
              <p className="feedback-sub">
                Report issues, suggest improvements, or share ideas about this topic.
              </p>          

              <form className="feedback-form" onSubmit={handleSubmitFeedback}>
                <div className="feedback-row">
                  <label>Category</label>
                  <select
                    value={fbForm.category}
                    onChange={(e) => setFbForm({ ...fbForm, category: e.target.value })}
                  >
                    <option value="bug">🐛 Bug</option>
                    <option value="suggestion">💡 Suggestion</option>
                    <option value="content">📚 Lesson Content</option>
                    <option value="other">📝 Other</option>
                  </select>
                </div>          

                <div className="feedback-row">
                  <label>Rating</label>
                  <select
                    value={fbForm.rating}
                    onChange={(e) => setFbForm({ ...fbForm, rating: Number(e.target.value) })}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐</option>
                    <option value={4}>⭐⭐⭐⭐</option>
                    <option value={3}>⭐⭐⭐</option>
                    <option value={2}>⭐⭐</option>
                    <option value={1}>⭐</option>
                  </select>
                </div>          

                <div className="feedback-row">
                  <label>Your Feedback</label>
                  <textarea
                    rows={6}
                    value={fbForm.message}
                    onChange={(e) => setFbForm({ ...fbForm, message: e.target.value })}
                    placeholder="What should we improve? What issue did you experience?"
                  />
                </div>          

                <button className="feedback-submit" type="submit" disabled={fbBusy}>
                  {fbBusy ? "Submitting..." : "Submit Feedback ✅"}
                </button>
              </form>         

              <div className="feedback-history">
                <h3>📌 My Previous Feedback</h3>          

                {!fbLoaded ? (
                  <p>Loading...</p>
                ) : fbList.length === 0 ? (
                  <p style={{ opacity: 0.75 }}>No feedback yet.</p>
                ) : (
                  fbList.map((f) => (
                    <div key={f.id} className="feedback-item">
                      <div className="feedback-meta">
                        <span>📂 {f.category}</span>
                        <span>⭐ {f.rating ?? "-"}</span>
                        <span>{new Date(f.created_at).toLocaleString()}</span>
                        <span>{f.is_resolved ? "✅ Resolved" : "🕒 Pending"}</span>
                      </div>
                      <div className="feedback-msg">{f.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}



          {/* LESSON MODE: gamified lesson flow */}
          {mode === "lesson" && currentLesson && (
            //DITO    
            <div className="lesson-wrapper">
             
             <div className="lesson-video">
             {videoSrc ? (
                <video
                  ref={videoRef}
                  key={videoSrc}   
                  className="lesson-video-player"
                  controls
                  playsInline
                  preload="metadata"
                >
                  <source src={videoSrc} type={getVideoType(videoSrc)} />
                </video>
              ) : (
                <div className="no-video-box">
                  <h3>No video for this topic</h3>
                  <p>Proceed to the lesson content below.</p>
                </div>
              )}
            </div>


               {LESSON_INTRO[numericGameId] && (
                <div className="lesson-box">
                  <h2>📖 {LESSON_INTRO[numericGameId].title}</h2>
                  <ul>
                    {LESSON_INTRO[numericGameId].text.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                  <p className="lesson-tip">
                    {LESSON_INTRO[numericGameId].quickTip}
                  </p>
                </div>
              )}

              {storyLesson && (
                <div className="story-lesson">
                  <h2> {storyLesson.title}</h2>
              
                  {/* Learning Objectives */}
                  <section>
                    <h3>🎯 Learning Objectives</h3>
                    <ol>
                      {(storyLesson.objectives ?? []).map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ol>
                  </section>
                      
                  {/* Key Concepts */}
                  <section>
                    <h3>🧠 Key Concepts</h3>
                    {(storyLesson.concepts ?? []).map((concept, i) => (
                      <div key={i} className="story-card">
                        <h4>{concept.title}</h4>
                    
                        <ul>
                          {(concept.points ?? []).map((p, j) => (
                            <li key={j}>{p}</li>
                          ))}
                        </ul>
                          
                        {concept.note && <p className="story-note">⚠️ {concept.note}</p>}
                      </div>
                    ))}
                  </section>
                          
                  {/* Real-Life Example */}
                  {storyLesson.example?.text && (
                    <section className="story-example">
                      <h3>📌 {storyLesson.example?.title ?? "Real-Life Example"}</h3>
                      <p>{storyLesson.example.text}</p>
                    </section>
                  )}

                  {/* Best Practices */}
                  <section className="story-best">
                    <h3>🔐 Best Practices</h3>
                    <ul>
                      {(storyLesson.bestPractices ?? []).map((bp, i) => (
                        <li key={i}>✔ {bp}</li>
                      ))}
                    </ul>
                  </section>
                      
                  {/* Key Takeaways */}
                  <section className="story-takeaways">
                    <h3>✅ Key Takeaways</h3>
                    <ul>
                      {(storyLesson.takeaways ?? []).map((tk, i) => (
                        <li key={i}>{tk}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}



            </div>
          )}

        {mode === "minigame" && (
          <TopicMiniGame topicId={numericGameId} />
        )}



          {/* QUIZ MODE: game-style quiz presentation */}
          {mode === "quiz" && (
            <>

              <div className="objectives-box">
                <h2>📘 Learning Goals</h2>
                <ul>
                  {objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>

              {story && (
                <div className="story-box">
                  <h2>📖 Your Mission</h2>
                  <p>{story}</p>
                </div>
              )}

              <div className="quiz-top-row">
                <div className="quiz-progress">
                  <span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <div className="quiz-progress-bar">
                    <div
                      className="quiz-progress-fill"
                      style={{ width: `${quizPercent}%` }}
                    />
                  </div>
                </div>

                {supported && (
                  <div className="tts-controls">
                    <button
                      type="button"
                      className={`tts-button ${speaking ? "speaking" : ""}`}
                      onClick={() =>
                        speaking
                          ? stop()
                          : speak(narrationText, { rate: 0.95, pitch: 1.05 })
                      }
                    >
                      {speaking ? "⏹ Stop voice" : "🔊 Listen"}
                    </button>

                    <label className="tts-toggle">
                      <input
                        type="checkbox"
                        checked={autoNarrate}
                        onChange={(e) => setAutoNarrate(e.target.checked)}
                      />
                      <span>Auto-read questions</span>
                    </label>
                  </div>
                )}
              </div>

              <p className="quiz-topic">Topic: {currentQuestion.topic}</p>
              <p className="quiz-question">{currentQuestion.question}</p>

              <div className="quiz-options">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isAnswer = currentQuestion.correctIndex === idx;

                  let extraClass = "";
                  if (showFeedback) {
                    if (isSelected && isCorrect) extraClass = "correct";
                    else if (isSelected && !isCorrect) extraClass = "incorrect";
                    else if (isAnswer) extraClass = "answer";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => !showFeedback && setSelectedIndex(idx)}
                      className={`quiz-option-btn ${
                        isSelected && !showFeedback ? "selected" : ""
                      } ${extraClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="quiz-footer">
                {showFeedback && (
                  <>
                    <p
                      className={`feedback-text ${
                        isCorrect ? "feedback-correct" : "feedback-incorrect"
                      }`}
                    >
                      {isCorrect
                        ? streak > 1
                          ? `Awesome! Correct + combo x${streak} 🔥`
                          : "Nice! That’s correct 🎉"
                        : "Good try! Check the explanation below 💡"}
                    </p>
                    <p className="explanation-text">
                      <strong>Explanation:</strong> {currentQuestion.explanation}
                    </p>
                  </>
                )}

                {!finished && (
                  <button
                    className="next-btn"
                    onClick={handleMainButton}
                    disabled={selectedIndex === null}
                  >
                    {!showFeedback
                      ? "Check Answer"
                      : currentIndex === questions.length - 1
                      ? "Finish Quiz"
                      : "Next Question"}
                  </button>
                )}

                {finished && (
                  <div className="quiz-finished">
                    <h2>Quiz Finished! 🎉</h2>
                    <p>Your final score: {score}</p>
                    <p>Final rank: {rankLabel}</p>

                    {reflections.length > 0 && (
                      <div className="reflection-box">
                        <h3>🧠 Reflect</h3>
                        <ul>
                          {reflections.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      className="play-again-btn"
                      onClick={() => {
                        setCurrentIndex(0);
                        setScore(0);
                        setFinished(false);
                        setSelectedIndex(null);
                        setShowFeedback(false);
                        setIsCorrect(false);
                        setStreak(0);
                        setBestStreak(0);
                      }}
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <aside className="leaderboard-card">
          <h2>🏆 Game Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="lb-empty">No scores yet. Be the first!</p>
          ) : (
            <ol>
              {leaderboard.map((entry, i) => (
                <li key={i}>
                  <span className="lb-rank">{i + 1}.</span>
                  <span className="lb-name">{entry.username}</span>
                  <span className="lb-score">{entry.score}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </main>
    </div>
  );
}
