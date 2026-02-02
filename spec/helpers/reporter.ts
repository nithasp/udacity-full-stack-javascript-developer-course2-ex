import { SpecReporter, StacktraceOption } from 'jasmine-spec-reporter';

// Clear default reporter and add spec reporter for better test output
jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(
  new SpecReporter({
    spec: {
      displayStacktrace: StacktraceOption.PRETTY,
      displaySuccessful: true,
      displayFailed: true,
    },
    colors: {
      enabled: true,
    },
    prefixes: {
      successful: '  ✓ ',
      failed: '  ✗ ',
    },
  })
);
