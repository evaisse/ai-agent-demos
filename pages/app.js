// State
const state = {
  demos: [],
  loading: false,
  error: null,
  currentDemo: null,
  currentModel: null,
  sidebarOpen: false,
  settingsOpen: false,
};

const isMobile = () => window.innerWidth <= 768;
const escapeHtml = (t) => {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
};

const calculateRankings = () => {
  if (!state.currentDemo || !state.currentModel) return {};
  const metrics = { tokens: [], duration: [], cost: [], context: [] };
  state.currentDemo.models.forEach((mo) => {
    if (mo.results) {
      metrics.tokens.push({ model: mo.name, value: mo.results.tokens?.total_tokens || 0 });
      metrics.duration.push({ model: mo.name, value: parseFloat(mo.results.execution?.duration_seconds) || 0 });
      metrics.cost.push({ model: mo.name, value: mo.results.cost?.total_cost || 0 });
      metrics.context.push({ model: mo.name, value: mo.results.model_card?.context_length || 0 });
    }
  });
  const rankings = {};
  ['tokens', 'duration', 'cost'].forEach((k) => {
    metrics[k].sort((a, b) => a.value - b.value);
    const r = metrics[k].findIndex((x) => x.model === state.currentModel.name) + 1;
    rankings[k] = { rank: r, total: metrics[k].length };
  });
  metrics.context.sort((a, b) => b.value - a.value);
  const cr = metrics.context.findIndex((x) => x.model === state.currentModel.name) + 1;
  rankings.context = { rank: cr, total: metrics.context.length };
  return rankings;
};

const RankBadge = {
  view: ({ attrs: { ranking } }) => {
    if (!ranking || ranking.total <= 1) return null;
    let cls = 'metric-rank';
    const ratio = ranking.rank / ranking.total;
    if (ranking.rank === 1) cls += ' rank-good';
    else if (ranking.rank === ranking.total) cls += ' rank-bad';
    else if (ratio <= 0.4) cls += ' rank-good';
    else if (ratio >= 0.7) cls += ' rank-bad';
    else cls += ' rank-medium';
    return m('div', { class: cls }, [
      `#${ranking.rank}/${ranking.total}`,
      m(
        'span.rank-visual',
        Array.from({ length: ranking.total }).map((_, i) => m('span.rank-dot' + (i < ranking.rank ? '.filled' : ''))),
      ),
    ]);
  },
};

const loadDemos = () =>
  m
    .request({ method: 'GET', url: './demos.json', type: Object })
    .then((d) => {
      state.demos = d;
      state.error = null;
    })
    .catch((e) => {
      state.error = `Failed to load demos: ${e.message || e}. Make sure to run: npm run generate-viewer`;
    });

const Breadcrumbs = {
  view: () =>
    m('div.breadcrumbs', [
      m(
        'a.breadcrumb-item.breadcrumb-home[title=Home]',
        { href: m.route.prefix + '/', oncreate: m.route.link, onclick: (e) => { e.redraw = false; } },
        '🏠',
      ),
      state.currentDemo && [
        m('span.breadcrumb-separator', '›'),
        m(
          'a.breadcrumb-item.breadcrumb-demo',
          {
            href: `${m.route.prefix}/demo/${encodeURIComponent(state.currentDemo.name)}`,
            oncreate: m.route.link,
            title: `View ${state.currentDemo.title} demo card with all models`,
            onclick: () => {
              setTimeout(() => {
                const el = document.getElementById(`demo-${state.currentDemo.name}`);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            },
          },
          ['🎨 ', state.currentDemo.title],
        ),
        state.currentModel && [
          m('span.breadcrumb-separator', '›'),
          m(
            'span.breadcrumb-item.breadcrumb-model',
            { title: `Model: ${state.currentModel.name}` },
            ['🤖 ', state.currentModel.name],
          ),
        ],
      ],
    ]),
};

const Header = {
  view: () =>
    m('div.header', [
      m(Breadcrumbs),
      m('div.header-actions', [
        m(
          'button.burger-menu[title="Toggle menu"]',
          { onclick: () => { state.settingsOpen = !state.settingsOpen; } },
          '☰',
        ),
        m(
          'button.nav-btn[title="Random demo & model"]',
          {
            disabled: state.demos.length === 0,
            onclick: () => {
              const demos = state.demos;
              if (!demos.length) return;
              const demo = demos[Math.floor(Math.random() * demos.length)];
              if (!demo.models.length) return;
              const model = demo.models[Math.floor(Math.random() * demo.models.length)];
              const [provider, ...rest] = model.name.split('/');
              const modelId = rest.join('/');
              state.currentDemo = demo;
              state.currentModel = model;
              state.sidebarOpen = false;
              m.route.set(`/demo/${encodeURIComponent(demo.name)}/model/${encodeURIComponent(provider)}/${rest.map(encodeURIComponent).join('/')}`);
            },
          },
          '🎲',
        ),
      ]),
    ]),
};

const SecondHeader = {
  view: () => {
    if (!state.currentDemo) return null;
    return m('div.second-header', [
      m('div.second-header-content', [
        m(
          'select.model-selector',
          {
            value: state.currentModel ? state.currentModel.name : '',
            onchange: (e) => {
              const v = e.target.value;
              if (!v) {
                state.currentModel = null;
                state.sidebarOpen = false;
                m.route.set(`/demo/${encodeURIComponent(state.currentDemo.name)}`);
                return;
              }
              const model = state.currentDemo.models.find((mo) => mo.name === v) || null;
              state.currentModel = model;
              const [provider, ...rest] = v.split('/');
              m.route.set(`/demo/${encodeURIComponent(state.currentDemo.name)}/model/${encodeURIComponent(provider)}/${rest.map(encodeURIComponent).join('/')}`);
            },
          },
          [
            m('option[value=""]', 'Select a model...'),
            state.currentDemo.models.map((model) => m('option', { value: model.name }, model.name)),
          ],
        ),
      ]),
      m(
        'button.info-btn',
        {
          disabled: !state.currentModel,
          onclick: () => {
            if (state.currentModel) {
              state.sidebarOpen = true;
            }
          },
        },
        'ℹ️',
      ),
    ]);
  },
};

const DemoGrid = {
  view: () =>
    m('div.no-demo', [
      m('div.no-demo-icon', '🎨'),
      m('h2', 'Select a Demo to Explore'),
      m('p', 'Choose from the available demos and models below:'),
      m(
        'div.demo-grid',
        state.demos.map((demo) =>
          m('div.demo-card', { id: `demo-${demo.name}` }, [
            m('div.demo-card-title', demo.title),
            m('div.demo-card-prompt', demo.prompt),
            m(
              'div.demo-card-models',
              demo.models.map((model) => {
                const [provider, ...rest] = model.name.split('/');
                return m(
                  'a.model-badge',
                  {
                    href: `${m.route.prefix}/demo/${encodeURIComponent(demo.name)}/model/${encodeURIComponent(provider)}/${rest.map(encodeURIComponent).join('/')}`,
                    oncreate: m.route.link,
                    onclick: (e) => { e.redraw = false; },
                  },
                  model.name,
                );
              }),
            ),
          ]),
        ),
      ),
    ]),
};

const Sidebar = {
  view: () => {
    if (!(state.currentDemo && state.currentModel && state.sidebarOpen)) return null;
    const r = state.currentModel.results;
    const ranks = r ? calculateRankings() : null;
    return [
      m('div.sidebar' + (isMobile() ? '.open' : ''), [
        m('div.sidebar-header', [
          m(
            'button.close-btn',
            {
              onclick: () => {
                state.sidebarOpen = false;
              },
            },
            '×',
          ),
          m(
            'select.title-selector',
            {
              value: state.currentDemo ? state.currentDemo.name : '',
              onchange: (e) => {
                const dn = e.target.value;
                const demo = state.demos.find((d) => d.name === dn) || null;
                state.currentDemo = demo;
                state.currentModel = null;
                if (demo) m.route.set(`/demo/${encodeURIComponent(dn)}`);
                else m.route.set('/');
              },
            },
            [
              m('option[value=""]', 'Select Demo...'),
              state.demos.map((d) => m('option', { value: d.name }, d.title)),
            ],
          ),
          m(
            'select.subtitle-selector',
            {
              disabled: !state.currentDemo,
              value: state.currentModel ? state.currentModel.name : '',
              onchange: (e) => {
                const v = e.target.value;
                const model = state.currentDemo.models.find((mo) => mo.name === v) || null;
                state.currentModel = model;
                if (model) {
                  const [provider, ...rest] = v.split('/');
                  m.route.set(`/demo/${encodeURIComponent(state.currentDemo.name)}/model/${encodeURIComponent(provider)}/${rest.map(encodeURIComponent).join('/')}`);
                }
              },
            },
            [
              m('option[value=""]', 'Select Model...'),
              state.currentDemo ? state.currentDemo.models.map((mo) => m('option', { value: mo.name }, mo.name)) : [],
            ],
          ),
        ]),
        m(
          'div.sidebar-content',
          r
            ? [
                m('div.metric-grid', [
                  m('div.metric-card', [
                    m(RankBadge, { ranking: ranks.tokens }),
                    m('div.metric-value', r.tokens?.total_tokens || 'N/A'),
                    m('div.metric-label', 'Total Tokens'),
                  ]),
                  m('div.metric-card', [
                    m(RankBadge, { ranking: ranks.duration }),
                    m('div.metric-value', `${r.execution?.duration_seconds || 'N/A'}s`),
                    m('div.metric-label', 'Duration'),
                  ]),
                  m('div.metric-card', [
                    m(RankBadge, { ranking: ranks.cost }),
                    m('div.metric-value', `$${r.cost?.total_cost?.toFixed(4) || '0.0000'}`),
                    m('div.metric-label', 'Total Cost'),
                  ]),
                  m('div.metric-card', [
                    m(RankBadge, { ranking: ranks.context }),
                    m('div.metric-value', r.model_card?.context_length || 'N/A'),
                    m('div.metric-label', 'Context Length'),
                  ]),
                ]),
                m('div.section', [
                  m('div.section-title', 'Prompt'),
                  m('div.section-content', m.trust(escapeHtml(state.currentDemo.prompt))),
                ]),
                m('div.section', [
                  m('div.section-title', 'Model Information'),
                  m(
                    'div.section-content',
                    m.trust(
                      `<strong>Name:</strong> ${r.model_card?.name || state.currentModel.name}<br><strong>ID:</strong> ${r.model_card?.id || state.currentModel.name}<br><strong>Provider:</strong> ${r.model_card?.top_provider?.name || 'Unknown'}`,
                    ),
                  ),
                ]),
                m('div.section', [
                  m('div.section-title', 'Token Breakdown'),
                  m(
                    'div.section-content',
                    m.trust(
                      `<strong>Prompt Tokens:</strong> ${r.tokens?.prompt_tokens || 0}<br><strong>Completion Tokens:</strong> ${r.tokens?.completion_tokens || 0}<br><strong>Total Tokens:</strong> ${r.tokens?.total_tokens || 0}`,
                    ),
                  ),
                ]),
                m('div.section', [
                  m('div.section-title', 'Cost Breakdown'),
                  m(
                    'div.section-content',
                    m.trust(
                      `<strong>Prompt Cost:</strong> $${r.cost?.prompt_cost?.toFixed(6) || '0.000000'}<br><strong>Completion Cost:</strong> $${r.cost?.completion_cost?.toFixed(6) || '0.000000'}<br><strong>Total Cost:</strong> $${r.cost?.total_cost?.toFixed(6) || '0.000000'}`,
                    ),
                  ),
                ]),
                m('div.section', [
                  m('div.section-title', 'Generation Info'),
                  m(
                    'div.section-content',
                    m.trust(
                      `<strong>Generated:</strong> ${new Date(r.timestamp).toLocaleString()}<br><strong>Duration:</strong> ${r.execution?.duration_seconds || 'N/A'} seconds<br><strong>Temperature:</strong> ${r.request?.temperature || 'N/A'}`,
                    ),
                  ),
                ]),
              ]
            : [
                m('div.section', [
                  m('div.section-title', '📋 Demo Information'),
                  m(
                    'div.section-content',
                    m.trust(
                      `<strong>Demo:</strong> ${state.currentDemo.title}<br><strong>Model:</strong> ${state.currentModel.name}`,
                    ),
                  ),
                ]),
                m('div.section', [
                  m('div.section-title', '📝 Prompt'),
                  m('div.section-content', m.trust(escapeHtml(state.currentDemo.prompt))),
                ]),
                m('div.section', [
                  m('div.section-title', '⚠️ Status'),
                  m(
                    'div.section-content',
                    m.trust(
                      `This model hasn't been generated yet. The demo exists but no AI model has created the HTML output for this specific model.<br><br><strong>To generate this model:</strong><br>Run the CLI command: <code>npm run gen -d ${state.currentDemo.name} -m ${state.currentModel.name}</code>`,
                    ),
                  ),
                ]),
              ],
        ),
      ]),
    ];
  },
};

const SettingsDrawer = {
  view: () => {
    if (!state.settingsOpen) return null;
    return [
      m('div.settings-overlay.show', { onclick: () => { state.settingsOpen = false; } }),
      m('div.settings-drawer.open', [
        m('div.settings-header', [
          m('h2', 'Settings & Info'),
          m('button.close-btn', { onclick: () => { state.settingsOpen = false; } }, '×'),
        ]),
        m('div.settings-content', [
          m('div.settings-section', [
            m('h3', '🚀 Project'),
            m('p', 'AI Demo Generator - Create and manage AI-powered HTML demos'),
            m(
              'a.settings-link[target=_blank][rel="noopener noreferrer"]',
              { href: 'https://github.com/evaisse/ai-agent-demos' },
              ['📂 View on GitHub'],
            ),
          ]),
          m('div.settings-section', [
            m('h3', '💡 Submit a Demo'),
            m('p', 'Have an idea for a new demo? Submit a request!'),
            m(
              'a.settings-link[target=_blank][rel="noopener noreferrer"]',
              { href: 'https://github.com/evaisse/ai-agent-demos/issues/new?template=demo-request.md&title=[Demo%20Request]%20' },
              ['✨ Request New Demo'],
            ),
          ]),
          m('div.settings-section', [
            m('h3', '🔧 Keyboard Shortcuts'),
            m('div', { style: 'color:#4a5568;' }, 'No keyboard shortcuts available'),
          ]),
        ]),
      ]),
    ];
  },
};

const AppLayout = {
  view: ({ children }) => [m(Header), m(SecondHeader), m('div.main-content', children), m(SettingsDrawer)],
};

const HomePage = {
  oninit: () => {
    state.currentDemo = null;
    state.currentModel = null;
    state.sidebarOpen = false;
  },
  view: () => [m(DemoGrid), m(Sidebar)],
};

const DemoPage = {
  oninit: (vnode) => {
    const { demo } = vnode.attrs;
    state.currentDemo = state.demos.find((d) => d.name === demo) || null;
    state.currentModel = null;
    state.sidebarOpen = false;
  },
  view: () => [m(DemoGrid), m(Sidebar)],
};

const ModelPage = {
  oninit: (vnode) => {
    const { demo, provider, model } = vnode.attrs;
    const demoObj = state.demos.find((d) => d.name === demo) || null;
    state.currentDemo = demoObj;
    if (demoObj) {
      const full = `${provider}/${model}`;
      state.currentModel = demoObj.models.find((m) => m.name === full) || null;
      if (!isMobile() && state.currentModel && state.currentModel.results) state.sidebarOpen = true;
      else state.sidebarOpen = false;
    } else {
      state.currentModel = null;
      state.sidebarOpen = false;
    }
  },
  view: () => [
    state.currentModel
      ? m('iframe.demo-frame', {
          src: state.currentModel.htmlPath,
          onload: () => {
            if (!isMobile() && state.currentModel.results) state.sidebarOpen = true;
          },
        })
      : m(DemoGrid),
    m(Sidebar),
  ],
};

const AppLoader = {
  oninit: () => {
    state.loading = true;
    loadDemos().then(() => {
      state.loading = false;
      m.redraw();
    });
  },
  view: (vnode) => {
    if (state.loading) return m('div.loading', '🔄 Loading demos...');
    if (state.error)
      return m('div.error', [
        m('div.error-icon', '⚠️'),
        m('h2', 'Failed to Load Demos'),
        m('p', 'Could not load demos.json. Make sure to run:'),
        m('p', m('code', 'npm run generate-viewer')),
      ]);
    return m(AppLayout, vnode.children);
  },
};

const app = document.getElementById('app');

m.route.prefix = '#!';

m.route(app, '/', {
  '/': { render: () => m(AppLoader, m(HomePage)) },
  '/demo/:demo': { render: (v) => m(AppLoader, m(DemoPage, v.attrs)) },
  '/demo/:demo/model/:provider/:model...': {
    render: (v) => m(AppLoader, m(ModelPage, v.attrs)),
  },
});
