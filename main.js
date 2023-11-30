"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.search_query = exports.execute_llm = exports.translate = void 0;
const agents_1 = require("langchain/agents");
const googlepalm_1 = require("langchain/llms/googlepalm");
const openai_1 = require("langchain/llms/openai");
const tools_1 = require("langchain/tools");
// パス操作
const path = require('path');
// アプリケーション作成用のモジュールを読み込み
const { app, BrowserWindow, ipcMain } = require("electron");
// -----------------------------------------
// electronに必要な処理
// -----------------------------------------
// メインウィンドウ
let mainWindow;
const createWindow = () => {
    // メインウィンドウを作成します
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        resizable: true,
        width: 800,
        height: 6000,
        webPreferences: {
            // プリロードスクリプトは、レンダラープロセスが読み込まれる前に実行され、
            // レンダラーのグローバル（window や document など）と Node.js 環境の両方にアクセスできます。
            preload: path.join(__dirname, "preload.js"),
        },
    });
    // メインウィンドウに表示するURLを指定します
    // （今回はmain.jsと同じディレクトリのindex.html）
    mainWindow.loadFile("index.html");
    // デベロッパーツールの起動
    // mainWindow.webContents.openDevTools();
    // メインウィンドウが閉じられたときの処理
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};
//  初期化が完了した時の処理
app.whenReady().then(() => {
    createWindow();
    // アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
    app.on("activate", () => {
        // メインウィンドウが消えている場合は再度メインウィンドウを作成する
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// 全てのウィンドウが閉じたときの処理
app.on("window-all-closed", () => {
    // macOSのとき以外はアプリケーションを終了させます
    if (process.platform !== "darwin") {
        app.quit();
    }
});
require("dotenv").config({ path: path.join(__dirname, '.env') });
// -----------------------------------------
// 回答を生成
// -----------------------------------------
const translate = (input, source, target) => __awaiter(void 0, void 0, void 0, function* () {
    var API_KEY = process.env.DEEPL_API_KEY;
    var API_URL = `https://api-free.deepl.com/v2/translate`;
    let content = encodeURI('auth_key=' + API_KEY + '&text=' + input + '&source_lang=' + source + '&target_lang=' + target);
    let translate_ja2en_api = API_URL + '?' + content;
    let response = yield fetch(translate_ja2en_api);
    let data = yield response.json();
    console.log(data);
    return data.translations[0].text; // JSONからtextを取得
});
exports.translate = translate;
const execute_llm = (input) => __awaiter(void 0, void 0, void 0, function* () {
    // LLMの準備
    const llm = new googlepalm_1.GooglePaLM({ temperature: 0.0 });
    const model = new openai_1.OpenAI({
        modelName: "gpt-3.5-turbo-1106",
        temperature: 0,
    });
    // ツールの準備
    const tools = [new tools_1.GoogleCustomSearch(), new tools_1.SerpAPI(process.env.SERPAPI_API_KEY, {
            location: "Japan",
            hl: "ja",
            gl: "jp",
        })];
    // エクスキューターの準備
    const executor = yield (0, agents_1.initializeAgentExecutorWithOptions)(tools, model, {
        agentType: "zero-shot-react-description",
        verbose: true,
    });
    const res = yield executor.call({ input: input + " Think step-by-step, and output it precisely. YOU MUST ANSWER IN JAPANESE" });
    console.log("Q:", input);
    console.log("A:", res.output);
    return res.output;
});
exports.execute_llm = execute_llm;
const search_query = (query_ja) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Q:", query_ja);
    try {
        //let query_en: string = await translate(query_ja, "JA", "EN");
        let result = yield (0, exports.execute_llm)(query_ja);
        //let result_ja: string = await translate(result_en, "EN", "JA");
        return result;
    }
    catch (error) {
        // エラーハンドリング
        console.error("エラーが発生しました:", error);
    }
});
exports.search_query = search_query;
// -----------------------------------------
// プロセス間通信
// -----------------------------------------
ipcMain.handle('channel_api', (event, ...args) => __awaiter(void 0, void 0, void 0, function* () {
    // 【テスト】引数確認
    console.log(event);
    args.forEach(function (item, index) {
        console.log("[" + index + "]=" + item);
    });
    if (args.length !== 2) {
        console.error("channel_apiの引数が2個ではありません。");
        return;
    }
    // 回答生成
    const question = args[1];
    const res = (0, exports.search_query)(question);
    // 回答を返す
    return res;
}));
