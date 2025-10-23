const base = require('./base')

module.exports = {
  ...base,
  extends: [...base.extends, 'next/core-web-vitals'],
  plugins: [...base.plugins, 'react', 'react-hooks'],
  rules: {
    ...base.rules,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    ...base.env,
    browser: true,
  },
}
