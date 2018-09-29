/*
変数命名規則
g_-- : 全体マップにおくオブジェクト
j_-- : JSONから持ってきたデータ
a_-- : 外・エリアごとに配置するオブジェクト
c_-- : 構内マップTOPにおくオブジェクト
b_-- : 構内マップの各棟についてのオブジェクト
f_-- : 構内のフロア内オブジェクト
m_-- : MAP画像
h_-- : html(DOM)
e_-- : eventチェック用
d_-- : デバッグ用
// *z : 後から座標指定しなきゃダメなところ
// ** comment  後から実装するべきところ
// *p : pathが配置されていること
*/

window.addEventListener("load",Load);

// 
function Load(){
  // load JSON // *p
  var queue = new createjs.LoadQueue(true);
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
// JSONデータが読み込まれたら入る
function init(event){
  var j_mapImgsData  = event.target.getResult("mapImgs");　// mapImgData.json
  //var j_shopData     = event.target.getResult("shop");
  // - canvas stageの定義　--------------------------------------------------------------------------------------------
  var canvasContainer = document.getElementById("wrap");
  var canvasElement   = document.getElementById("myCanvas");
  var h_shopname      = document.getElementById("shopname");
  // CanvasSizeの大きさ画面サイズに設定する（初期化）
  var Sizing = function(){
    canvasElement.height = canvasContainer.offsetHeight;
    canvasElement.width  = canvasContainer.offsetWidth;
  }
  // CanvasSizeの大きさ画面サイズに設定する（初期化）
  Sizing();
  // - stageの定義
  var stage = new createjs.StageGL(canvasElement);
  // ---------------------------------------------------------------------------------------------------------------   
  var DisplayContainer = new createjs.Container();                                  // 表示用コンテナ
  stage.addChild(DisplayContainer);
  DisplayContainer.cache(0,0,canvasElement.width,canvasElement.height);
  stage.setClearColor('#FFFFFF');
  var gm_general      = new createjs.Bitmap("./imgs/" + j_mapImgsData.Generalview); // 構外MAP全体画像　すべての基準はこの画像になる。// *p
  main();

  // -- 画像の読み込み >> 画像のサイズを返す------------------------
  // return 配列 [0] : width [1] : height
  function getImageSize(bitmap){
    return new Promise(function(resolve,reject){
      bitmap.image.onload = function(){
        var size =[this.width,this.height];
        resolve(size);
      }
    });
  }

  // -- canvasのサイズを変更する ---------------------------------
  function ChangeCanvasSize(width,height){
    canvasElement.style.width = width;
    canvasElement.style.height = height;
  }

  // -- main main(async) : このあとの処理は全てここ　------------------------------------------------------------------
  async function main(){
    
    // :: canvas の大きさの調整----------------------------------------------------------------------------------------
    // 基準となる画像（構外MAP全体画像）のサイズを取得する。
    var bmp_size = await getImageSize(gm_general); // size[0] : width  size[1] : height
    //画像のスケールの計算
    gm_general.scaleX = canvasContainer.offsetWidth / bmp_size[0];
    gm_general.scaleY = gm_general.scaleX;
    //canvasSizeの調整　全体MAP画像の大きさと同じ大きさにする
    ChangeCanvasSize(gm_general.image.width * gm_general.scaleX,gm_general.image.height * gm_general.scaleY);
    
    // :: 親子構造の構築-----------------------------------------------------------------------------------------------
    // 構外MAP内に配置するオブジェクトの定義
    var OutsideContainer   = new createjs.Container();   // 構外マップで表示されるオブジェクト
    var areaContainers     = [];                         // 各エリアのデータ [A,B,C,D,E,F]
    var g_rects            = [];                         // エリアの四角 [エリア]
    var g_areaTexts        = ["A","B","C","D","E","F"];  // エリアのテキスト情報
    // --- 1. 全体マップの配置 ----------------------------------------------------------------------------------------
    // --- 1.1 構外MAP全体画像の配置 --------------------------------------------------------------
    OutsideContainer.addChild(gm_general); 
    // --- 1.2 エリア分け用のオブジェクトの配置----------------------------------------------------
    for(var i=0;i<j_mapImgsData.AreaRects.length;i++){
      // ---- 1.2.1 エリア用の四角の配置 ----------------------------------------------------------
      var j_rect          = j_mapImgsData.AreaRects[i];
      g_rects[i]          = new createjs.Shape();
      g_rects[i].graphics.beginFill(j_rect.color); // ** 色分けしたいなら後で配列を宣言しましょう
      g_rects[i].graphics.drawRoundRect(0,0,j_rect.width * gm_general.scaleX,j_rect.height * gm_general.scaleY, 20* gm_general.scaleX);
      g_rects[i].x        = j_rect.x * gm_general.scaleX; // 位置座標セット
      g_rects[i].y        = j_rect.y * gm_general.scaleY; // 位置座標セット
      g_rects[i].alpha    = 0.15;                       // 透明度
      // ---- 1.2.2 エリア用の四角に対する枠線用オブジェクトの配置 --------------------------------
      var g_rectStroke = new createjs.Shape();
      g_rectStroke.graphics.beginStroke(j_rect.color);
      g_rectStroke.graphics.setStrokeStyle(5 * gm_general.scaleX); // * gm_general.scaleX
      g_rectStroke.graphics.drawRoundRect(0,0,j_rect.width * gm_general.scaleX,j_rect.height * gm_general.scaleY,20 * gm_general.scaleX);      
      g_rectStroke.x      = g_rects[i].x;
      g_rectStroke.y      = g_rects[i].y;
      // ---- 1.2.3 エリア用の四角に乗せるテキストオブジェクトの配置-------------------------------
      var textSize        = 100 * gm_general.scaleX;
      var g_text          = new createjs.Text(g_areaTexts[i], textSize +"px selif",j_rect.color);
      g_text.x            = (j_rect.x + parseInt(j_rect.width /2) ) * gm_general.scaleX;
      g_text.y            = (j_rect.y + parseInt(j_rect.height/2) ) * gm_general.scaleY;
      g_text.textAlign    = "center";
      g_text.textBaseline = "middle";
      // ---- 1.2.4 配置しかく用オブジェクトを配置する --------------------------------------------
      OutsideContainer.addChild(g_rects[i]);
      OutsideContainer.addChild(g_rectStroke);
      OutsideContainer.addChild(g_text);
    }
    // --- 1.2 構外MAP全体画像の配置 --------------------------------------------------------------
    var toCampusArrow = new createjs.Bitmap("./imgs/" + j_mapImgsData.ToCampusArrow); // *p
    // 位置、角度のセット
    toCampusArrow.scaleX   = gm_general.scaleX * 0.9;
    toCampusArrow.scaleY   = gm_general.scaleY * 0.9;
    toCampusArrow.x        = 2600 * gm_general.scaleX; // *z 座標を入れよう
    toCampusArrow.y        = 200 * gm_general.scaleY;  // *z
    OutsideContainer.addChild(toCampusArrow);

    // --- 2. 小エリアの配置 ------------------------------------------------------------------------------------------
    var am_sizes_tmp       = [];                         // await時間短縮用
    var am_sizes           = [];                         // エリアごとに分けたときの画像のサイズ
    var am_imgs            = [];                         // エリアごとに分けたときの画像
    var a_toGenerals       = [];                         // エリアから全体に戻るときの画像
    var outSidePins_r      = [];                         //校外のピンたち（outSidePins_r[Area][num]) 本当はその上に隠れている四角
    // --- 2.1 各エリアの拡大画像の大きさの取得---------------------------------------------------
    for(var i=0;i<j_mapImgsData.OutsideAreas.length;i++){
      var am_img      = new createjs.Bitmap("./imgs/" + j_mapImgsData.OutsideAreas[i].img); // *p
      am_sizes_tmp[i] = getImageSize(am_img);
    }
    // await時間短縮
    for(var i=0;i<j_mapImgsData.OutsideAreas.length;i++)am_sizes[i] = await am_sizes_tmp[i];
    // --- 2.2 小エリア内オブジェクトの配置--------------------------------------------------------
    for(var i=0;i<j_mapImgsData.OutsideAreas.length;i++){
      var a_PageContainer = new createjs.Container(); // i番目のエリアのデータが全部入る
      var a_PinContainer  = new createjs.Container(); // ピンがいっぱい入る
      // ---- 2.2.1 各エリアの拡大画像の配置 ------------------------------------------------------
      var am_img          = new createjs.Bitmap("./imgs/" + j_mapImgsData.OutsideAreas[i].img);// *p
      var am_size         = am_sizes[i];
      am_imgs.push(am_img);
      // ---- canvasのサイズに画像を合わせる。----------------------------------------------------
      if((canvasElement.width/am_size[0]) * am_size[1] > canvasElement.height){
        // 縦横比が合わないと高さがcanvasを超える問題の対処
        am_img.scaleX = canvasElement.height / am_size[1];
        am_img.scaleY = am_img.scaleX;
        am_img.x = ( (canvasElement.width - am_img.scaleY * am_size[0])/2 );
      }else{
        // scale : 現在のcanvasSize / am_img.width 
        am_img.scaleX = canvasElement.width / am_size[0];
        am_img.scaleY = am_img.scaleX;
        am_img.y = ( (canvasElement.height - am_img.scaleX * am_size[1])/2 );
      }
      // ------------------------------------------------------------------------------------------
      a_PageContainer.addChild(am_img);
      // ---- 2.2.2 各エリアに配置されるピンの設置 ------------------------------------------------
      var a_pins         = []; //　エリアにおけるピンの画像が入る [エリア]
      var a_pin1Tmp      = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1); // *p
      var pin1Size       = await getImageSize(a_pin1Tmp); // pinの画像サイズを取得
      for(var j=0;j<j_mapImgsData.OutsideAreas[i].pins.length;j++){
        // ----- 2.2.2.1 エリアにおけるピンの画像の設置 -------------------------------------------
        var a_pin        = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1); // *p
        a_pin.scaleX     = gm_general.scaleX;
        a_pin.scaleY     = gm_general.scaleY;
        a_pin.x          = j_mapImgsData.OutsideAreas[i].pins[j].x * gm_general.scaleX;
        a_pin.y          = j_mapImgsData.OutsideAreas[i].pins[j].y * gm_general.scaleY;
        a_PinContainer.addChild(a_pin);
        // ----- 2.2.2.2 エリアにおけるピンの画像の上に配置する四角の設置 -------------------------
        var a_pin_rect   = new createjs.Shape();
        a_pin_rect.graphics.beginFill("White");
        a_pin_rect.graphics.drawRect(0,0,pin1Size[0] * a_pin.scaleX,pin1Size[1] * a_pin.scaleY);      
        a_pin_rect.x     = a_pin.x;
        a_pin_rect.y     = a_pin.y;
        a_pin_rect.alpha = 0.0059; // *z 透明度の変更
        a_PinContainer.addChild(a_pin_rect);
        a_pins.push(a_pin_rect);//pinの上に係る四角形たちを入れる（クリック判定は透明の四角形）
      }
      outSidePins_r.push(a_pins);
      a_PageContainer.addChild(a_PinContainer);
      // ---- 2.2.3 各エリアに配置される「Generalへ戻る画像」の設置 -------------------------------
      var a_toGeneral = new createjs.Bitmap("./imgs/" + j_mapImgsData.GotoGeneralImg); // *p
      a_toGeneral.scaleX = gm_general.scaleX;
      a_toGeneral.scaleY = gm_general.scaleY;
      a_toGeneral.x = j_mapImgsData.OutsideAreas[i].goGeneral.x * gm_general.scaleX;
      a_toGeneral.y = j_mapImgsData.OutsideAreas[i].goGeneral.y * gm_general.scaleY;
      a_PageContainer.addChild(a_toGeneral);
      a_toGenerals.push(a_toGeneral);
      areaContainers.push(a_PageContainer);
    }

    // --- 3. 構内マップの配置 ----------------------------------------------------------------------------------------
    var InsideTopContainer = new createjs.Container();   // 構内マップで表示されるオブジェクトが格納されている。
    var cm_img             = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.top); // *p
    // --- 3.1 構内マップTOPの画像サイズの取得 ----------------------------------------------------
    var cm_size = await getImageSize(cm_img);
    var c_rects = []; // 構内から棟に
    // --- 3.2 canvasのサイズに構内マップTOP画像を合わせる ----------------------------------------
    if((canvasElement.width/cm_size[0]) * cm_size[1] > canvasElement.height){
      // 縦横比が合わないと高さがcanvasを超える問題の対処
      cm_img.scaleX = canvasElement.height / cm_size[1];
      cm_img.scaleY = cm_img.scaleX;
      cm_img.x = ( (canvasElement.width - cm_img.scaleY * cm_size[0])/2 );
    }else{
      // scale : 現在のcanvasSize / am_img.width 
      cm_img.scaleX = canvasElement.width / cm_size[0];
      cm_img.scaleY = cm_img.scaleX;
      cm_img.y = ( (canvasElement.height - cm_img.scaleX * cm_size[1])/2 );
    }
    InsideTopContainer.addChild(cm_img);
    // ---  3.2「構外への矢印画像」の設置 ---------------------------------------------------------
    var toOutsideArrow = new createjs.Bitmap("./imgs/" + j_mapImgsData.ToOutsideArrow); // *p
    // 位置、角度のセット
    toOutsideArrow.scaleX = gm_general.scaleX * 0.9;
    toOutsideArrow.scaleY = gm_general.scaleY * 0.9;
    toOutsideArrow.x      = 200 * gm_general.scaleX; // *z 座標を入れよう
    toOutsideArrow.y      = 50 * gm_general.scaleY; // *z
    InsideTopContainer.addChild(toOutsideArrow);
    // --- 3.3 構内から棟に飛ぶ時の四角 (吹き出しを出すものもある) --------------------------------
    for(var i=0;i<j_mapImgsData.Campus.buildingRects.length;i++){
      var c_rect   = new createjs.Shape();
      var j_rect   = j_mapImgsData.Campus.buildingRects[i];
      c_rect.graphics.beginFill("White");
      c_rect.graphics.drawRect(0,0,j_rect.width * gm_general.scaleX,j_rect.height * gm_general.scaleY);
      c_rect.x     = j_rect.x * gm_general.scaleX; // 位置座標セット
      c_rect.y     = j_rect.y * gm_general.scaleY; // 位置座標セット
      c_rect.alpha = 0.0059;                       // 透明度
      InsideTopContainer.addChild(c_rect);
      c_rects.push(c_rect);
    }
    // --- 3.4 構内マップに表示される吹き出し画像・吹き出しの上に表示されるオブジェクトの設置 -----
    var balloonContainers = []; // 吹き出しと同時に表示されるオブジェクトが格納される
    var c_balloons        = []; // 吹き出したち
    var c_balloonsRects   = []; // 吹き出しの上の全てのオブジェクト [吹き出し番号][吹き出し内番号]
    //吹き出しとその上に配置されるオブジェクトの配置
    for(var i=0;i<j_mapImgsData.Campus.balloons.length;i++){
      var BalloonContainer = new createjs.Container();                       // 吹き出しとその上に乗る四角が格納
      var j_balloon        = j_mapImgsData.Campus.balloons[i];
      var j_balloonRect    = j_mapImgsData.Campus.balloonRects[i]; 
      // ---- 3.4.1 吹き出し画像の設置 ------------------------------------------------------------
      var c_balloon        = new createjs.Bitmap("./imgs/" + j_balloon.img); // 吹き出し画像 // *p
      var c_balloonRects   = [];                                             // i番目吹き出しに載せられる四角たちが格納されている。
      c_balloon.scaleX     = gm_general.scaleX * 0.26; // *z スケール調整
      c_balloon.scaleY     = gm_general.scaleY *0.26; // *z
      c_balloon.x          = j_balloon.x * gm_general.scaleX;
      c_balloon.y          = j_balloon.y * gm_general.scaleY;
      BalloonContainer.addChild(c_balloon);
      c_balloons.push(c_balloon);
      // ---- 3.4.2 吹き出しの上の四角形たちの設置 ------------------------------------------------
      for(var j=0;j<j_balloonRect.length;j++){
        var c_balloonRect   = new createjs.Shape();
        c_balloonRect.graphics.beginFill("White");
        c_balloonRect.graphics.drawRect(0,0,j_balloonRect[j].width * gm_general.scaleX,j_balloonRect[j].height * gm_general.scaleY);
        c_balloonRect.x     = j_balloonRect[j].x * gm_general.scaleX; // 位置座標セット
        c_balloonRect.y     = j_balloonRect[j].y * gm_general.scaleY; // 位置座標セット
        c_balloonRect.alpha = 0.0059;                      // 透明度
        BalloonContainer.addChild(c_balloonRect);
        c_balloonRects.push(c_balloonRect);
      }
      c_balloonsRects.push(c_balloonRects);
      balloonContainers.push(BalloonContainer);
    }

    // --- 4. 棟と階のMAPの配置 ---------------------------------------------------------------------------------------
    var BuildingFloorContainers = []; // 棟・階のデータが格納されたコンテナが格納される[棟][階]
    var bfm_sizes_tmp           = []; // await時間短縮用 [棟][階]
    var bfm_sizes               = []; // 棟・階におけるマップ画像のサイズ[棟][階]
    var bf_toCampusTops         = []; // 構内マップTOPへ飛ぶ矢印 [棟][階]
    var bf_pins                 = []; // 構内の全てのピン格納用　bf_pins[棟][階][ピン番号]
    var bf_toUpper              = []; // 上の階へ [棟][階]
    var bf_toLower              = []; // 下の階へ [棟][階]
    /*
    棟・階は０から始まり、2.3.5.8棟しかフロアを表示しないため、プログラム上でのi棟j階は実際の値とは違う。
    その辺はJSONでも全て共通させている。イベントの検知～イベントに対応する処理で実際の階に結び付ける。
    棟（実際の棟）　     階  （実際の階） 
    0     (2)         0,1,2,3 (1,2,3,4)
    1     (3)         0,1,2,3 (1,2,3,4)
    2     (5)         0,1     (1,2)
    3     (8)         0,1     (1,2)
    */
    // --- 4.1 各フロア拡大画像のサイズの取得 -----------------------------------------------------
    for(var i=0;i<j_mapImgsData.Campus.buildings.length;i++){
      bfm_sizes_tmp[i] = []; // 2次元配列化
      for(var j=0;j<j_mapImgsData.Campus.buildings[i].floorImg.length;j++){
        var fm_img = new createjs.Bitmap("./imgs/"+ j_mapImgsData.Campus.buildings[i].floorImg[j]); // *p
        bfm_sizes_tmp[i][j] = getImageSize(fm_img);
      }
    }
    // await時間短縮
    for(var i=0;i<j_mapImgsData.Campus.buildings.length;i++){
      bfm_sizes[i]=[];
      for(var j=0;j<j_mapImgsData.Campus.buildings[i].floorImg.length;j++){
        bfm_sizes[i][j] = await bfm_sizes_tmp[i][j];
      }
    }
    // --- 4.2 各フロアオブジェクトの配置 ---------------------------------------------------------
    for(var i=0;i<j_mapImgsData.Campus.buildings.length;i++){
      var FloorContainers = []; // i棟のフロアデータが格納されたコンテナが入る
      bf_toCampusTops[i]  = []; // i棟の中にある全体への画像が格納される（後に.push）
      bf_toUpper[i]       = []; // 上の階へ [i棟][階]
      bf_toLower[i]       = []; // 下の階へ [i棟][階]
      var b_pins          = []; // 建物におけるピン画像が入る
      for(var j=0;j<j_mapImgsData.Campus.buildings[i].floorImg.length;j++){
        var FloorContainer = new createjs.Container(); // j階のオブジェクトが全て格納される
        // ---- 4.2.1 各フロアの拡大画像の配置 ----------------------------------------------------
        var fm_img         = new createjs.Bitmap("./imgs/"+ j_mapImgsData.Campus.buildings[i].floorImg[j]); // *p
        var fm_size        = bfm_sizes[i][j];
        // ---- 4.2.2 canvasのサイズに各フロア画像を合わせる。-------------------------------------
        if((canvasElement.width/fm_size[0]) * fm_size[1] > canvasElement.height){
          // 縦横比が合わないと高さがcanvasを超える問題の対処
          fm_img.scaleX = canvasElement.height / fm_size[1];
          fm_img.scaleY = fm_img.scaleX;
          fm_img.x = ( (canvasElement.width - fm_img.scaleY * fm_size[0])/2 );
        }else{
          // scale : 現在のcanvasSize / am_img.width 
          fm_img.scaleX = canvasElement.width / fm_size[0];
          fm_img.scaleY = fm_img.scaleX;
          fm_img.y = ( (canvasElement.height - fm_img.scaleX * fm_size[1])/2 );
        }
        FloorContainer.addChild(fm_img);
        // ---- 4.2.3 ピンの設置 ------------------------------------------------------------------
        var f_pins         = [];                       // i棟j階におけるピン画像が全て格納される 
        var f_PinContainer = new createjs.Container(); // i棟j階におけるピン画像が全て格納されたコンテナ
        // ---- 4.2.4 ピン画像・サイズの取得 ------------------------------------------------------
        var f_pin1Tmp = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1); // *p
        var f_pin1Size = await getImageSize(f_pin1Tmp); // pinの画像サイズを取得
        for(var k=0;k<j_mapImgsData.Campus.buildings[i].pins[j].length;k++){
          // ---- 4.2.5 ピン画像を設置 ------------------------------------------------------------
          var f_pin    = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1); // フロア内k番目のピン // *p
          f_pin.scaleX = gm_general.scaleX;
          f_pin.scaleY = gm_general.scaleY;
          f_pin.x      = j_mapImgsData.Campus.buildings[i].pins[j][k].x * gm_general.scaleX;
          f_pin.y      = j_mapImgsData.Campus.buildings[i].pins[j][k].y * gm_general.scaleY;
          f_PinContainer.addChild(f_pin);
          // ---- 4.2.6 ピン画像の上に配置する四角の設置 ------------------------------------------
          var f_pin_rect = new createjs.Shape();                                // フロア内k番目のピンの上に置く四角
          f_pin_rect.graphics.beginFill("White");
          f_pin_rect.graphics.drawRect(0,0,f_pin1Size[0] * f_pin.scaleX,f_pin1Size[1] * f_pin.scaleY);      
          f_pin_rect.x = f_pin.x;
          f_pin_rect.y = f_pin.y;
          f_pin_rect.alpha = 0.0059; // *z 透明度の変更
          f_PinContainer.addChild(f_pin_rect);
          f_pins.push(f_pin_rect);//pinの上に係る四角形たちを入れる（クリック判定は透明の四角形）
        }
        b_pins.push(f_pins);
        FloorContainer.addChild(f_PinContainer);
        // ---- 4.2.7 「上の階へ」「3階へ（8棟）」画像の設置 --------------------------------------
        /*
        建物の一番上など、上の階が存在しない所には設置しない。
        主に、jsonから設置する階データを検索し、配置している。
        */
        var f_goULcheck = 0; // 設置できたら1、設置しないなら0
        for(var k=0;k<j_mapImgsData.Campus.buildings[i].goUpper.length;k++){
          // このフロア(j)に上の階へのオブジェクトのデータが格納されていたら
          if(j_mapImgsData.Campus.buildings[i].goUpper[k].floor == j){
            // 上の階へbuttonの設置
            //8棟3階の処理　ここだけ3階への画像になる
            if(i== 3 && j == 0){
              bf_toUpper[i][j] = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.goUpperFloorImg_8); // *p
            }else{
              bf_toUpper[i][j] = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.goUpperFloorImg); // *p
            }
            bf_toUpper[i][j].scaleX = gm_general.scaleX;
            bf_toUpper[i][j].scaleY = gm_general.scaleY;
            bf_toUpper[i][j].x      = j_mapImgsData.Campus.buildings[i].goUpper[k].x * gm_general.scaleY;
            bf_toUpper[i][j].y      = j_mapImgsData.Campus.buildings[i].goUpper[k].y * gm_general.scaleY;
            FloorContainer.addChild(bf_toUpper[i][j]);
            f_goULcheck = 1;
          }
        }
        if(f_goULcheck == 0)bf_toUpper[i][j] = -1; // 上の階へがない場合-1を格納
        // ---- 4.2.8 「上の階へ」「1階へ（8棟）」画像の設置 --------------------------------------
        /*
        建物の一番下など、下の階が存在しない所には設置しない。
        主に、jsonから設置する階データを検索し、配置している。
        */
        f_goULcheck = 0; // 初期化
        for(var k=0;k<j_mapImgsData.Campus.buildings[i].goLower.length;k++){
          // このフロア(j)に下の階へのオブジェクトのデータが格納されていたら
          if(j_mapImgsData.Campus.buildings[i].goLower[k].floor == j){
            // 下の階へbuttonの設置
            if(i== 3 && j == 1){
              //8棟3階の処理　ここだけ1階への画像になる
              bf_toLower[i][j] = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.goLowerFloorImg_8); // *p
            }else{
              // それ以外の普通の棟
              bf_toLower[i][j] = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.goLowerFloorImg); // *p
            }
            bf_toLower[i][j].scaleX = gm_general.scaleX;
            bf_toLower[i][j].scaleY = gm_general.scaleY;
            bf_toLower[i][j].x      = j_mapImgsData.Campus.buildings[i].goLower[k].x * gm_general.scaleY;
            bf_toLower[i][j].y      = j_mapImgsData.Campus.buildings[i].goLower[k].y * gm_general.scaleY;
            FloorContainer.addChild(bf_toLower[i][j]);
            f_goULcheck = 1;
          }
        }
        if(f_goULcheck == 0)bf_toLower[i][j] = -1; // 下の階へがない場合-1を格納
        // ---- 4.2.9 「構内TOPへ」画像の設置 -----------------------------------------------------
        var f_toCampusTop = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.goTopArrow); // *p
        f_toCampusTop.scaleX = gm_general.scaleX;
        f_toCampusTop.scaleY = gm_general.scaleY;
        f_toCampusTop.x      = j_mapImgsData.Campus.buildings[i].goTop[j].x * gm_general.scaleX;
        f_toCampusTop.y      = j_mapImgsData.Campus.buildings[i].goTop[j].y * gm_general.scaleY;
        FloorContainer.addChild(f_toCampusTop);
        bf_toCampusTops[i].push(f_toCampusTop);
        FloorContainers.push(FloorContainer);
      }
      bf_pins.push(b_pins);
      bf_toCampusTops.push(bf_toCampusTops[i]); // forループ出たときi+1されるので-1をしている
      BuildingFloorContainers.push(FloorContainers);
    }
    bf_toCampusTops.pop(); // 末尾の要素を削除（末尾の要素が一つ多いエラーの削除）

    // :: イベントの検知 ----------------------------------------------------------------------------------------------
    var e_balloons        = []; //吹き出しが出ていれば 1 出ていなければ0
    var e_buildNum        = [2,3,5,8]; // 棟の実際の番号（イベント時に結びつける）
    var e_balloonBuildNum = [2,3,8]; // 吹き出しが存在する棟の番号
    for(var i=0;i<j_mapImgsData.Campus.balloons.length;i++)e_balloons.push(0);
    EventListener();　// Eventを感知して処理する関数

    // :: 初期状態にする。（構外全体MAPを表示）------------------------------------------------------------------------
    DisplayContainer.addChild(OutsideContainer);
    
    // -- イベントを感知して処理する関数 ------------------------------------------------------------------------------
    function EventListener(){
      // 1. 構内への矢印に対する処理
      toCampusArrow.addEventListener("click",GeneraltoCampusTop);
      // 2. 構外への矢印に対する処理
      toOutsideArrow.addEventListener("click",CampusToptoGeneral);
      // 3. エリアを示す四角に対する処理
      for(var i=0;i<g_rects.length;i++){
        g_rects[i].addEventListener("click",GeneraltoArea); 
        g_rects[i].eventParam = i ;
        // 4. エリア内にとんだときに全体エリアに飛ぶ処理
        a_toGenerals[i].addEventListener("click",AreatoGeneral);
        a_toGenerals[i].eventParam = i;
        // 5. 構外MAPピンに対する処理
        for(var j=0;j<j_mapImgsData.OutsideAreas[i].pins.length;j++){
          outSidePins_r[i][j].addEventListener("click",OutsideWriteInfo);
          outSidePins_r[i][j].eventParam  = i;
          outSidePins_r[i][j].eventParam2 = j;
        }
      }
      // 6. 構内の棟を示す四角に対する処理 >> 吹き出しの出現
      for(var i=0;i<c_rects.length;i++){
        //c_rects : 吹き出しを出すための四角
        c_rects[i].addEventListener("click",SetBalloon); // CampusTop to Buildings 
        c_rects[i].eventParam = i ;
      }
      // 7. 構内の吹き出しの中身に対する処理
      for(var i=0;i<c_balloons.length;i++){
        for(var j=0;j<c_balloonsRects[i].length;j++){
          c_balloonsRects[i][j].addEventListener("click",BalloontoCampus);
          c_balloonsRects[i][j].eventParam  = i;
          c_balloonsRects[i][j].eventParam2 = j;
        }
      }
      // 8. 構内TOPへに対する処理
      for(var i=0;i<bf_toCampusTops.length;i++){
        for(var j=0;j<bf_toCampusTops[i].length;j++){
          bf_toCampusTops[i][j].addEventListener("click",FloortoCampusTop);
          bf_toCampusTops[i][j].eventParam  = i;
          bf_toCampusTops[i][j].eventParam2 = j;
        }
      }
      // 9. 構内の各ピンに対する処理
      for(var i=0;i<bf_pins.length;i++){
        for(var j=0;j<bf_pins[i].length;j++){
          for(var k=0;k<bf_pins[i][j].length;k++){
            bf_pins[i][j][k].addEventListener("click",InsideWriteInfo);
            bf_pins[i][j][k].eventParam  = i;
            bf_pins[i][j][k].eventParam2 = j;
            bf_pins[i][j][k].eventParam3 = k;
          }
        }
      }
      // 10. 上の階へのボタンに対する処理
      for(var i=0;i<bf_toUpper.length;i++){
        for(var j=0;j<bf_toUpper[i].length;j++){
          if(bf_toUpper[i][j]!=-1){
            bf_toUpper[i][j].addEventListener("click",FloortoUpperFloor);
            bf_toUpper[i][j].eventParam  = i;
            bf_toUpper[i][j].eventParam2 = j;
          }
        }
      }
      // 11. 下の階へのボタンに対する処理
      for(var i=0;i<bf_toLower.length;i++){
        for(var j=0;j<bf_toLower[i].length;j++){
          if(bf_toLower[i][j]!=-1){
            bf_toLower[i][j].addEventListener("click",FloortoLowerFloor);
            bf_toLower[i][j].eventParam  = i;
            bf_toLower[i][j].eventParam2 = j;
          }
        }
      }
    }//ここまでEventListener
    // :: イベントに対する処理　関数群 --------------------------------------------------------------------------------
    // 全体画面から各エリアへ飛ぶ -------------------------------------------------------
    function GeneraltoArea(event){
      var i = event.target.eventParam;
      MapChange(OutsideContainer,areaContainers[i]);
    }
    // 構外の各エリアから全体へ ---------------------------------------------------------
    function AreatoGeneral(event){
      var i = event.target.eventParam;
      MapChange(areaContainers[i],OutsideContainer);
    }
    // 全体から構内topへ ---------------------------------------------------------------
    function GeneraltoCampusTop(event){
      //MapChange(OutsideContainer,InsideTopContainer);
      MapChangeAnimation_Slide(OutsideContainer,InsideTopContainer,"right");
    }
    // 構内Topから全体へ ----------------------------------------------------------------
    function CampusToptoGeneral(event){
      // 吹き出しが出ていたらそれを消す
      for(var k=0;k<c_balloons.length;k++){
        if(e_balloons[k] == 1){
          InsideTopContainer.removeChild(balloonContainers[k]);
          e_balloons[k] = 0;
        }
      }
      //MapChange(InsideTopContainer,OutsideContainer);
      MapChangeAnimation_Slide(InsideTopContainer,OutsideContainer,"left");      
    }
    // 構内Topから吹き出しを出力 --------------------------------------------------------
    function SetBalloon(event){
      var i = event.target.eventParam;
      // 吹き出しに対応していなければその棟の1階にジャンプ
      var check = false;
      var e_balloonTarget; // 吹き出し対応リストの添え字（吹き出し対応のみ）
      for(var j=0;j<e_balloonBuildNum.length;j++){
        if(e_balloonBuildNum[j] == e_buildNum[i]){
          // 吹き出しに対応していたら
          // j : 棟番号がiのときの吹き出し対応リストの添え字
          e_balloonTarget = j ;
          check = true;
          break;
        }
      }
      if(check==false){
        // 吹き出しに対応していないオブジェクト（5棟など）
        MapChange(InsideTopContainer,BuildingFloorContainers[i][0]);
        return;
      }
      // すでに出ている吹き出しをクリックしたとき
      if(e_balloons[e_balloonTarget] == 1){
        InsideTopContainer.removeChild(balloonContainers[e_balloonTarget]);
        e_balloons[e_balloonTarget] = 0;
        return;
      }
      // クリックしたときにほかの吹き出しが開いていた時
      for(var j=0;j<c_balloons.length;j++){
        if(e_balloons[j] == 1){
          InsideTopContainer.removeChild(balloonContainers[j]);
          e_balloons[j] = 0;
        }
      }
      InsideTopContainer.addChild(balloonContainers[e_balloonTarget]);
      e_balloons[e_balloonTarget] = 1;
    }
    // 吹き出しから各棟の階へ -----------------------------------------------------------
    function BalloontoCampus(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      // e_ballons[i] 棟の吹き出しのj階をクリックした
      //console.log(String(e_balloonBuildNum[i])+"棟の"+String(j)+"階をクリックしました");
      // i,jをBuildingFloorContainerないの適切な値に変更する
      //e_balloonBuildNum = [2,3,8] >> BuildingFloorContainers[i] = [0,1,3]  (2は5棟)
      var buildingIndex = [0,1,3]; //吹き出しから飛べる棟番号(e_balloonBuildNumに対応)
      // 今開いている吹き出しを検索して閉じる
      for(var k=0;k<c_balloons.length;k++){
        if(e_balloons[k] == 1){
          InsideTopContainer.removeChild(balloonContainers[k]);
          e_balloons[k] = 0;
        }
      }
      //MapChange(InsideTopContainer,BuildingFloorContainers[buildingIndex[i]][j]);
      MapChangeAnimation_Fade(InsideTopContainer,BuildingFloorContainers[buildingIndex[i]][j])
    }
    // フロアから構内のトップへ ---------------------------------------------------------
    function FloortoCampusTop(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      //MapChange(BuildingFloorContainers[i][j],InsideTopContainer);
      MapChangeAnimation_Slide(BuildingFloorContainers[i][j],InsideTopContainer,"left");      
    }
    // 上の階へ -------------------------------------------------------------------------
    function FloortoUpperFloor(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      if(bf_toUpper[i][j]==-1)return;
      // MapChange(BuildingFloorContainers[i][j],BuildingFloorContainers[i][j+1]);
      MapChangeAnimation_Slide(BuildingFloorContainers[i][j],BuildingFloorContainers[i][j+1],"top");
    }
    // 下の階へ -------------------------------------------------------------------------
    function FloortoLowerFloor(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      if(bf_toLower[i][j]==-1)return;
      //MapChange(BuildingFloorContainers[i][j],BuildingFloorContainers[i][j-1]);
      MapChangeAnimation_Slide(BuildingFloorContainers[i][j],BuildingFloorContainers[i][j-1],"bottom");
    }
    // DOMに情報を書き込む（構外）-------------------------------------------------------
    function OutsideWriteInfo(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      h_shopname.textContent = "エリア"+g_areaTexts[i]+"の"+j+"番目";
    }
    // DOMに情報を書き込む（構内）-------------------------------------------------------
    function InsideWriteInfo(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      var k = event.target.eventParam3;
      h_shopname.textContent = i+"棟"+j+"階の"+k+"番目のピン";
    }
    // ここまでイベントに対する処理の関数群 ---------------------------------------------------------------------------

    // ページ切り替えについての関数群 ---------------------------------------------------------------------------------
    // 現在のページから次のページに切り替わる -------------------------------------------
    function MapChange(CurrentContainer,NextContainer){
      DisplayContainer.removeChild(CurrentContainer);
      DisplayContainer.addChild(NextContainer);
    }
    // 現在のページから次のページに切り替わる （フェードアニメーション）-----------------
    function MapChangeAnimation_Fade(CurrentContainer,NextContainer){
      var TimeLine   = new createjs.Timeline(); // タイムライン
      var changetime = 600; // アニメーションにかかる時間（ms)
      // 現在のページの処理
      TimeLine.addTween(
        // changetime[ms]をかけて現在のページの透明度を０にする
        createjs.Tween.get(CurrentContainer,{override:false})
          .to({alpha:0},changetime)
          .call(function(){
            // アニメーションが終了したら現在のページを消す(透明度を元に戻しておく)
            CurrentContainer.alpha = 1;
            DisplayContainer.removeChild(CurrentContainer);
          })
      );
      // 次のページの処理
      NextContainer.alpha = 0;
      DisplayContainer.addChild(NextContainer);
      TimeLine.addTween(
        // changetime[ms]をかけて現在の透明度を１にする
        createjs.Tween.get(NextContainer,{oevrride:true})
          .to({alpha:1},changetime)
      )
      TimeLine.gotoAndPlay("start");
    }
    // 現在のページから次のページに切り替わる （スライドアニメーション）-----------------
    function MapChangeAnimation_Slide(CurrentContainer,NextContainer,direction){
      /*
      direction : top    : 上の階に行くときに使う。
      direction : bottom : 下の階へ行くときに使う。
      direction : left   : 構外マップへ行くとき
      direction : right  : 構内マップへ行くとき
      */
      var TimeLine   = new createjs.Timeline(); // タイムライン
      var changetime = 600; // アニメーションにかかる時間（ms)
      // direction : 方向別に処理を分ける
      switch(direction){
        case "top":
          // 現在のページの処理
          TimeLine.addTween(
            // changetime[ms]で下方向に移動させる
            createjs.Tween.get(CurrentContainer,{override:false},changetime)
              .to({y:canvasElement.height},changetime,createjs.Ease.cubicInOut)
              .call(function(){
                // アニメーション終了時に現在表示していたマップの座標を0に戻し、消す
                CurrentContainer.y=0;
                DisplayContainer.removeChild(CurrentContainer);
              })
          );
          // 次のページの処理
          // 初期化
          NextContainer.y = -1 * canvasElement.height;
          DisplayContainer.addChild(NextContainer);
          TimeLine.addTween(
            createjs.Tween.get(NextContainer,{override:false})
              // changetime[ms]で下方向に移動させる
              .to({y:0},changetime,createjs.Ease.cubicInOut)
          );
          break;
        case "bottom":
          // 現在のページの処理
          TimeLine.addTween(
            // changetime[ms]で上方向に移動させる
            createjs.Tween.get(CurrentContainer,{override:false},changetime)
              .to({y:-1*canvasElement.height},changetime,createjs.Ease.cubicInOut)
              .call(function(){
                // アニメーション終了時に現在表示していたマップの座標を0に戻し、消す
                CurrentContainer.y=0;
                DisplayContainer.removeChild(CurrentContainer);
              })
          );
          // 次のページの処理
          // 初期化
          NextContainer.y = canvasElement.height;
          DisplayContainer.addChild(NextContainer);
          TimeLine.addTween(
            createjs.Tween.get(NextContainer,{override:false})
              // changetime[ms]で上方向に移動させる
              .to({y:0},changetime,createjs.Ease.cubicInOut)
          );
          break;
        case "right":
          // 現在のページの処理
          TimeLine.addTween(
            // changetime[ms]で左方向に移動させる
            createjs.Tween.get(CurrentContainer,{override:false},changetime)
              .to({x:-1*canvasElement.width},changetime,createjs.Ease.cubicInOut)
              .call(function(){
                // アニメーション終了時に現在表示していたマップの座標を0に戻し、消す
                CurrentContainer.x=0;
                DisplayContainer.removeChild(CurrentContainer);
              })
          );
          // 次のページの処理
          // 初期化
          NextContainer.x = canvasElement.width;
          DisplayContainer.addChild(NextContainer);
          TimeLine.addTween(
            createjs.Tween.get(NextContainer,{override:false})
              // changetime[ms]で左方向に移動させる
              .to({x:0},changetime,createjs.Ease.cubicInOut)
          );
          break;
        case "left":
          // 現在のページの処理
          TimeLine.addTween(
            // changetime[ms]で右方向に移動させる
            createjs.Tween.get(CurrentContainer,{override:false},changetime)
              .to({x:canvasElement.width},changetime,createjs.Ease.cubicInOut)
              .call(function(){
                // アニメーション終了時に現在表示していたマップの座標を0に戻し、消す
                CurrentContainer.x=0;
                DisplayContainer.removeChild(CurrentContainer);
              })
          );
          // 次のページの処理
          // 初期化
          NextContainer.x = -1 * canvasElement.width;
          DisplayContainer.addChild(NextContainer);
          TimeLine.addTween(
            createjs.Tween.get(NextContainer,{override:false})
              // changetime[ms]で右方向に移動させる
              .to({x:0},changetime,createjs.Ease.cubicInOut)
          );
          break;
      }
      TimeLine.gotoAndPlay("start");
    }
    // ここまでMAP切り替えの関数群 ------------------------------------------------------------------------------------
  }
  // ここまでmain ----------------------------------------------------------------------------------------------------
  // リサイズ時の処理 -------------------------------------------------------------------
  window.addEventListener('resize' , function(){
    (!window.requestAnimationFrame) ? this.setTimeout(Sizing) : window,requestAnimationFrame(Sizing);
  });
  // 画面更新 ---------------------------------------------------------------------------
  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.on("tick",function(){
    stage.update();
    DisplayContainer.updateCache();
  });
}