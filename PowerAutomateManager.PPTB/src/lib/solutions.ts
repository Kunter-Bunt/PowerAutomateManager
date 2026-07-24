export const DEFAULT_SOLUTION_UNIQUE_NAME = 'Default';

/** True for the environment's Default solution, matched by language-independent unique name. */
export function isDefaultSolution(uniqueName: string): boolean {
  return uniqueName === DEFAULT_SOLUTION_UNIQUE_NAME;
}
