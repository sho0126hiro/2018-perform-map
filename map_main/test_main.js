window.addEventListener("load",Load);

function Load(){
  // load JSON
  var queue = new createjs.LoadQueue(true);
  var manifest = [
    {"src":"./JSON/mapImgData.json","id":"mapImgs"},
    {"src":"./JSON/shop.json","id":"shop"},
    {"src":"./JSON/mapImgDatas.json","id":"id"}
  ]
  queue.loadmanifest(manifest,true);
  queue.addEventListener("complete",init);
}
function init(){
  // json : j_--- : jsonから読み取ったデータ
  var j_mapImgsData  = event.target.getResult("mapImgs");
  var j_shopData     = event.target.getResult("shop");
  // - canvasの定義
  var canvasContainer = document.getElementById("wrap");
  var canvasElement = document.getElementById("myCanvas");
  // CanvasSizeの大きさ画面サイズに設定する（初期化）
  var Sizing = function(){
    canvasElement.height = canvasContainer.offsetHeight;
    canvasElement.width  = canvasContainer.offsetWidth;
  }
  Sizing();
  // stageの定義
  var stage = new createjs.StageGL(canvasElement);
  // 表示用コンテナの定義
  var DisplayContainer = new createjs.Container(); //表示用
  stage.setClearColor('#FFFFFF');
  // 学校全体MAPの表示 m_--- :　map画像 g_--- : 全体マップで表示されるもの
  var g_m_general = new createjs.Bitmap("./imgs/" + j_mapImgsData.generalview);
  main();
  // -- main
  async function main(){
    //画像のロードを完全に済ませる
    var bmp_width = await LoadImage(g_m_general);
    //画像のスケール
    g_m_general.scaleX = canvasContainer.offsetWidth / bmp_width;
    g_m_general.scaleY = g_m_general.scaleX;
    //canvasSizeの調整
    canvasContainer.style.height = bmp.image.height * bmp.scaleY;
    canvasElement.style.height = bmp.image.height * bmp.scaleY;
    // 親子構造の構築
    SetContainer();
  }
  //Containerの定義
  var OutsideContainer = new createjs.Container(); //構外マップで表示される四角形たちが格納されている。
  function SetContainer(){
    // :: 全体マップに対する処理
    for(i=0;i<j_mapImgsData.AreaRects.length;i++){
      // 四角形
      var g_rect = new createjs.Shape();
      var j_rect = j_mapImgsData.AreaRects[i];
      g_rect.graphics.beginFill("DarkRed"); // ** 色分けしたいなら後で配列を宣言しましょう
      g_rect.graphics.drawRect(j_rect.x,j_rect.y,j_rect.width * g_m_general.scaleX,j_rect.height * g_m_general.scaleY);
      g_rect.alpha = 0.5;
      // 四角形を構外MAP用に入れる。
      OutsideContainer.addChild(g_rect);
      // 構内へ、の矢印
      var toCampusArrow = new createjs.Bitmap("./imgs/" + j_mapImgsData.toCampusArrow);
      // imgの位置、角度のセット
      toCampusArrow.x        = 100 * g_m_general.scaleX; // *z 座標を入れよう
      toCampusArrow.y        = 100 * g_m_general.scaleY; // *z
      toCampusArrow.addChild(toCampusArrow); 
    }
    // :: 小エリアに対する処理
    for(i=0;i<j_mapImgsData.length;i++){
      // エリア分けされたときの四角形の格納 // a_ : エリア分けされたもの
      var a_RectContainer = new createjs.Container(); 
      var areaImg = new createjs.Bitmap("./imgs/" + j_mapImgsData.OutsideAreas[i]);
      areaContainers.push();
    }
  }

  // --- 画像の読み込み >> 画像の横幅を返す
  function LoadImage(bitmap){
    return new Promise(function(resolve,reject){
      bitmap.image.onload = function(){
        resolve(this.width);
      }
    });
  }



}