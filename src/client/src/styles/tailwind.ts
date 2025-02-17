
// Create a constructable stylesheet that will be shared across all instances
const tailwindSheet = new CSSStyleSheet();

// This will be populated when the styles are loaded
let tailwindStyles = '';

// Function to load Tailwind styles
export async function loadTailwindStyles() {
  if (!tailwindStyles) {
    // Get all styles from the document
    const styles = Array.from(document.styleSheets)
      .filter(sheet => {
        try {
          // Filter for Tailwind styles - you might want to adjust this based on your setup
          return sheet.cssRules[0].cssText.includes('@tailwind');
        } catch {
          return false;
        }
      })
      .map(sheet => 
        Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      )
      .join('\n');

    tailwindStyles = styles;
    await tailwindSheet.replace(styles);
  }
  return tailwindSheet;
}

// Function to apply Tailwind styles to a shadow root
export function applyTailwindToShadow(shadowRoot: ShadowRoot) {
  shadowRoot.adoptedStyleSheets = [tailwindSheet];
} 