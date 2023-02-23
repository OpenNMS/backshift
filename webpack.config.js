const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const JsDocPlugin = require('jsdoc-webpack-plugin');

const common = {
    entry: {
        'backshift': './src/full.js',
        'backshift.onms': './src/onms.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'web',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/i,
                use: [{
                    loader: 'style-loader',
                },{
                    loader: 'css-loader',
                }],
            },
            {
                test: require.resolve('dc'),
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                }],
            },
            {
                test: require.resolve('jquery'),
                loader: 'expose-loader',
                options: {
                    exposes: [{
                        globalName: '$',
                        override: true,
                    },{
                        globalName: 'jQuery',
                        override: true,
                    }],
                },
            },
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'examples', to: '.' },
            ],
        }),
        new ESLintPlugin({
        }),
        new JsDocPlugin({
            conf: 'jsdoc.conf.json',
            cwd: '.',
            preserveTmpFile: false,
            recursive: false,
        }),
    ],
};

module.exports = [
    Object.assign({}, common, {
        mode: 'production',
        devtool: 'source-map',
        output: {
            filename: '[name].min.js',
        },
    }),
    Object.assign({}, common, {
        mode: 'development',
        devtool: 'inline-source-map',
        output: {
            filename: '[name].js',
        },
    }),
];