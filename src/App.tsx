import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Users, Building2, Calendar, ChevronRight, Sparkles, X, Send, Bot, Briefcase, Camera } from 'lucide-react';

type UserType = 'brand' | 'creator' | null;
type Message = {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// Add new type for consultation steps
type ConsultationStep = 
  'introduction' |
  'contentType' |
  'platforms' |
  'audienceSize' |
  'brandExperience' |
  'goals' |
  'confirmation' |
  'marketingGoals' |
  'influencerType' |
  'budget' |
  'industry' |
  'contactInfo';

// Add interface for webhook data structure
interface WebhookData {
  formType: 'creator' | 'brand';
  submissionId: string;
  timestamp: string;
  userInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    socialHandles?: string;
  };
  consultationData: {
    [key: string]: string;
  };
  metadata: {
    userAgent: string;
    submissionTime: {
      local: string;
      utc: string;
    };
  };
}

function App() {
  const trustScroll = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // Brand-specific fields
    company: '',
    industry: '',
    previousInfluencerExperience: '',
    currentMarketingChannels: '',
    budget: '',
    campaignGoals: '',
    targetAudience: '',
    creatorPreferences: '',
    preferredContentTypes: '',
    brandValues: '',
    // Creator-specific fields
    niche: '',
    platforms: '',
    followers: '',
    engagementRate: '',
    contentTypes: '',
    socialHandles: ''
  });

  // Add a state for showing extended info modal
  const [showExtendedInfo, setShowExtendedInfo] = useState<number | null>(null);

  // Add a new state to track if this is an event application chat or general inquiry
  const [isEventChat, setIsEventChat] = useState(false);

  // Add conversation context tracking
  const [conversationContext, setConversationContext] = useState({
    lastTopic: '',
    userDetails: {
      socialHandles: '',
      contentType: '',
      hasSharedEmail: false,
      interestedInEvent: false,
      eventType: ''
    }
  });

  // Add a new state for onboarding step
  const [onboardingStep, setOnboardingStep] = useState<'userType' | 'details'>('userType');

  // Add new state for tracking consultation progress
  const [currentStep, setCurrentStep] = useState<ConsultationStep>('introduction');

  // Add consultation flow object
  const consultationFlow = {
    introduction: {
      message: "Hi! I'm Buzz, the Notmrw Creatives AI assistant! 🐝✨ Let's find the perfect influencer marketing strategy for your brand. I'll ask a few quick questions to understand your needs. Ready to begin? 🚀",
      options: ["Yes, let's start!", "I'd like to learn more first"]
    },
    marketingGoals: {
      message: "Great! First, what are your primary marketing goals? 🎯",
      options: [
        "Brand Awareness",
        "Drive Sales",
        "App Downloads",
        "Social Media Growth",
        "Other (please specify)"
      ]
    },
    influencerType: {
      message: "What type of influencers are you interested in working with? 👥",
      options: [
        "Nano (1K-10K followers)",
        "Micro (10K-100K followers)",
        "Macro (100K-1M followers)",
        "Celebrity (1M+ followers)",
        "Mix of different tiers"
      ]
    },
    platforms: {
      message: "Which social media platforms would you like to focus on? 📱",
      options: [
        "TikTok",
        "Instagram",
        "YouTube",
        "X (Twitter)",
        "Multiple platforms"
      ]
    },
    budget: {
      message: "What's your estimated monthly budget for influencer campaigns? 💰",
      options: [
        "$5K - $10K",
        "$10K - $25K",
        "$25K - $50K",
        "$50K+",
        "Still determining"
      ]
    },
    industry: {
      message: "What industry or content style interests you most? 🎯",
      options: [
        "Beauty & Fashion",
        "Tech & Gaming",
        "Food & Lifestyle",
        "Health & Fitness",
        "Other (please specify)"
      ]
    },
    contactInfo: {
      message: "Perfect! To provide you with the best recommendations, I'll need some contact details. Could you please share: 📝",
      fields: [
        "Full Name",
        "Company Name",
        "Email Address",
        "Phone Number"
      ]
    },
    confirmation: {
      message: "Thank you for sharing your information! 🌟 Our team will review your needs and reach out within 24 hours with customized influencer marketing solutions. Would you like me to send you a summary of our discussion? 📧",
      options: ["Yes, please", "No, thanks"]
    }
  };

  // Update the creator consultation flow
  const creatorConsultationFlow = {
    introduction: {
      message: "Hi! I'm Buzz, your creator success assistant! 🐝✨ I help creators like you build successful brand partnerships and monetize your content. Ready to explore opportunities with Notmrw Creatives? 🚀",
      options: ["Yes, let's start!", "Tell me more first"]
    },
    contentType: {
      message: "What type of content do you primarily create? 🎨",
      options: [
        "Lifestyle & Travel",
        "Fashion & Beauty",
        "Gaming & Tech",
        "Fitness & Health",
        "Comedy & Entertainment",
        "Food & Cooking",
        "Other (please specify)"
      ]
    },
    platforms: {
      message: "Which social media platforms are you most active on? 📱",
      options: [
        "TikTok",
        "Instagram",
        "YouTube",
        "X (Twitter)",
        "Twitch",
        "Multiple Platforms"
      ]
    },
    audienceSize: {
      message: "What's your current follower count on your main platform? 📊",
      options: [
        "1K - 10K followers",
        "10K - 50K followers",
        "50K - 100K followers",
        "100K - 500K followers",
        "500K+ followers"
      ]
    },
    brandExperience: {
      message: "Have you worked with brands before? 🤝",
      options: [
        "Yes - Multiple brand deals",
        "Yes - A few collaborations",
        "Yes - One or two projects",
        "No - But interested",
        "No - Just starting out"
      ]
    },
    goals: {
      message: "What are you looking to gain from joining Notmrw Creatives? 🎯",
      options: [
        "Brand Partnerships & Deals",
        "Event & Networking Opportunities",
        "Content Collaborations",
        "Career Growth & Development",
        "All of the Above"
      ]
    },
    confirmation: {
      message: "Thank you for sharing your information! 🌟 Our creator success team will review your profile and reach out within 24 hours to discuss partnership opportunities. Would you like me to send you a summary of our discussion? 📧",
      options: ["Yes, please", "No, thanks"]
    }
  };

  // Add consultation data state
  const [consultationData, setConsultationData] = useState({
    marketingGoals: '',
    influencerType: '',
    platforms: '',
    budget: '',
    industry: '',
    contactInfo: {
      fullName: '',
      companyName: '',
      email: '',
      phone: ''
    }
  });

  // Change the variable name from raidenResponses to buzzResponses
  const buzzResponses = {
    greeting: {
      brand: "Bzz! Welcome to Notmrw Creatives! I'm Buzz, your dedicated AI assistant! 🐝✨ I help brands like yours connect with the perfect content creators. Would you like to learn about our influencer marketing services or see how we've helped other brands succeed? 🌟",
      creator: "Bzz! Welcome to Notmrw Creatives! I'm Buzz, your creator success assistant! 🐝✨ I help creators monetize their content and build lasting brand partnerships. Ready to learn how we can grow your career? 🌟"
    },
    faq: {
      brand: {
        creators: "Bzz! Our AI-powered matching system finds creators who:\n\n• Match your brand values and aesthetic\n• Reach your target demographic\n• Have proven engagement rates\n• Deliver measurable ROI\n\nWe're preparing a curated list of creators for you! Would you like a team member to walk you through the selection process? 🎯",
        process: "Bzz! Here's how we maximize your influencer marketing success:\n\n1. AI-powered creator matching based on your goals 🎯\n2. Data-driven campaign strategy and execution 📊\n3. Real-time performance tracking and optimization 📈\n4. Detailed ROI and engagement analytics 💫\n\nReady to see how we can help your brand grow? 🚀",
        pricing: "Bzz! We customize solutions based on your goals and budget! Our campaigns start from $5k, and we ensure:\n\n• Maximum ROI through data-driven matching\n• Full-service campaign management\n• Performance guarantees\n• Detailed analytics\n\nWould you like to discuss your specific campaign needs? 💼",
        influencerHouse: "Bzz! Our creator houses offer unique brand activation opportunities:\n\n• Live content creation with top creators\n• Exclusive product launches\n• Immersive brand experiences\n• Real-time content generation\n\nInterested in our upcoming creator house events? Let me connect you with our events team! 🏠✨"
      },
      creator: {
        howItWorks: "Bzz! Here's how Notmrw Creatives helps you succeed:\n\n• AI-powered brand matching for consistent paid opportunities 💰\n• Expert negotiation to maximize your earnings 📈\n• Career development and content strategy support 🎯\n• Exclusive events and networking opportunities 🌟\n\nReady to start earning with top brands? 🚀",
        earnings: "Bzz! Our creators earn through multiple revenue streams:\n\n• Brand partnerships and sponsored content 💼\n• Event appearances and activations 🎉\n• Content house residencies 🏠\n• Long-term brand ambassadorships 👑\n\nWant to learn about our current opportunities? 💫",
        support: "Bzz! We support your creator career with:\n\n• Contract negotiation and rate optimization 📝\n• Content strategy consulting 🎯\n• Analytics and growth insights 📊\n• Brand relationship management 🤝\n\nReady to take your content creation career to the next level? ✨",
        application: "Bzz! Let's get you started with Notmrw Creatives! 🚀\n\nPlease share:\n• Your social media handles\n• Content categories\n• Engagement metrics\n• Brand collaboration goals\n\nOur team will review your profile within 24-48 hours! 📋"
      }
    },
    handoff: {
      brand: "Bzz! For detailed campaign planning, our brand partnerships team is ready to assist! 🐝 Please reach out to partnerships@notmrw.net, and a dedicated manager will contact you within 24 hours! Would you like me to notify them about your interest? 📧",
      creator: "Bzz! For creator success planning, our talent team is here to help! 🐝 Please contact talent@notmrw.net, and a creator success manager will reach out within 24 hours! Would you like me to let them know you're interested? 📧"
    },
    noAnswer: "Bzz! That's a great question that needs personalized attention! 🐝 Please reach out to hello@notmrw.net, and our team will provide detailed information within 24 hours. Would you like me to notify them about your specific inquiry? 📧✨",
    goodbye: "Bzz! Thanks for stopping by! If you need anything later, I'll be here to help! 🐝✨",
    // ... rest of the responses
  };

  // Update the trustedBrands array
  const trustedBrands = [
    {
      name: 'TikTok',
      logo: '/Brand Logos/tiktok-logo.svg',
    },
    {
      name: 'Nike',
      logo: '/Brand Logos/nike-logo.svg',
    },
    {
      name: 'Boohoo',
      logo: '/Brand Logos/boohoo-logo.svg', // Make sure this image is in your public folder
    }
  ];

  // Add function to generate submission ID
  const generateSubmissionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Update the webhook submission function
  const sendToWebhook = async (data: Partial<WebhookData>) => {
    try {
      const webhookData: WebhookData = {
        ...data,
        metadata: {
          userAgent: navigator.userAgent,
          submissionTime: {
            local: new Date().toString(),
            utc: new Date().toUTCString()
          }
        }
      } as WebhookData;

      console.log('Sending webhook data:', JSON.stringify(webhookData, null, 2));

      const response = await fetch('https://hook.us2.make.com/jayb11t4hduccicghts2e351t2wf1bvi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Webhook submission failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending data to webhook:', error);
      // You might want to add error handling UI here
    }
  };

  useEffect(() => {
    if (showChat) {
      let initialMessage;
      
      // Check if this is an event application
      if (formData.campaignGoals?.includes('Makeup in LA') || 
          formData.campaignGoals?.includes('Coachella') || 
          formData.campaignGoals?.includes('AkessLA')) {
        setIsEventChat(true);
        
        // Instead of starting chat, show thank you message and close
        const thankYouMessage = "Thank you for registering for the event! Our team will review your application and be in touch shortly. ✨";
        
        setMessages([{
          text: thankYouMessage,
          sender: 'ai',
          timestamp: new Date()
        }]);
        
        // Close the chat and reset form after 5 seconds
        setTimeout(() => {
          setShowChat(false);
          setShowForm(false);
          setUserType(null);
          setShowExtendedInfo(null);
          setFormData({
            name: '',
            email: '',
            phone: '',
            company: '',
            industry: '',
            budget: '',
            campaignGoals: '',
            targetAudience: '',
            niche: '',
            platforms: '',
            followers: '',
            engagementRate: '',
            contentTypes: '',
            socialHandles: ''
          });
        }, 5000);
      } else {
        // Update the reference here
        setIsEventChat(false);
        initialMessage = buzzResponses.greeting[userType as 'brand' | 'creator'];
      setMessages([{
        text: initialMessage,
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
    }
  }, [showChat, formData.campaignGoals, userType]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const scroll = () => {
      if (trustScroll.current) {
        if (trustScroll.current.scrollLeft >= trustScroll.current.scrollWidth - trustScroll.current.clientWidth) {
          trustScroll.current.scrollLeft = 0;
        } else {
          trustScroll.current.scrollLeft += 1;
        }
      }
    };
    
    const interval = setInterval(scroll, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowChat(true);
    setOnboardingStep('chat');
  };

  // Update handleGetStarted to handle different flows for brands and creators
  const handleGetStarted = (type: UserType) => {
    setUserType(type);
    
    if (type === 'brand') {
      setShowChat(true);
      setCurrentStep('introduction');
      setMessages([{
        text: consultationFlow.introduction.message,
        sender: 'ai',
      timestamp: new Date()
    }]);
      } else {
      // Show contact form first for creators
      setShowForm(true);
    }
  };

  // Update the handleCreatorFormSubmit function to send initial creator data
  const handleCreatorFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const initialCreatorData: Partial<WebhookData> = {
      formType: 'creator',
      submissionId: generateSubmissionId(),
      timestamp: new Date().toISOString(),
      userInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        socialHandles: formData.socialHandles
      },
      consultationData: {
        niche: formData.niche,
        platforms: formData.platforms,
        followers: formData.followers,
        engagementRate: formData.engagementRate,
        contentTypes: formData.contentTypes
      }
    };

    // Send initial creator data
    sendToWebhook(initialCreatorData);
    
    setShowForm(false);
    setShowChat(true);
  };

  // Update the handleBrandFormSubmit function to send initial brand data
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

    const initialBrandData: Partial<WebhookData> = {
      formType: 'brand',
      submissionId: generateSubmissionId(),
      timestamp: new Date().toISOString(),
      userInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company
      },
      consultationData: {
        industry: formData.industry,
        budget: formData.budget,
        campaignGoals: formData.campaignGoals,
        targetAudience: formData.targetAudience,
        currentMarketingChannels: formData.currentMarketingChannels
      }
    };

    // Send initial brand data
    sendToWebhook(initialBrandData);

    setShowForm(false);
    setShowChat(true);
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setShowForm(true);
  };

  // Update the events array
  const events = [
    {
      title: "Makeup in Los Angeles & Luxe Pack Los Angeles",
      date: "February 14-15, 2025",
      location: "Los Angeles Convention Center",
      description: "Join us for the premier beauty and packaging event in Los Angeles.",
      link: "#",
      type: "makeup",
      extendedInfo: "We're seeking beauty and lifestyle creators to join us at this premier industry event. This is a unique opportunity to educate brands on the power of influencer marketing while expanding your network. Selected creators will get exclusive access to brand decision-makers, new product launches, and industry insights."
    },
    {
      title: "AksessLA The Creatorverse by notmrw",
      date: "February 26, 2025",
      location: "Los Angeles, CA",
      description: "Join us for an exclusive creator networking event.",
      link: "#",
      type: "networking",
      extendedInfo: "Connect with fellow creators and industry leaders at this exclusive networking event. Share experiences, learn from peers, and discover new collaboration opportunities in a vibrant atmosphere designed for creator success."
    },
    {
      title: "notmrw X Coachella 2025 Week One",
      date: "April 11-13, 2025",
      location: "Coachella Valley, CA",
      description: "Looking for creators to join our Coachella house and take part in branded activations and tons of fun! Space is limited and acceptance is based on approval.",
      link: "#",
      type: "coachella",
      extendedInfo: "Join our exclusive creator house during Coachella 2025! Selected creators will receive:\n• Free accommodation with other content creators\n• Paid brand collaboration opportunities\n• Access to exclusive parties and events\n• Network with fellow creators for cross-promotion\n• Professional content creation support\n\nWe're looking for creators who can produce engaging festival content while representing our brand partners throughout the weekend."
    }
  ];

  const handleEventClick = (link: string, eventType: string) => {
    setUserType('creator');
    setFormData(prev => ({
      ...prev,
      niche: eventType === 'makeup' ? 'Beauty & Cosmetics' : 
             eventType === 'coachella' ? 'Music & Lifestyle' :
             'Content Creation & Innovation',
      campaignGoals: eventType === 'makeup' 
        ? 'Interested in participating in Makeup in LA & Luxe Pack LA event'
        : eventType === 'coachella'
        ? 'Interested in joining Coachella 2025 creator house'
        : 'Interested in joining the AkessLA Creatorverse founding community'
    }));
    setShowForm(true);
  };

  // Update the event card's learn more button click handler
  const handleLearnMore = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setShowExtendedInfo(index);
  };

  // Add new function to handle event registration
  const handleEventRegistration = (eventType: string) => {
    setUserType('creator');
    setFormData(prev => ({
      ...prev,
      // Pre-fill form based on event type
      campaignGoals: eventType === 'makeup' 
        ? 'Makeup in LA & Luxe Pack LA event registration'
        : eventType === 'coachella'
        ? 'Coachella 2025 creator house registration'
        : 'AkessLA Creatorverse registration',
      // Set default niche based on event
      niche: eventType === 'makeup' ? 'Beauty & Cosmetics' : 
             eventType === 'coachella' ? 'Music & Lifestyle' :
             'Content Creation & Innovation'
    }));
    setShowForm(true);
    setShowExtendedInfo(null);
  };

  // Update the gallery images array with the TikTok unboxing photos in the exact order from the image
  const galleryImages = [
    '/gallery/tiktok-neon-x.jpg',          // Blue neon X from ceiling
    '/gallery/tiktok-unboxing-wall.jpg',   // Yellow neon "Unboxing" repeated text wall
    '/gallery/tiktok-shopping-logo.jpg',   // Blue "Shopping Week" circular logo
    '/gallery/tiktok-boxes-stack.jpg',     // Stack of blue TikTok logo boxes
    '/gallery/tiktok-red-platform.jpg',    // Red/burgundy circular platform
    '/gallery/tiktok-gradient-wall.jpg'    // Pink/blue gradient textured wall
  ];

  useEffect(() => {
    // Debug image loading
    galleryImages.forEach((image, index) => {
      const img = new Image();
      img.onload = () => console.log(`Image ${index + 1} loaded successfully:`, image);
      img.onerror = () => console.error(`Image ${index + 1} failed to load:`, image);
      img.src = image;
    });
  }, []);

  useEffect(() => {
    console.log('Loading gallery images...');
    galleryImages.forEach((imagePath, index) => {
      const img = new Image();
      img.onload = () => console.log(`✅ Image ${index + 1} loaded: ${imagePath}`);
      img.onerror = () => console.error(`❌ Image ${index + 1} failed to load: ${imagePath}`);
      img.src = imagePath;
    });
  }, []);

  // Update the handleConsultationResponse function
  const handleConsultationResponse = (response: string) => {
    // Add user's response to chat
    setMessages(prev => [...prev, {
      text: response,
      sender: 'user',
      timestamp: new Date()
    }]);

    // Update consultation data
    setConsultationData(prev => ({
      ...prev,
      [currentStep]: response
    }));

    // Handle final steps
    if ((userType === 'creator' && currentStep === 'goals') || 
        (userType === 'brand' && currentStep === 'industry')) {
      
      // Show contact form for brands
      if (userType === 'brand') {
        setMessages(prev => [...prev, {
          text: "Great! To provide you with personalized recommendations, please share your contact details:",
          sender: 'ai',
          timestamp: new Date()
        }]);
        setCurrentStep('contactInfo');
        return;
      }

      // Send creator data and show thank you message
      if (userType === 'creator') {
        const creatorData = {
          formType: 'creator',
          submissionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          userInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            socialHandles: formData.socialHandles
          },
          consultationData: {
            contentType: consultationData.contentType || '',
            platforms: consultationData.platforms || '',
            audienceSize: consultationData.audienceSize || '',
            brandExperience: consultationData.brandExperience || '',
            goals: response
          }
        };

        // Send data to webhook
        try {
          fetch('https://hook.us2.make.com/jayb11t4hduccicghts2e351t2wf1bvi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creatorData)
          });
        } catch (error) {
          console.error('Error sending data:', error);
        }

        // Show thank you message and close
        setMessages(prev => [...prev, {
          text: "Thank you for sharing your information! Our creator success team will be in touch within 24 hours to discuss exciting partnership opportunities. Have a great day! 🐝✨",
          sender: 'ai',
          timestamp: new Date()
        }]);

        setTimeout(() => setShowChat(false), 3000);
        return;
      }
    }

    // Handle brand contact form submission
    if (userType === 'brand' && currentStep === 'contactInfo') {
      const brandData = {
        formType: 'brand',
        submissionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userInfo: {
          name: response.name,
          email: response.email,
          phone: response.phone,
          company: response.company
        },
        consultationData: {
          marketingGoals: consultationData.marketingGoals || '',
          influencerType: consultationData.influencerType || '',
          platforms: consultationData.platforms || '',
          budget: consultationData.budget || '',
          industry: consultationData.industry || ''
        }
      };

      // Send data to webhook
      try {
        fetch('https://hook.us2.make.com/jayb11t4hduccicghts2e351t2wf1bvi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brandData)
        });
      } catch (error) {
        console.error('Error sending data:', error);
      }

      // Show thank you message and close
      setMessages(prev => [...prev, {
        text: "Thank you for sharing your information! Our team will be in touch within 24 hours to discuss your custom influencer marketing strategy. Have a great day! 🐝✨",
        sender: 'ai',
        timestamp: new Date()
      }]);

      setTimeout(() => setShowChat(false), 3000);
      return;
    }

    // Continue with next question
    const nextStep = getNextStep(currentStep, userType);
    if (nextStep) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: getCurrentFlow()[nextStep]?.message || '',
          sender: 'ai',
          timestamp: new Date()
        }]);
        setCurrentStep(nextStep);
      }, 500);
    }
  };

  // Update the getNextStep function to handle all steps
  const getNextStep = (currentStep: ConsultationStep, userType: UserType): ConsultationStep | null => {
    const steps = {
      creator: {
        introduction: 'contentType',
        contentType: 'platforms',
        platforms: 'audienceSize',
        audienceSize: 'brandExperience',
        brandExperience: 'goals',
        goals: 'confirmation'
      },
      brand: {
        introduction: 'marketingGoals',
        marketingGoals: 'influencerType',
        influencerType: 'platforms',
        platforms: 'budget',
        budget: 'industry',
        industry: 'confirmation'
      }
    };

    return userType === 'creator' 
      ? steps.creator[currentStep as keyof typeof steps.creator] 
      : steps.brand[currentStep as keyof typeof steps.brand];
  };

  // Update the chat interface to use the appropriate flow based on user type
  const getCurrentFlow = () => {
    return userType === 'creator' ? creatorConsultationFlow : consultationFlow;
  };

  // Add a new function to handle brand contact form submission
  const handleBrandContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    // Get form values
    const contactInfo = {
      name: formData.get('fullname') as string,
      email: formData.get('emailaddress') as string,
      phone: formData.get('phonenumber') as string,
      company: formData.get('companyname') as string
    };

    // Prepare final brand data
    const brandData = {
      formType: 'brand',
      submissionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userInfo: contactInfo,
      consultationData: {
        marketingGoals: consultationData.marketingGoals || '',
        influencerType: consultationData.influencerType || '',
        platforms: consultationData.platforms || '',
        budget: consultationData.budget || '',
        industry: consultationData.industry || ''
      }
    };

    // Send data to webhook
    try {
      fetch('https://hook.us2.make.com/jayb11t4hduccicghts2e351t2wf1bvi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData)
      });
    } catch (error) {
      console.error('Error sending data:', error);
    }

    // Show thank you message
    setMessages(prev => [...prev, {
      text: "Thank you for sharing your information! Our team will be in touch within 24 hours to discuss your custom influencer marketing strategy. Have a great day! 🐝✨",
      sender: 'ai',
      timestamp: new Date()
    }]);

    // Close chat after delay
    setTimeout(() => {
      setShowChat(false);
      setCurrentStep('introduction');
    }, 3000);
  };

  // Update the Trusted By section
  const TrustedBySection = () => {
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
      const animate = () => {
        setScrollPosition(prev => {
          // Create continuous smooth scrolling
          const newPosition = prev + 0.1; // Adjust speed by changing this value
          // Reset position when all brands have scrolled
          return newPosition >= (trustedBrands.length * 100) ? 0 : newPosition;
        });
        requestAnimationFrame(animate);
      };

      const animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
  }, []);

    return (
      <div className="bg-[#1b1661] py-16 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1b1661] via-transparent to-[#1b1661] z-10"></div>
        <h3 className="text-center text-[#f5f4f4] text-2xl mb-12 animate-on-scroll font-bold">
          Trusted by Leading Brands
        </h3>
        <div className="max-w-6xl mx-auto relative">
          <div 
            className="flex gap-8 transition-transform duration-300 ease-linear"
            style={{ 
              transform: `translateX(-${scrollPosition}%)`,
            }}
          >
            {[...trustedBrands, ...trustedBrands, ...trustedBrands, ...trustedBrands].map((brand, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-1/3 bg-white/5 backdrop-blur-md px-6 md:px-12 py-4 md:py-8 
                  rounded-xl border border-white/10 shadow-lg hover:shadow-xl 
                  transition-all duration-300 hover:border-white/20 
                  flex items-center justify-center"
              >
                <img 
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="w-24 h-12 md:w-32 md:h-16 object-contain 
                    filter brightness-0 invert opacity-90 
                    hover:opacity-100 transition-all duration-300 
                    transform hover:scale-105"
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen min-h-[100svh] bg-gradient-to-br from-[#26208a] via-[#312AB3] to-[#f34e02] overflow-x-hidden relative"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <header 
        className="fixed left-0 w-full z-50 transition-all duration-300" 
        style={{ 
          backgroundColor: `rgba(38, 32, 138, ${Math.min(scrollY / 500, 0.95)})`,
          backdropFilter: `blur(${Math.min(scrollY / 100, 10)}px)`,
          top: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4 md:p-6">
          <button 
            onClick={() => {
              // Reset all states
              setShowForm(false);
              setUserType(null);
              setShowChat(false);
              setMessages([]);
              setCurrentStep('introduction');
              setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                industry: '',
                previousInfluencerExperience: '',
                currentMarketingChannels: '',
                budget: '',
                campaignGoals: '',
                targetAudience: '',
                creatorPreferences: '',
                preferredContentTypes: '',
                brandValues: '',
                niche: '',
                platforms: '',
                followers: '',
                engagementRate: '',
                contentTypes: '',
                socialHandles: ''
              });
              // Scroll to top and reload page
              window.scrollTo({ top: 0, behavior: 'smooth' });
              window.location.reload();
            }}
            className="logo block relative group cursor-pointer"
            aria-label="notmrw - click to refresh"
          >
            <img 
              src="/images/notmrw-logo.png"
              alt="Notmrw Creatives"
              className="h-[140px] md:h-[160px] w-auto transform hover:scale-105 transition-all duration-300"
              loading="eager"
              style={{
                objectFit: 'contain',
                maxWidth: '100%',
                display: 'block'
              }}
            />
          </button>
        </div>
      </header>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-md p-8 max-w-2xl w-full border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {userType === 'creator' ? 'Creator Application' : 'Brand Information'}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setUserType(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={userType === 'creator' ? handleCreatorFormSubmit : handleFormSubmit}>
              <div className="space-y-4 mb-6">
                  <input
                    type="text"
                  placeholder="Full Name *"
                    value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:border-[#fd6d2b] transition-colors"
                  />
                  <input
                    type="email"
                  placeholder="Email Address *"
                    value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:border-[#fd6d2b] transition-colors"
                  />
                {userType === 'creator' && (
                <>
                    <input
                      type="tel"
                      placeholder="Phone Number (Optional)"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:border-[#fd6d2b] transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Social Media Handles (e.g., @username) *"
                      value={formData.socialHandles}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialHandles: e.target.value }))}
                      required
                      className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:border-[#fd6d2b] transition-colors"
                    />
                    <select
                      value={formData.followers}
                      onChange={(e) => setFormData(prev => ({ ...prev, followers: e.target.value }))}
                      required
                      className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:border-[#fd6d2b] transition-colors"
                    >
                      <option value="">Total Followers Across All Platforms *</option>
                      <option value="1k-10k">1,000 - 10,000</option>
                      <option value="10k-50k">10,000 - 50,000</option>
                      <option value="50k-100k">50,000 - 100,000</option>
                      <option value="100k-500k">100,000 - 500,000</option>
                      <option value="500k-1m">500,000 - 1,000,000</option>
                      <option value="1m+">1,000,000+</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Primary Platform (e.g., TikTok, Instagram) *"
                      value={formData.platforms}
                      onChange={(e) => setFormData(prev => ({ ...prev, platforms: e.target.value }))}
                      required
                      className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:border-[#fd6d2b] transition-colors"
                    />
                </>
              )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#f34e02] hover:bg-[#fd6d2b] text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transform hover:scale-105 transition-all duration-300"
              >
                {userType === 'creator' ? 'Continue to AI Consultation' : 'Submit'} <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="min-h-[100svh] w-full relative overflow-hidden flex items-center justify-center"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="absolute inset-0 bg-[#26208a]/30 backdrop-blur-sm"
             style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto text-center animate-on-scroll px-4 pt-[80px] md:pt-0">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-on-scroll">
            AI-Powered Creator Marketing
            <span className="block text-[#fd6d2b]">That Delivers Results</span>
          </h1>
          <p className="text-xl text-[#f5f4f4] mb-8 max-w-2xl mx-auto animate-on-scroll">
            Connect with our roster of 10,000+ creators through intelligent AI matching, 
            managed by dedicated campaign experts.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-on-scroll">
            <button 
              onClick={() => handleGetStarted('brand')}
              className="bg-[#f34e02] hover:bg-[#fd6d2b] text-white px-8 py-3 rounded-full flex items-center gap-2 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Brand Consultation <Bot size={20} />
            </button>
            <button 
              onClick={() => handleGetStarted('creator')}
              className="bg-[#f5f4f4]/10 hover:bg-[#f5f4f4]/20 text-white px-8 py-3 rounded-full flex items-center gap-2 backdrop-blur-sm border border-white/20 transform hover:scale-105 transition-all duration-300"
            >
              Join Our Creators <Users size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <TrustedBySection />

      {/* Gallery Section */}
      <div className="py-24 px-4" ref={galleryRef}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-12 text-center animate-on-scroll">
            Content Gallery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {galleryImages.map((imageUrl, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedImage(imageUrl)}
                className="animate-on-scroll gallery-item group relative overflow-hidden rounded-md aspect-square bg-black/50 backdrop-blur-[10px] border border-white/20 shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
              >
                <img 
                  src={imageUrl}
                  alt={`TikTok Shopping Week ${i + 1}`}
                  className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm">View full image</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for full-size images */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-[#fd6d2b] transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size view"
            className="max-w-full max-h-[90vh] object-contain rounded-md"
          />
        </div>
      )}

      {/* Events Section */}
      <div className="py-24 px-4 bg-white/5 backdrop-blur-[10px] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-12 text-center animate-on-scroll">Upcoming Events</h2>
          <div className="grid grid-cols-1 gap-8 mt-16">
            {events.map((event, index) => (
              <div
                key={index}
                onClick={() => handleEventClick(event.link, event.type)}
                className="animate-on-scroll relative bg-[rgba(255,255,255,0.1)] backdrop-blur-md rounded-md overflow-hidden 
                  group cursor-pointer border border-white/20 shadow-lg
                  transform transition-all duration-500 ease-out
                  hover:bg-[rgba(255,255,255,0.15)] hover:scale-[1.02] hover:shadow-2xl
                  hover:border-[#fd6d2b]/30"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <div className="p-6 bg-transparent
                  transform transition-all duration-500 ease-out
                  group-hover:bg-[rgba(255,255,255,0.05)]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="transform transition-all duration-300 group-hover:translate-x-1">
                      <h3 className="text-xl font-semibold text-white group-hover:text-[#fd6d2b] transition-colors duration-300">
                        {event.title}
                      </h3>
                      <p className="text-[#fd6d2b] transition-opacity duration-300 group-hover:opacity-90">
                        {event.date}
                      </p>
                    </div>
                    <Calendar className="text-[#f34e02] transform transition-all duration-500 
                      group-hover:scale-110 group-hover:rotate-12" />
                  </div>
                  <p className="text-[#f5f4f4] mb-4 transition-all duration-300 group-hover:translate-x-1">
                    {event.location}
                  </p>
                  <p className="text-[#f5f4f4]/80 mb-4 transition-all duration-300 group-hover:text-[#f5f4f4] group-hover:translate-x-1">
                    {event.description}
                  </p>
                  <button 
                    className="flex items-center gap-2 text-[#fd6d2b] transition-all duration-300 
                      group-hover:text-[#f34e02] group-hover:translate-x-2"
                    onClick={(e) => handleLearnMore(e, index)}
                  >
                    Learn more 
                    <ChevronRight size={16} className="transform transition-all duration-500 
                      group-hover:translate-x-1 group-hover:scale-110" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Extended Info Modal */}
      {showExtendedInfo !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-md p-8 max-w-2xl w-full border border-white/20 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{events[showExtendedInfo].title}</h2>
              <button 
                onClick={() => setShowExtendedInfo(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Event Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#fd6d2b]">
                  <Calendar size={20} />
                  <p>{events[showExtendedInfo].date}</p>
                </div>
                <p className="text-[#f5f4f4]">{events[showExtendedInfo].location}</p>
                
                {/* Event Description */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-[#f5f4f4]/80 whitespace-pre-line">
                    {events[showExtendedInfo].extendedInfo}
                  </div>
                </div>

                {/* Requirements Section */}
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Requirements</h3>
                  <ul className="list-disc list-inside text-[#f5f4f4]/80 space-y-2">
                    {events[showExtendedInfo].type === 'makeup' ? [
                      "Active presence in beauty/cosmetics niche",
                      "Minimum 10k followers on primary platform",
                      "Previous experience with beauty brands",
                      "Professional camera equipment"
                    ] : events[showExtendedInfo].type === 'coachella' ? [
                      "Minimum 50k followers across platforms",
                      "Experience with live event coverage",
                      "Ability to create daily content during the event",
                      "Strong engagement metrics"
                    ] : [
                      "Innovative content creation style",
                      "Minimum 25k followers on primary platform",
                      "Proven track record of brand collaborations",
                      "Willingness to participate in community events"
                    ].map(req => (
                      <li key={req} className="text-[#f5f4f4]/80">{req}</li>
                    ))}
                  </ul>
                </div>

                {/* What You'll Get Section */}
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">What You'll Get</h3>
                  <ul className="list-disc list-inside text-[#f5f4f4]/80 space-y-2">
                    {events[showExtendedInfo].type === 'makeup' ? [
                      "Exclusive access to new product launches",
                      "Networking with beauty industry leaders",
                      "Professional content creation opportunities",
                      "Brand partnership possibilities"
                    ] : events[showExtendedInfo].type === 'coachella' ? [
                      "Free accommodation during Coachella",
                      "Exclusive party access",
                      "Brand collaboration opportunities",
                      "Professional content support"
                    ] : [
                      "Founding member status",
                      "Priority access to future events",
                      "Exclusive networking opportunities",
                      "Access to state-of-the-art equipment"
                    ].map(benefit => (
                      <li key={benefit} className="text-[#f5f4f4]/80">{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Registration Button */}
              <button
                onClick={() => handleEventRegistration(events[showExtendedInfo].type)}
                className="w-full mt-8 bg-[#f34e02] hover:bg-[#fd6d2b] text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transform hover:scale-105 transition-all duration-300"
              >
                Register Now <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Matching Section */}
      <div className="py-24 px-4 bg-gradient-to-b from-[#1b1661] to-[#26208a] relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-[url('https://source.unsplash.com/random/1920x1080?technology')] opacity-10 bg-cover bg-center"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        ></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#f34e02]/10 text-[#fd6d2b] px-4 py-2 rounded-full mb-6 animate-on-scroll">
            <Sparkles size={16} />
            AI-Powered Matching
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 animate-on-scroll">Personal Campaign Management</h2>
          <p className="text-xl text-[#f5f4f4]/80 max-w-2xl mx-auto animate-on-scroll">
            Our AI matches you with the perfect creators, while your dedicated campaign manager
            ensures flawless execution and maximum ROI.
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-md p-8 max-w-2xl w-full border border-white/20 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">AI Consultation</h2>
              <button 
                onClick={() => {
                  setShowChat(false);
                  setCurrentStep('introduction');
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div ref={chatRef} className="flex-1 overflow-y-auto mb-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'ai' && (
                    <span className="mr-2 self-end mb-2">🐝</span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-[#f34e02] text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Only show input field if not an event registration */}
            {!isEventChat && (
              <div className="chat-interface">
                {currentStep !== 'contactInfo' ? (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {getCurrentFlow()[currentStep].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleConsultationResponse(option)}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleBrandContactSubmit} className="space-y-4 mt-4">
                    {getCurrentFlow().contactInfo.fields.map((field, index) => (
                      <input
                        key={index}
                        name={field.toLowerCase().replace(/\s+/g, '')}
                        type={field.includes('Email') ? 'email' : 'text'}
                        placeholder={field}
                        className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white"
                        required
                      />
                    ))}
                    <button
                      type="submit"
                      className="w-full bg-[#f34e02] hover:bg-[#fd6d2b] text-white px-4 py-2 rounded-md"
                    >
                      Submit
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;