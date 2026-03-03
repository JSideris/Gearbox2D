
/**
 * A Vite plugin that automatically extracts the source code of onInit and onTick 
 * functions in example files and attaches them as raw strings.
 * This prevents them from being minified in the example code display.
 */
export default function rawExamplesPlugin() {
  return {
    name: 'raw-examples',
    enforce: 'pre',
    transform(code, id) {
      // Only target the example files in categories and showcase
      if (!id.includes('site/examples/') || id.includes('engine-wrapper.ts') || !id.endsWith('.ts')) {
        return null;
      }

      const targets = ['onInit', 'onTick'];
      const matches = [];
      
      for (const target of targets) {
        // More robust regex to match:
        // 1. target: (args) => {
        // 2. target: function(args) {
        // 3. target(args) { (shorthand)
        const regex = new RegExp(`(${target}\\s*:\\s*|${target}\\s*(?=\\())`, 'g');
        
        let match;
        while ((match = regex.exec(code)) !== null) {
          const propStart = match.index;
          const valueStart = match.index + match[0].length;
          
          // Check if we are actually at a function start
          const remaining = code.substring(valueStart);
          const trimmedRemaining = remaining.trimStart();
          if (!trimmedRemaining.startsWith('(') && !trimmedRemaining.startsWith('function')) {
            continue;
          }

          // Find the end of this value by matching braces
          let braceCount = 0;
          let started = false;
          let valueEnd = -1;
          
          for (let i = valueStart; i < code.length; i++) {
            const char = code[i];
            if (char === '{') {
              braceCount++;
              started = true;
            } else if (char === '}') {
              braceCount--;
            }
            
            if (started && braceCount === 0) {
              valueEnd = i + 1;
              break;
            }
          }
          
          if (valueEnd !== -1) {
            const rawSource = code.substring(valueStart, valueEnd);
            matches.push({
              index: propStart,
              target: target,
              rawSource: rawSource
            });
          }
        }
      }

      if (matches.length === 0) return null;

      // Sort matches by index descending to replace from back to front
      matches.sort((a, b) => b.index - a.index);

      let newCode = code;
      for (const match of matches) {
        const injection = `${match.target}Raw: ${JSON.stringify(match.rawSource)}, `;
        newCode = newCode.substring(0, match.index) + 
                  injection + 
                  newCode.substring(match.index);
      }

      return {
        code: newCode,
        map: null
      };
    }
  };
}
