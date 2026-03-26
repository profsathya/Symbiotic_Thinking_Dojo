// Export all default prompts
export { DEFAULT_DOJO_PROMPT } from './dojo';
export { DEFAULT_SENSEI_PROMPT } from './sensei';
export { DEFAULT_IKIGAI_PROMPT } from './ikigai';
export { DEFAULT_CAREER_INTELLIGENCE_PROMPT } from './career-intelligence';
export { DEFAULT_CONSTRUCTS } from './constructs';
export { DEFAULT_PARTNERS } from './partners';

import { DojoConfig } from '../../types';
import { DEFAULT_DOJO_PROMPT } from './dojo';
import { DEFAULT_SENSEI_PROMPT } from './sensei';
import { DEFAULT_IKIGAI_PROMPT } from './ikigai';
import { DEFAULT_CONSTRUCTS } from './constructs';
import { DEFAULT_PARTNERS } from './partners';

// Complete default configuration
export const DEFAULT_DOJO_CONFIG: DojoConfig = {
  dojoPrompt: DEFAULT_DOJO_PROMPT,
  senseiPrompt: DEFAULT_SENSEI_PROMPT,
  ikigaiPrompt: DEFAULT_IKIGAI_PROMPT,
  constructs: DEFAULT_CONSTRUCTS,
  partners: DEFAULT_PARTNERS,
};
