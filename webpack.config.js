const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin"); // ✅ ajout ici

const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/app.ts"),
    output: {
        filename: "app.js",
        path: path.resolve(appDirectory, "dist"),
        clean: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        host: "0.0.0.0",
        port: 8080,
        static: [
            path.resolve(appDirectory, "public"),
            path.resolve(appDirectory, "dist")
        ],
        hot: true,
        devMiddleware: {
            publicPath: "/",
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "index.html"),
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "assets", to: "assets" } // ✅ copie les fichiers dans dist/assets
            ],
        })
    ],
    mode: "production",
};
