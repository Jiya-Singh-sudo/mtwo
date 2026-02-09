export function normalizeRangeType(input?: string): string {
  if (!input) {
    throw new Error('rangeType is required');
  }

  switch (input) {
    // Global selector
    case 'Today':
      return 'Daily';

    case 'This Week':
      return 'Weekly';

    case 'This Month':
    case 'Last Month':
      return 'Monthly';

    // Section selector
    case 'Daily':
    case 'Weekly':
    case 'Monthly':
    case 'Custom Range':
      return input;

    default:
      throw new Error(`Unsupported range type: ${input}`);
  }
}
