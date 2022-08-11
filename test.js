const rule = require('./await_user_event');
const RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2022 } });

ruleTester.run('await-user-event', rule, {
  valid: [
    {
      code: `
        const userEvent = require('@testing-library/user-event');
        test('click directly waiting with await operator is valid', async () => {
          await userEvent.click();
        });
      `,
    },
    {
      code: `
        const userEvent = require('@testing-library/user-event');
        test('click not waiting with await operator is invalid', async () => {
          const user = userEvent.setup();
        });
      `,
    },
  ],

  invalid: [
    {
      code: `
        const userEvent = require('@testing-library/user-event');
        test('click not waiting with await operator is invalid', async () => {
          userEvent.click();
        });
      `,
      errors: [{ message: 'promise returned from `click` query must be handled' }],
    },
  ]
});
