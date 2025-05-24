const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/app.ts"),
    output: {
        filename: "app.js",
        path: path.resolve(appDirectory, "dist"),
        publicPath: "/", // important pour charger les assets
        clean: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        host: "0.0.0.0",
        port: 8080,
        static: {
            directory: path.resolve(appDirectory, "dist"),
        },
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
                { from: path.resolve(appDirectory, "assets"), to: "assets" },
    { from: path.resolve(appDirectory, "maps"), to: "maps" }, // ✅ correct ici
            ],
        }),
    ],
    //mode: "development", // ⛔️ pas production pour le dev
     mode: "production",
};
