const { ASTUtils } = require('@typescript-eslint/utils');

const {
  findClosestCallExpressionNode,
  getDeepestIdentifierNode,
  getFunctionName,
  getInnermostReturningFunction,
  getVariableReferences,
  isPromiseHandled,
} = require('eslint-plugin-testing-library/node-utils');

const {
  detectTestingLibraryUtils,
} = require('eslint-plugin-testing-library/create-testing-library-rule/detect-testing-library-utils');

function create(context, _, helpers) {
  const functionWrappersNames = [];

  function detectAsyncQueryWrapper(node) {
    const innerFunction = getInnermostReturningFunction(context, node);
    if (innerFunction) {
      functionWrappersNames.push(getFunctionName(innerFunction));
    }
  }

  return {
    CallExpression(node) {
      const identifierNode = getDeepestIdentifierNode(node);

      if (!identifierNode) {
        return;
      }

      if (helpers.isUserEventMethod(identifierNode)) {
        if (identifierNode.name === 'setup') {
          return;
        }
        // detect async query used within wrapper function for later analysis
        detectAsyncQueryWrapper(identifierNode);

        const closestCallExpressionNode = findClosestCallExpressionNode(
          node,
          true
        );

        if (!closestCallExpressionNode || !closestCallExpressionNode.parent) {
          return;
        }

        const references = getVariableReferences(
          context,
          closestCallExpressionNode.parent
        );

        // check direct usage of async query:
        // const element = await findByRole('button')
        if (references.length === 0) {
          if (!isPromiseHandled(identifierNode)) {
            context.report({
              node: identifierNode,
              messageId: 'awaitAsyncQuery',
              data: { name: identifierNode.name },
            });
            return;
          }
        }

        // check references usages of async query:
        //  const promise = findByRole('button')
        //  const element = await promise
        for (const reference of references) {
          if (
            ASTUtils.isIdentifier(reference.identifier) &&
            !isPromiseHandled(reference.identifier)
          ) {
            context.report({
              node: identifierNode,
              messageId: 'awaitAsyncQuery',
              data: { name: identifierNode.name },
            });
            return;
          }
        }
      } else if (
        functionWrappersNames.includes(identifierNode.name) &&
        !isPromiseHandled(identifierNode)
      ) {
        // check async queries used within a wrapper previously detected
        context.report({
          node: identifierNode,
          messageId: 'asyncQueryWrapper',
          data: { name: identifierNode.name },
        });
      }
    },
  };
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce userEvent method promoises to be handled',
    },
    messages: {
      awaitAsyncQuery: 'promise returned from `{{ name }}` query must be handled',
      asyncQueryWrapper: 'promise returned from `{{ name }}` wrapper over async query must be handled',
    },
  },
  create: detectTestingLibraryUtils(create),
};
