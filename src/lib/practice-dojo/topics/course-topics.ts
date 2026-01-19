import { TopicConfig } from '../types';

// Course overview topics - Coming Soon placeholders
// These will be fully implemented when course content is provided

export const CST395_TOPIC: TopicConfig = {
  topicId: 'course-cst395-overview',
  title: 'CST395: AI-Native Solution Engineering',
  description: 'Course overview and engagement guide',
  estimatedTime: '15-20 minutes',
  category: 'course',
  courseCode: 'CST395',
  enabled: false, // Coming soon
  icon: '📚',

  pathways: [
    {
      id: 'guided',
      title: 'Full Overview',
      description: 'Complete course introduction',
      icon: '🎯',
      estimatedTime: '15-20 min',
    },
    {
      id: 'quick',
      title: 'Quick Start',
      description: 'Essential info to get started',
      icon: '⚡',
      estimatedTime: '5-10 min',
    },
    {
      id: 'test',
      title: 'Q&A Only',
      description: 'Ask your questions',
      icon: '🔍',
      estimatedTime: 'varies',
    },
  ],

  phases: [
    {
      phaseId: 0,
      title: 'Welcome',
      purpose: 'Brief orientation',
      hasCheckpoint: false,
      contentGuidance: 'Welcome to CST395 overview. Coming soon.',
    },
    {
      phaseId: 1,
      title: 'What is this course about?',
      purpose: 'Core purpose',
      hasCheckpoint: true,
      contentGuidance: 'Explore what AI-Native Solution Engineering means. Coming soon.',
      checkpointCriteria: 'Can articulate the core purpose of the course.',
    },
    {
      phaseId: 2,
      title: 'What will you be able to do?',
      purpose: 'Concrete outcomes',
      hasCheckpoint: true,
      contentGuidance: 'Learning objectives and capabilities. Coming soon.',
      checkpointCriteria: 'Can identify key skills they will develop.',
    },
    {
      phaseId: 3,
      title: 'How is it structured?',
      purpose: 'Navigate the design',
      hasCheckpoint: false,
      contentGuidance: 'Course structure and schedule. Coming soon.',
    },
    {
      phaseId: 4,
      title: 'How should you engage?',
      purpose: 'Expectations for success',
      hasCheckpoint: true,
      contentGuidance: 'Engagement expectations and strategies. Coming soon.',
      checkpointCriteria: 'Commits to specific engagement practices.',
    },
    {
      phaseId: 5,
      title: 'Your questions',
      purpose: 'Open Q&A',
      hasCheckpoint: false,
      contentGuidance: 'Answer student questions about the course.',
    },
    {
      phaseId: 6,
      title: 'Your commitment',
      purpose: 'Personal investment',
      hasCheckpoint: false,
      contentGuidance: 'Help student articulate their commitment to the course.',
    },
  ],

  courseContent: {
    syllabus: 'Course syllabus content will be added here.',
    learningObjectives: [
      'Understand AI-native development principles',
      'Build solutions that leverage AI capabilities',
      'Apply symbiotic thinking to engineering problems',
    ],
    schedule: 'Course schedule will be added here.',
  },
};

export const CST349_TOPIC: TopicConfig = {
  topicId: 'course-cst349-overview',
  title: 'CST349: CS Professional Seminar',
  description: 'Course overview and engagement guide',
  estimatedTime: '15-20 minutes',
  category: 'course',
  courseCode: 'CST349',
  enabled: false, // Coming soon
  icon: '📚',

  pathways: [
    {
      id: 'guided',
      title: 'Full Overview',
      description: 'Complete course introduction',
      icon: '🎯',
      estimatedTime: '15-20 min',
    },
    {
      id: 'quick',
      title: 'Quick Start',
      description: 'Essential info to get started',
      icon: '⚡',
      estimatedTime: '5-10 min',
    },
    {
      id: 'test',
      title: 'Q&A Only',
      description: 'Ask your questions',
      icon: '🔍',
      estimatedTime: 'varies',
    },
  ],

  phases: [
    {
      phaseId: 0,
      title: 'Welcome',
      purpose: 'Brief orientation',
      hasCheckpoint: false,
      contentGuidance: 'Welcome to CST349 overview. Coming soon.',
    },
    {
      phaseId: 1,
      title: 'What is this course about?',
      purpose: 'Core purpose',
      hasCheckpoint: true,
      contentGuidance: 'Explore the professional seminar purpose. Coming soon.',
      checkpointCriteria: 'Can articulate the core purpose of the course.',
    },
    {
      phaseId: 2,
      title: 'What will you be able to do?',
      purpose: 'Concrete outcomes',
      hasCheckpoint: true,
      contentGuidance: 'Professional skills and capabilities. Coming soon.',
      checkpointCriteria: 'Can identify key professional skills they will develop.',
    },
    {
      phaseId: 3,
      title: 'How is it structured?',
      purpose: 'Navigate the design',
      hasCheckpoint: false,
      contentGuidance: 'Course structure and schedule. Coming soon.',
    },
    {
      phaseId: 4,
      title: 'How should you engage?',
      purpose: 'Expectations for success',
      hasCheckpoint: true,
      contentGuidance: 'Professional engagement expectations. Coming soon.',
      checkpointCriteria: 'Commits to specific professional practices.',
    },
    {
      phaseId: 5,
      title: 'Your questions',
      purpose: 'Open Q&A',
      hasCheckpoint: false,
      contentGuidance: 'Answer student questions about the course.',
    },
    {
      phaseId: 6,
      title: 'Your commitment',
      purpose: 'Personal investment',
      hasCheckpoint: false,
      contentGuidance: 'Help student articulate their professional commitment.',
    },
  ],

  courseContent: {
    syllabus: 'Course syllabus content will be added here.',
    learningObjectives: [
      'Develop professional communication skills',
      'Understand industry expectations and practices',
      'Build a professional identity in computer science',
    ],
    schedule: 'Course schedule will be added here.',
  },
};

// Placeholder for general subjects
export const GENERAL_SUBJECTS_PLACEHOLDER: TopicConfig = {
  topicId: 'general-subjects',
  title: 'General Subjects',
  description: 'Coming soon...',
  estimatedTime: '--',
  category: 'general',
  enabled: false,
  icon: '📖',
  pathways: [],
  phases: [],
};
