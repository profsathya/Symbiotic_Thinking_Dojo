import { TopicConfig, TopicCategory } from '../types';
import { SYMBIOTIC_THINKING_TOPIC } from './symbiotic-thinking';
import { CST395_TOPIC, CST349_TOPIC } from './course-topics';
import { INTRODUCTORY_PROGRAMMING_TOPIC } from './introductory-programming';
import { IKIGAI_TOPIC } from './ikigai';

// All available topics
export const ALL_TOPICS: TopicConfig[] = [
  SYMBIOTIC_THINKING_TOPIC,
  IKIGAI_TOPIC,
  CST395_TOPIC,
  CST349_TOPIC,
  INTRODUCTORY_PROGRAMMING_TOPIC,
];

// Get only enabled topics
export const ENABLED_TOPICS = ALL_TOPICS.filter(t => t.enabled);

// Get topics by category
export function getTopicsByCategory(category: TopicCategory): TopicConfig[] {
  return ALL_TOPICS.filter(t => t.category === category);
}

// Get a specific topic by ID
export function getTopicById(topicId: string): TopicConfig | undefined {
  return ALL_TOPICS.find(t => t.topicId === topicId);
}

// Get topics organized by category for display
export interface TopicsByCategory {
  foundations: TopicConfig[];
  course: TopicConfig[];
  general: TopicConfig[];
}

export function getTopicsOrganizedByCategory(): TopicsByCategory {
  return {
    foundations: ALL_TOPICS.filter(t => t.category === 'foundations'),
    course: ALL_TOPICS.filter(t => t.category === 'course'),
    general: ALL_TOPICS.filter(t => t.category === 'general'),
  };
}

// Re-export individual topics
export { SYMBIOTIC_THINKING_TOPIC } from './symbiotic-thinking';
export { IKIGAI_TOPIC } from './ikigai';
export { CST395_TOPIC, CST349_TOPIC } from './course-topics';
export { INTRODUCTORY_PROGRAMMING_TOPIC } from './introductory-programming';
