/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-pricing-to-disbursement',
      severity: 'error',
      comment: 'NFR-05: the scoring/pricing engine must never call the disbursement adapter directly.',
      from: { path: '^src/modules/pricing' },
      to: { path: '^src/modules/disbursement' },
    },
    {
      name: 'no-eligibility-to-disbursement',
      severity: 'error',
      comment: 'NFR-05: eligibility must never call the disbursement adapter directly.',
      from: { path: '^src/modules/eligibility' },
      to: { path: '^src/modules/disbursement' },
    },
    {
      name: 'no-repository-to-service',
      severity: 'error',
      comment: 'Repository layer never calls a Service (no upward calls).',
      from: { path: '/repository/.*\\.ts$' },
      to: { path: '/service/.*\\.ts$' },
    },
    {
      name: 'no-domain-to-modules',
      severity: 'error',
      comment: 'Domain code is depended on, never depends — it must stay framework/module-free.',
      from: { path: '^src/domain' },
      to: { path: '^src/modules' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
  },
};
