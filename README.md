# ESlint plugin: await-user-event

[eslint-plugin-testing-library](https://github.com/testing-library/eslint-plugin-testing-library/issues/626) doesn't
[yet](https://github.com/testing-library/eslint-plugin-testing-library/issues/626) have a rule to check all userEvent methods
use await.

This is quite problematic as your tests aren't going to work correctly if you don't await your userEvent calls.

This creates a rule to check all userEvent calls are async.

Note that this rule is quite basic and will not detect calls from `const user = userEvent.setup();`
