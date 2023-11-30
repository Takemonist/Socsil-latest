import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { GooglePaLM } from "langchain/llms/googlepalm";
import { OpenAI } from "langchain/llms/openai";
import { ChatGooglePaLM } from "langchain/chat_models/googlepalm";
import { SerpAPI, GoogleCustomSearch } from "langchain/tools";
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
    autoHideMenuBar:true,
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
export const translate = async (input:string,source:string,target:string):Promise<string> => {
  var API_KEY = process.env.DEEPL_API_KEY;
  var API_URL = `https://api-free.deepl.com/v2/translate`
  let content = encodeURI('auth_key=' + API_KEY + '&text=' + input + '&source_lang=' + source + '&target_lang=' + target);
  let translate_ja2en_api = API_URL + '?' + content;

  let response = await fetch(translate_ja2en_api);
  let data = await response.json();
  console.log(data);
  return data.translations[0].text; // JSONからtextを取得
};

export const execute_llm = async (input:string):Promise<string> => {
  // LLMの準備
  const llm = new GooglePaLM({ temperature: 0.0 });
  const model = new OpenAI({
    modelName: "gpt-3.5-turbo-1106",
    temperature: 0,
  });
  // ツールの準備
  const tools = [new GoogleCustomSearch(), new SerpAPI(process.env.SERPAPI_API_KEY, {
    location: "Japan",
    hl: "ja",
    gl: "jp",
  })];
  // エクスキューターの準備
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "zero-shot-react-description",
    verbose: true,
  });
  const res = await executor.call({ input: input+ " Think step-by-step, and output it precisely. YOU MUST ANSWER IN JAPANESE" });
  console.log("Q:", input);
  console.log("A:", res.output);
  return res.output;
};

export const search_query = async (query_ja:string) => {
  console.log("Q:", query_ja);
  
  try {
    //let query_en: string = await translate(query_ja, "JA", "EN");
    let result: string = await execute_llm(query_ja);
    //let result_ja: string = await translate(result_en, "EN", "JA");
    return result;
  } catch (error) {
    // エラーハンドリング
    console.error("エラーが発生しました:", error);
  }
}


// -----------------------------------------
// プロセス間通信
// -----------------------------------------
ipcMain.handle('channel_api', async (event: Object, ...args: Array<any>) => {
  // 【テスト】引数確認
  console.log(event);
  args.forEach( function(item, index) {
    console.log("[" + index + "]=" + item);
  });

  if ( args.length !== 2 ) {
    console.error( "channel_apiの引数が2個ではありません。" );
    return;
  }

  // 回答生成
  const question = args[1];
  const res = search_query(question);
  // 回答を返す
  return res;
})