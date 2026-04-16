/** @type {import('stylelint').Config} */
export default {
    extends: [
        'stylelint-config-standard-scss',
        'stylelint-config-recess-order'
    ],
    plugins: ['stylelint-order'],
    rules: {
        // Sort selectors (class, ID, tag) in a specific order
        'order/order': [
            [
                'custom-properties', // CSS Variables (e.g., --main-color)
                'dollar-variables', // SCSS Variables
                'declarations', // CSS properties
                {
                    type: 'at-rule',
                    name: 'include' // SCSS Mixins
                },
                'rules' // Nested selectors
            ]
        ],
        'no-descending-specificity': true,
        'declaration-block-no-duplicate-custom-properties': true,
        'no-duplicate-selectors': true
    }
};
