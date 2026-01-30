#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { generate } from './generator.js';

program
  .name('gravity')
  .description('Generate event communications for Gravity brand')
  .version('1.0.0');

program
  .argument('<event-file>', 'path to event YAML file')
  .option('-t, --template <name>', 'generate only a specific template')
  .action(async (eventFile, options) => {
    const eventPath = path.resolve(eventFile);

    console.log(`\ngenerating from: ${eventFile}\n`);

    try {
      const result = await generate(eventPath, options);
      console.log(`\noutputs saved to: ${result.outputDir}\n`);
    } catch (err) {
      console.error(`\nerror: ${err.message}\n`);
      process.exit(1);
    }
  });

program.parse();
