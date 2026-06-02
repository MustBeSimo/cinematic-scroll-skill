import {Config} from '@remotion/cli/config';

// Encoding is mostly controlled by CLI flags in package.json scripts.
// These are the stable, render-wide defaults.
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(null); // let Remotion pick based on the host CPU
