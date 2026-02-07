import { SpecReporter, StacktraceOption } from 'jasmine-spec-reporter';

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(
  new SpecReporter({
    spec: {
      displayStacktrace: StacktraceOption.PRETTY,
      displaySuccessful: true,
      displayFailed: true,
    },
    colors: { enabled: true },
    prefixes: {
      successful: '  ✓ ',
      failed: '  ✗ ',
    },
  })
);
