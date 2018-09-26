/*
comment:
変数命名規則
g_-- : 全体マップにおくオブジェクト
j_-- : JSONから持ってきたデータ
a_-- : 外・エリアごとに配置するオブジェクト
m_-- : MAP画像
// *z : 後から座標指定しなきゃダメなところ
// ** comment  後から実装するべきところ
// *p : pathが配置されていること
Comment
*/

window.addEventListener("load",Load);

function Load(){
  // load JSON
  var queue = new createjs.LoadQueue(true);
  // *p
  var manifest = [
    {"src":"./JSON/mapImgData.json","id":"mapImgs"}
  ]
  /*
  // ** 後で足せ
  {"src":"./JSON/mapImgData.json","id":"mapImgs"},
    {"src":"./JSON/shop.json","id":"shop"},
    {"src":"./JSON/mapImgDatas.json","id":"id"}
  */
  queue.loadManifest(manifest,true);
  queue.addEventListener("complete",init);
}
function init(event){
  // json : j_--- : jsonから読み取ったデータ
  var j_mapImgsData  = event.target.getResult("mapImgs");
  //var j_shopData     = event.target.getResult("shop");
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
  stage.addChild(DisplayContainer);
  DisplayContainer.cache(0,0,2000,2000);
  stage.setClearColor('#FFFFFF');
  // 学校全体MAPの表示 m_--- :　map画像 g_--- : 全体マップで表示されるもの
  // *p
  var gm_general = new createjs.Bitmap("./imgs/" + j_mapImgsData.Generalview);
  main();

  // --- 画像の読み込み >> 画像の横幅を返す
  function getImageSize(bitmap){
    return new Promise(function(resolve,reject){
      bitmap.image.onload = function(){
        var size =[this.width,this.height];
        resolve(size);
      }
    });
  }
  function ChangeCanvasSize(width,height){
    canvasElement.style.width = width;
    canvasElement.style.height = height;
  }
  // -- main
  async function main(){
    //画像のロードを完全に済ませる
    var bmp_size = await getImageSize(gm_general);
    //画像のスケール
    gm_general.scaleX = canvasContainer.offsetWidth / bmp_size[0];
    gm_general.scaleY = gm_general.scaleX;
    //canvasSizeの調整
    ChangeCanvasSize(gm_general.image.width * gm_general.scaleX,
                    gm_general.image.height * gm_general.scaleY);
    // 親子構造の構築
    //Containerの定義
    var OutsideContainer = new createjs.Container(); // 構外マップで表示される四角形たちが格納されている。
    var areaContainers = [];                         // 各エリアのデータがA,B,C,D,E,F,の順で格納される。
    var g_rects = [];
    var am_sizes_tmp =[]; // await時間短縮用
    var am_sizes = []; // エリアごとに分けたときの画像のサイズが入っている。
    var am_imgs = []; // エリアごとに分けたときの画像が入っている。
    var a_toGenerals= []; //エリアから全体に戻るときの画像が入っている。
    // :: 全体マップに対する処理
    OutsideContainer.addChild(gm_general); // MAP画像を構外格納用コンテナの格納
    var g_areaTexts = ["A","B","C","D","E","F"];
    for(i=0;i<j_mapImgsData.AreaRects.length;i++){
      // エリア分け用の四角
      var g_rect = new createjs.Shape();
      var j_rect = j_mapImgsData.AreaRects[i];
      g_rect.graphics.beginFill(j_rect.color); // ** 色分けしたいなら後で配列を宣言しましょう
      g_rect.graphics.drawRoundRect(0,0,j_rect.width * gm_general.scaleX,j_rect.height * gm_general.scaleY, 20* gm_general.scaleX);
      g_rect.x = j_rect.x * gm_general.scaleX; // 位置座標セット
      g_rect.y = j_rect.y * gm_general.scaleY; // 位置座標セット
      g_rect.alpha = 0.15;                       // 透明度
      // 枠線用オブジェクト
      var g_rectStroke = new createjs.Shape();
      g_rectStroke.graphics.beginStroke(j_rect.color);
      g_rectStroke.graphics.setStrokeStyle(5 * gm_general.scaleX); // * gm_general.scaleX
      g_rectStroke.graphics.drawRoundRect(0,0,j_rect.width * gm_general.scaleX,j_rect.height * gm_general.scaleY,20 * gm_general.scaleX);      
      g_rectStroke.x = g_rect.x;
      g_rectStroke.y = g_rect.y;
      // エリア分けで用いるテキスト
      var textSize = 100 * gm_general.scaleX;
      var g_text= new createjs.Text(g_areaTexts[i], textSize +"px selif",j_rect.color);
      g_text.x = (j_rect.x + parseInt(j_rect.width /2) ) * gm_general.scaleX;
      g_text.y = (j_rect.y + parseInt(j_rect.height/2) ) * gm_general.scaleY;
      g_text.textAlign = "center";
      g_text.textBaseline = "middle";
      // 四角形とテキストを構外MAP用に入れる。
      OutsideContainer.addChild(g_rect);
      OutsideContainer.addChild(g_rectStroke);
      OutsideContainer.addChild(g_text);
      g_rects.push(g_rect);
    }
    // :: 構内へ、の矢印
    // *p
    var toCampusArrow = new createjs.Bitmap("./imgs/" + j_mapImgsData.ToCampusArrow);
    // 位置、角度のセット
    toCampusArrow.x        = 100 * gm_general.scaleX; // *z 座標を入れよう
    toCampusArrow.y        = 100 * gm_general.scaleY; // *z
    //OutsideContainer.addChild(toCampusArrow);
    // :: 小エリアに対する処理
    for(i=0;i<j_mapImgsData.OutsideAreas.length;i++){
      // 各エリアの拡大画像の配置 // *p
      var am_img = new createjs.Bitmap("./imgs/" + j_mapImgsData.OutsideAreas[i].img);
      am_sizes_tmp[i] = getImageSize(am_img);
    }
    console.log("hello");
    for(i=0;i<j_mapImgsData.OutsideAreas.length;i++)am_sizes[i] = await am_sizes_tmp[i];
    console.log("finish");
    //am_sizes Get後
    for(i=0;i<j_mapImgsData.OutsideAreas.length;i++){
      // a_ : エリア分けされたもの
      var a_PageContainer =  new createjs.Container(); // i番目のエリアのデータが全部入る
      var a_PinContainer = new createjs.Container(); // ピンがいっぱい入る
      // 各エリアの拡大画像の配置 // *p
      var am_img = new createjs.Bitmap("./imgs/" + j_mapImgsData.OutsideAreas[i].img);
      //var am_size = [am_img.image.width,am_img.image.height];
      var am_size = am_sizes[i];
      am_imgs.push(am_img);
      // canvasのサイズに画像を合わせる。
      if((canvasElement.width/am_size[0]) * am_size[1] > canvasElement.height){
        // 縦横比が合わないと高さがcanvasを超える問題の対処
        am_img.scaleX = canvasElement.height / am_size[1];
        am_img.scaleY = am_img.scaleX;
        am_img.x = ( (canvasElement.width - am_img.scaleY * am_size[0])/2 );
      }else{
        // scale : 現在のcanvasSize / am_img.width 
        am_img.scaleX = canvasElement.width / am_size[0];
        am_img.scaleY = am_img.scaleX;
      }
      // ** 左にずれた時はここで調整する *z
      a_PageContainer.addChild(am_img);
      // ** ピン画像の配置 pinImgを編集してくれ
      /*
      for(j=0;j<j_mapImgsData.pins.length;j++){
        var a_pin = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg);
        a_pin.scaleX = gm_general.scaleX;
        a_pin.scaleY = gm_general.scaleY;
        a_pin.x = j_mapImgsData.OutsideAreas[i].pins[j].x * gm_general.scaleX;
        a_pin.y = j_mapImgsData.OutsideAreas[i].pins[j].y * gm_general.scaleY;
        a_PinContainer.addChild(a_pin);
      }
      a_PageContainer.addChild(a_PinContainer);
      */
      // Generalへ戻る画像の配置
      var a_toGeneral = new createjs.Bitmap("./imgs/" + j_mapImgsData.GotoGeneralImg);
      a_toGeneral.scaleX = gm_general.scaleX;
      a_toGeneral.scaleY = gm_general.scaleY;
      a_toGeneral.x = j_mapImgsData.OutsideAreas[i].goGeneral.x;
      a_toGeneral.y = j_mapImgsData.OutsideAreas[i].goGeneral.y;
      a_PageContainer.addChild(a_toGeneral);
      a_toGenerals.push(a_toGeneral);
      areaContainers.push(a_PageContainer);
    }
    //初期状態にする。
    //全体MAPを表示する。
    DisplayContainer.addChild(OutsideContainer);
    //event
    for(i=0;i<g_rects.length;i++){
      g_rects[i].addEventListener("click",GtoA); 
      g_rects[i].eventParam = i ;
      a_toGenerals[i].addEventListener("click",AtoG);
      a_toGenerals[i].eventParam = i;
    }
    // 全体画面から各エリアへ飛ぶ
    function GtoA(event){
      var i = event.target.eventParam;
      MapChange(OutsideContainer,areaContainers[i]);
    }
    function AtoG(event){
      var i = event.target.eventParam;
      MapChange(areaContainers[i],OutsideContainer);
    }
    // 現在のページから次のページに切り替わる >>
    function MapChange(CurrentContainer,NextContainer){
      DisplayContainer.removeChild(CurrentContainer);
      DisplayContainer.addChild(NextContainer);
    }
  }// ここまでmain
  //Resize
  window.addEventListener('resize' , function(){
    (!window.requestAnimationFrame) ? this.setTimeout(Sizing) : window,requestAnimationFrame(Sizing);
  })
  // 画面更新
  createjs.Ticker.on("tick",function(){
    stage.update();
    DisplayContainer.updateCache();
  });
}