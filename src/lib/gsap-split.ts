// SplitText lives in its own module so only islands that split text (the hero headline) ship it.
import { gsap } from './gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export { SplitText };
