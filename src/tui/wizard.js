import path from 'path';
import { select, search, input, confirm } from '@inquirer/prompts';

export async function promptForMissingRunConfig(partialConfig, context) {
  const answers = {};

  if (!partialConfig.casePaths || partialConfig.casePaths.length === 0) {
    const selectedCase = await select({
      message: 'Select benchmark case',
      choices: context.availableCases.map((entry) => ({
        name: `${entry.suite}/${entry.id} - ${entry.title}`,
        value: entry.casePath,
      })),
    });
    answers.cases = [selectedCase];
  }

  if (!partialConfig.modelIds || partialConfig.modelIds.length === 0) {
    const selectedModel = await search({
      message: 'Select OpenRouter model',
      source: async (term) => {
        const normalized = (term || '').toLowerCase();
        return context.availableModels
          .filter((model) => !normalized || model.id.toLowerCase().includes(normalized) || (model.name || '').toLowerCase().includes(normalized))
          .slice(0, 25)
          .map((model) => ({
            name: model.name ? `${model.id} - ${model.name}` : model.id,
            value: model.id,
          }));
      },
    });
    answers.models = [selectedModel];
  }

  if (!partialConfig.openrouterKeyEnv && !partialConfig.openrouterKey) {
    answers.openrouterKeyEnv = await input({
      message: 'OpenRouter API key environment variable',
      default: 'OPENROUTER_API_KEY',
    });
  }

  if (!partialConfig.timeoutSeconds) {
    answers.timeout = await input({
      message: 'Timeout in seconds',
      default: '900',
    });
  }

  if (!partialConfig.maxTurns) {
    answers.maxTurns = await input({
      message: 'Maximum agent turns',
      default: '12',
    });
  }

  if (!partialConfig.parallel) {
    answers.parallel = await confirm({
      message: 'Run in parallel?',
      default: false,
    });
  }

  if (answers.parallel || partialConfig.parallel) {
    answers.concurrency = await input({
      message: 'Parallel concurrency',
      default: String(partialConfig.concurrency || 2),
    });
  }

  answers.commit = await confirm({
    message: 'Offer commit after successful runs?',
    default: false,
  });

  return answers;
}
