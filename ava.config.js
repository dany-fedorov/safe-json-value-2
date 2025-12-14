// Ava requires configuration file to be a the repository's top-level
// import { fileURLToPath } from 'node:url'

const TESTS_SOURCE = 'tests'
const SNAPSHOT_DIR = `${TESTS_SOURCE}/snapshots/`
const TEST_FILES = `${TESTS_SOURCE}/**/*.test.js`
const NON_TEST_FILES = `${TESTS_SOURCE}/{helpers,fixtures}/**`

// const LOG_PROCESS_ERRORS = fileURLToPath(
//   new URL(
//     `ava-logs/tasks/unit/log_process_errors.js`,
//     import.meta.url,
//   ),
// )

export default {
  files: [TEST_FILES, `!${NON_TEST_FILES}`],
  snapshotDir: SNAPSHOT_DIR,
  // Use `log-process-errors`
  //   require: LOG_PROCESS_ERRORS,
  timeout: '3600s',
  // Ensure reproducible tests.
  // For example, `--enable-source-maps` results in different `error.stack`
  // per environment.
  environmentVariables: { NODE_OPTIONS: '' },
}
