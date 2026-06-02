// Brand fonts, loaded via @remotion/google-fonts.
// The package registers delayRender() internally so frames wait until the
// fonts are ready before rasterizing. Fetched at render time on your machine.
import {loadFont as loadGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadMono} from '@remotion/google-fonts/SpaceMono';
import {loadFont as loadSerif} from '@remotion/google-fonts/CormorantGaramond';

export const grotesk = loadGrotesk().fontFamily;
export const mono = loadMono().fontFamily;
export const serif = loadSerif().fontFamily;
