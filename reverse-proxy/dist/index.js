"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_1 = __importDefault(require("http-proxy"));
const app = (0, express_1.default)();
const PORT = 8000;
const BASE_PATH = "https://devport-deploy.s3.ap-south-1.amazonaws.com/__outputs";
const proxy = http_proxy_1.default.createProxy();
app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split(".")[0];
    const resolvesTo = `${BASE_PATH}/${subdomain}`;
    proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});
proxy.on("proxyReq", (proxyReq, req, res) => {
    const url = req.url;
    if (url === "/") {
        proxyReq.path = (proxyReq.path || "") + "index.html";
    }
});
app.listen(PORT, () => console.log(`Reverse Proxy Running on port ${PORT}..`));
