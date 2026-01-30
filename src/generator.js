import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Handlebars from 'handlebars';

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  return `${day} ${month}`;
});

Handlebars.registerHelper('lowercase', function(str) {
  return str ? str.toLowerCase() : '';
});

/**
 * Load and parse a YAML file
 */
export function loadYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Load a Handlebars template
 */
export function loadTemplate(templateName) {
  const templatePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
  const content = fs.readFileSync(templatePath, 'utf8');
  return Handlebars.compile(content);
}

/**
 * Ensure output directory exists
 */
export function ensureOutputDir(eventName) {
  const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const outputDir = path.join(process.cwd(), 'outputs', slug);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

/**
 * Generate a single output file from a template
 */
export function generateOutput(templateName, eventData, outputDir) {
  const template = loadTemplate(templateName);
  const output = template(eventData);

  const outputPath = path.join(outputDir, `${templateName}.md`);
  fs.writeFileSync(outputPath, output);

  return outputPath;
}

/**
 * Main generation function
 */
export function generate(eventPath, options = {}) {
  // Load event data
  const eventData = loadYaml(eventPath);

  // Load brand profile
  const gravityPath = path.join(process.cwd(), 'gravity.yaml');
  const brandProfile = loadYaml(gravityPath);

  // Merge brand profile with event data (event data takes precedence)
  const context = {
    ...brandProfile,
    ...eventData,
    brand: brandProfile
  };

  // Create output directory
  const outputDir = ensureOutputDir(eventData.name);

  // Get list of templates to generate
  const templatesDir = path.join(process.cwd(), 'templates');
  const templates = fs.readdirSync(templatesDir)
    .filter(f => f.endsWith('.hbs'))
    .map(f => f.replace('.hbs', ''));

  // Generate each template
  const generated = [];
  for (const templateName of templates) {
    try {
      const outputPath = generateOutput(templateName, context, outputDir);
      generated.push({ template: templateName, path: outputPath });
      console.log(`  ✓ ${templateName}.md`);
    } catch (err) {
      console.error(`  ✗ ${templateName}: ${err.message}`);
    }
  }

  return { outputDir, generated };
}
