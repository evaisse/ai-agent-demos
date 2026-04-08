import { loadAvailableModels } from '../core/openrouter-models.js';

export async function listModelsCommand(options) {
  const models = await loadAvailableModels(process.cwd());
  const filtered = options.provider
    ? models.filter((model) => model.id.startsWith(`${options.provider}/`))
    : models;

  const payload = filtered.map((model) => ({
    id: model.id,
    name: model.name,
    contextLength: model.context_length,
    pricing: model.pricing,
  }));

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (payload.length === 0) {
    console.log('No cached OpenRouter models found. Run the existing model sync first or add openrouter-models.json.');
    return;
  }

  payload.forEach((model) => {
    console.log(model.id);
    if (model.name) {
      console.log(`  Name: ${model.name}`);
    }
    if (model.contextLength) {
      console.log(`  Context: ${model.contextLength}`);
    }
  });
}
