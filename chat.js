// クロージャー
(() => {
    document.getElementById("execute").addEventListener("click", chat);
    // メッセージ送信ボタン押下時の処理
    async function chat() {
        var when = document.getElementById('when');
        var where = document.getElementById('where');
        var who = document.getElementById('who');
        var what = document.getElementById('what');
        var why = document.getElementById('why');
        var how = document.getElementById('how');
        var is_when = when.classList.contains('active');
        var is_where = where.classList.contains('active');
        var is_who = who.classList.contains('active');
        var is_what = what.classList.contains('active');
        var is_why = why.classList.contains('active');
        var is_how = how.classList.contains('active');
        var str_5w1h = "";
        if(is_when) str_5w1h += " いつ ";
        if(is_where) str_5w1h += " どこ ";
        if(is_who) str_5w1h += " だれ ";
        if(is_what) str_5w1h += " なに ";
        if(is_why) str_5w1h += " なぜ ";
        if(is_how) str_5w1h += " どう ";
        // 質問取得
        const question = getQuery() + str_5w1h;
        document.getElementById('searchResult').innerHTML = '<div id="loader">🤔...🔎</div>';
        toggleLoading();
        // 回答を生成
        const answer = await getAnswer( question );
        toggleLoading();
        addSearchResult(answer);
    }
    
    // -----------------------------------------
    // UI更新
    // -----------------------------------------
    //検索中
    function toggleLoading() {
        var searchResult = document.getElementById('searchResult');
        searchResult.classList.toggle('loading');
    }
    //検索結果を表示
    function addSearchResult(result) {
        // 検索結果を表示する要素を取得
        var searchResultElement = document.getElementById("searchResult");

        // 検索結果のテキストを設定
        searchResultElement.innerHTML = '<p>' + result + '</p>';
    }
    
    
    // -----------------------------------------
    // プロセス間通信
    // -----------------------------------------
    // チャット処理を呼び出す
    async function sendByApi( 
        question    // 質問内容
    ){
        // メインプロセスに送信（preload.jsで用意したchatApi.api1()を使用する）
        result = await window.chatApi.api1(question);
        console.log(result);
        return result;
    }
    // -----------------------------------------
    // getter
    // -----------------------------------------
    // 質問を取得
    function getQuery() {
        const question = document.getElementById("question").value;
        return question;
    }
    // 回答を取得
    async function getAnswer( question ) {
        const answer = await sendByApi( question );
        return answer;
    };
  })();

  function setCustomProperty(elem, prop, value){
    elem.style.setProperty(prop, value)
}
function getCustomProperty(elem, prop) {
    return parseFloat(getComputedStyle(elem).getPropertyValue(prop)) || 0
}
function incrementCustomProperty(elem, prop, inc) {
    setCustomProperty(elem, prop, getCustomProperty(elem, prop) + inc + "px")
}

function moveGround() {
    const ground_elements = document.querySelectorAll(".ground")
    setCustomProperty(ground_elements[1], '--right', ground_elements[1].width*-1 + "px")
    setInterval(function() {
			// ground generation doesn't really work on codepen
        ground_elements.forEach(ground => {
            incrementCustomProperty(ground, "--right", 1)
            if(getCustomProperty(ground, '--right') >= ground.width){
                incrementCustomProperty(ground, '--right', -ground.width*2)
            }
        })
    }, 5);
}
document.addEventListener("DOMContentLoaded", function () {
    moveGround();
})