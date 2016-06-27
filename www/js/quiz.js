// This is a JavaScript file
//mobile backendのAPIキーを設定
var ncmb = new NCMB("dea53afdc6cd97329c6bbbb45fc8f42b90eb0e33973a5362ea5eeeac45350e72","8fcbb466309c67557ee050fb45483d0058b4f7607bf2819437f00d8c86232c46");
    
//ページの初期化が完了したら実行される
$(function (){
   
    //クイズを表示するイベントを登録
    $(document.body).on('pageinit', '#answer_page', function() {refreshQuiz();});
    
    //クイズ作成ボタンを表示するイベトを登録
    //HTMLに記述したボタンはJSで操作できない
    $(document.body).on('pageinit', '#create_quiz_page', function() {displayButton();});
    
    //スコアを表示するイベントを登録★
    $(document.body).on('pageinit', '#menu_page', function() {findScore();});
    
});

//ログイン済みかを確認する
function checkCurrentUser(){
    //画面遷移時のアニメーションを設定
    var options = {
        animation: 'lift', // アニメーションの種類
        onTransitionEnd: function() {} // アニメーションが完了した際によばれるコールバック
    };

    try {
        var currentUser = ncmb.User.getCurrentUser();
        if (currentUser) {
            //ログイン済みであればメニューの表示
            quizNavi.pushPage("menu.html", options);
        } else {
            //未ログインの場合はログイン画面を表示
            quizNavi.pushPage("login.html", options);
        }        
    }
    catch (error) {
        console.log("error:" + error);
        logout();
    }
}

//会員登録・ログインを行う
function userLogin(isSignedUp){
    //入力フォームからユーザー名とパスワードを取得
    var userName = $("#user_name").val();
    var password = $("#password").val();
    
    //会員登録・ログインを実行したあとのコールバックを設定
    var callBack = function(error, obj) {
        if (error) {
            //エラーコードの表示
            $("#login_error_msg").text("errorCode:" + error.code + ", errorMessage:" + error.message);
        } else {
            //メニュー画面に遷移
            quizNavi.pushPage("menu.html");
        }
    }

    if (isSignedUp === false){
        //ログイン処理を実行し、上で設定されたコールバックが実行される
        ncmb.User.login(userName, password, callBack);
    } else {
        //会員のインスタンスを作成
        var user = new ncmb.User();
        
        //ユーザー名とパスワードとスコアをインスタンスに設定
        user.set("userName", userName)
            .set("password", password)
            .set("score", 0);
        
        //会員登録を実行し、上で設定されたコールバックが実行される
        user.signUpByAccount(callBack);        
    }
}

//ログアウトを実行し、ホーム画面に遷移させる
function logout(){
    ncmb.User.logout()
             .then(function(){
                 // ログアウト後処理
                 quizNavi.resetToPage("home.html");
             })
             .catch(function(err){
                // エラー処理
                console.log("error:" + err.message);
                //未ログインの場合はログイン画面を表示
                quizNavi.pushPage("login.html", options);
             });
}

//クイズ作成画面に登録ボタンを設置する
function displayButton(){
    var btn = $("<ons-button id='create_quiz_button' onclick='createQuiz()'>クイズを登録!</ons-button>");
    btn.appendTo($("#create_button_area"));
    ons.compile(btn[0]);
}


//クイズをmobile backendに登録する
function createQuiz(){
    //フォームからクイズの内容を取得する
    var quizText = $("#quiz_text").val();
    var answer = $("#answer").val();
    var option1 = $("#option1").val();
    var option2 = $("#option2").val();
    var option3 = $("#option3").val();
    
    //空の要素がないことを確認する
    if (quizText !== "" && answer !== "" &&
        option1 !== "" && option2 !== "" && option3 !== ""){
        //クイズクラスのインスタンスを作成する
        var QuizClass = ncmb.DataStore("Quiz");
        var quiz = new QuizClass();
        
        //取得したクイズの内容をセットし、mobile backendにクイズを登録する
        quiz.set("quizText", quizText)
            .set("answer", answer)
            .set("options", [option1, option2, option3])
            .save()
            .then(function(object) {
                $("#create_button_area").hide();
                $("#created_message").text("クイズの作成が完了しました！");
                //スコアの更新が完了したら、メニュー画面に遷移するボタンを表示させる
                var btn = $("<ons-button onclick='quizNavi.resetToPage(\"menu.html\")'>メニューに戻る</ons-button>");
                btn.appendTo($("#created_message"));
                ons.compile(btn[0]);     　              
            })
            .catch(function(error){
　              $("#created_message").text("error:" + error.message);
　          });
    }
}

//クイズ画面をリフレッシュする
function refreshQuiz(){
    $("#answer_options").html("");    
    selectQuiz();
}

//連続正解数を保持するグローバル変数
var score = 0;

//正誤判定を行う
function answerQuiz(selectedOptions){
    //選択肢を非表示にする
    $("#answer_options").hide();
    
    if (answerText === selectedOptions) {
        //正解時に○を出す
        $("#question").append("<br/><img src='images/maru.png'><br/>" + (score+1) + "問連続正解中！");
        
        //次の問題を開くボタンを表示する
        var btn = $("<ons-button onclick='refreshQuiz()'>次の問題</ons-button>");
        btn.appendTo($("#question"));
        ons.compile(btn[0]);
        
        //連続正解数を更新する
        score++;
    } else {
        //間違い時に×を出す
        $("#question").append("<br/><img src='images/batsu.png'><br/>");
        
        //間違い時に端末を振動させる(実機で試す場合、コメントアウトを外してください)
        navigator.notification.vibrate(1000);
        
        //ログイン中の会員に連続正解数を設定
        var user = ncmb.User.getCurrentUser();
        user.set("score", score);
        score = 0;
        user.update()
            .then(function(obj){
                //スコアの更新が完了したら、メニュー画面に遷移するボタンを表示させる
                var btn = $("<ons-button onclick='quizNavi.resetToPage(\"menu.html\")'>メニューに戻る</ons-button>");
                btn.appendTo($("#question"));
                ons.compile(btn[0]);               
            })
            .catch(function(error){
                console.log("error:" + error.message);  
            });
    }
}

//mobile backendから取得したクイズの正解を保持する変数
var answerText = null;

//クイズを表示するメソッド
function displayQuiz(quiz){
    //問題文を表示
    $("#question").text(quiz.get("quizText"));
    
    //選択肢を表示する部分が見えるようにする
    $("#answer_options").show();
    
    //選択肢が入っている配列の末尾に正解を追加する
    var array = quiz.get("options");
    array[3] = quiz.get("answer");
    
    //正解とダミーの選択肢をランダムに入れ替える
    var index = Math.floor(Math.random() * 3);
    var tmp = array[index];
    array[index] = array[3];
    array[3] = tmp;
    
    //正解を含んだ選択肢の配列を表示する
    for (var i = 0; i < 4; i++){
        var btn = $("<ons-button onclick=\"answerQuiz('" + array[i] + "')\">" + array[i] + "</ons-button>");
        btn.appendTo($("#answer_options"));
        ons.compile(btn[0]);
    }
    
    //選択肢がタッチされたときに正誤判定を行うため、正解を保持する
    answerText = quiz.get("answer");
}

var quizSize = 0;
//クイズを検索する
function selectQuiz(){
    //クイズを検索するncmb.Queryクラスのインスタンスを作成する
    var QuizClass = ncmb.DataStore("Quiz");
    
    //指定された条件に合致するクイズの件数を調べる
    QuizClass.count().fetchAll()
                     .then(function(objects){
                            //登録されたクイズの数を保持する
                            quizSize = objects.count;                          
                     })
                     .catch(function(error) {
                            // エラー
                            console.log("error:" + error.message);                          
                     });
    
    //作成したクエリに条件を設定する
    QuizClass.skip(Math.floor(Math.random() * quizSize))
             .fetch()
             .then(function(result){
                displayQuiz(result);      
             })
             .catch(function(error) {
                console.log("error:" + error.message);
             });
}


//上位5番目までのスコアを持つユーザーを取得
function findScore(){
    $("#ranking").html("");
    
    //会員クラスを検索するクエリを作成
    ncmb.User.order("score", true)
        .limit(5)
        .fetchAll()
        .then(function(results){
                //検索が成功した場合は会員情報のリストをdisplayRankingメソッドに渡す
                displayRanking(results);              
        })
        .catch(function(error){
                console.log("error:" + error.message);   
                if(error.status == "401") {
                    logout();
                    //未ログインの場合はログイン画面を表示
                    quizNavi.pushPage("login.html", options);
                }
        });
}

//上位5番目までのランキングを表示
function displayRanking(ranking){
    for (var i = 0; i < ranking.length; i++){
        var topUser = ranking[i];
        $("#ranking").append((i+1) + "...userName:" + topUser.get("userName") + ", score:" + topUser.get("score") + "<br/>");
    }
}
