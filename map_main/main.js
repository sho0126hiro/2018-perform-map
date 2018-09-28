/*
変数命名規則
g_-- : 全体マップにおくオブジェクト
j_-- : JSONから持ってきたデータ
a_-- : 外・エリアごとに配置するオブジェクト
c_-- : 構内マップにおくオブジェクト
f_-- : 構内のフロア内オブジェクト
m_-- : MAP画像
h_-- : html(DOM)
e_-- : eventチェック用
d_-- : デバッグ用
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
    {"src":"./JSON/mapImgData1.json","id":"mapImgs"}
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
  var h_shopname  = document.getElementById("shopname");
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
  // --- canvasのサイズを変更する　使わないかも
  function ChangeCanvasSize(width,height){
    canvasElement.style.width = width;
    canvasElement.style.height = height;
  }
  // -- main asyncなのでawaitで非同期処理を同期的に書ける
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
    var OutsideContainer = new createjs.Container(); // 構外マップで表示されるオブジェクトが格納されている。
    var areaContainers   = []; // 各エリアのデータがA,B,C,D,E,F,の順で格納される。
    var g_rects          = [];
    var am_sizes_tmp     = []; // await時間短縮用
    var am_sizes         = []; // エリアごとに分けたときの画像のサイズが入っている。
    var am_imgs          = []; // エリアごとに分けたときの画像が入っている。
    var a_toGenerals     = []; //エリアから全体に戻るときの画像が入っている。
    var outSidePins_r    = []; //校外のピンたち（outSidePins[Area][num]) 本当はその上に隠れている四角
    var InsideTopContainer = new createjs.Container();// 構内マップで表示されるオブジェクトが格納されている。
    // :: 全体マップの配置 -------------------------------------------------------------------
    OutsideContainer.addChild(gm_general); // MAP画像を構外格納用コンテナの格納
    var g_areaTexts = ["A","B","C","D","E","F"];
    // エリア分け用の四角の配置
    for(i=0;i<j_mapImgsData.AreaRects.length;i++){
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
    var toCampusArrow = new createjs.Bitmap("./imgs/" + j_mapImgsData.ToCampusArrow); // *p
    // 位置、角度のセット
    toCampusArrow.scaleX = gm_general.scaleX * 0.8;
    toCampusArrow.scaleY = gm_general.scaleY * 0.8;
    toCampusArrow.x        = 3000 * gm_general.scaleX; // *z 座標を入れよう
    toCampusArrow.y        = 300 * gm_general.scaleY; // *z
    OutsideContainer.addChild(toCampusArrow);
    // :: 小エリアの配置 -------------------------------------------------------------------
    // 各エリアの拡大画像の大きさの取得
    for(i=0;i<j_mapImgsData.OutsideAreas.length;i++){
      var am_img = new createjs.Bitmap("./imgs/" + j_mapImgsData.OutsideAreas[i].img);
      am_sizes_tmp[i] = getImageSize(am_img);
    }
    for(i=0;i<j_mapImgsData.OutsideAreas.length;i++)am_sizes[i] = await am_sizes_tmp[i];
    //小エリア内オブジェクトの配置
    for(i=0;i<j_mapImgsData.OutsideAreas.length;i++){
      // a_ : エリア分けされたもの
      var a_PageContainer =  new createjs.Container(); // i番目のエリアのデータが全部入る
      var a_PinContainer = new createjs.Container(); // ピンがいっぱい入る
      // 各エリアの拡大画像の配置 // *p
      var am_img = new createjs.Bitmap("./imgs/" + j_mapImgsData.OutsideAreas[i].img);
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
        am_img.y = ( (canvasElement.height - am_img.scaleX * am_size[1])/2 );
      }
      a_PageContainer.addChild(am_img);
      var a_pins =[]; // AreaPins
      var a_pin1Tmp = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1);
      var pin1Size = await getImageSize(a_pin1Tmp); // pinの画像サイズを取得
      for(j=0;j<j_mapImgsData.OutsideAreas[i].pins.length;j++){
        var a_pin = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1);
        a_pin.scaleX = gm_general.scaleX;
        a_pin.scaleY = gm_general.scaleY;
        a_pin.x = j_mapImgsData.OutsideAreas[i].pins[j].x * gm_general.scaleX;
        a_pin.y = j_mapImgsData.OutsideAreas[i].pins[j].y * gm_general.scaleY;
        a_PinContainer.addChild(a_pin);
        var a_pin_rect = new createjs.Shape();
        a_pin_rect.graphics.beginFill("DarkRed");
        a_pin_rect.graphics.drawRect(0,0,pin1Size[0] * a_pin.scaleX,pin1Size[1] * a_pin.scaleY);      
        a_pin_rect.x = a_pin.x;
        a_pin_rect.y = a_pin.y;
        a_pin_rect.alpha = 0.0059; // *z 透明度の変更
        a_PinContainer.addChild(a_pin_rect);
        a_pins.push(a_pin_rect);//pinの上に係る四角形たちを入れる（クリック判定は透明の四角形）
      }
      outSidePins_r.push(a_pins);
      a_PageContainer.addChild(a_PinContainer);
      // Generalへ戻る画像の配置
      var a_toGeneral = new createjs.Bitmap("./imgs/" + j_mapImgsData.GotoGeneralImg);
      a_toGeneral.scaleX = gm_general.scaleX;
      a_toGeneral.scaleY = gm_general.scaleY;
      a_toGeneral.x = j_mapImgsData.OutsideAreas[i].goGeneral.x * gm_general.scaleX;
      a_toGeneral.y = j_mapImgsData.OutsideAreas[i].goGeneral.y * gm_general.scaleY;
      a_PageContainer.addChild(a_toGeneral);
      a_toGenerals.push(a_toGeneral);
      areaContainers.push(a_PageContainer);
    }
    // :: 構内マップの配置 -------------------------------------------------------------------
    var cm_img = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.top);
    var cm_size = await getImageSize(cm_img);
    var c_rects = [];
    // canvasのサイズに画像を合わせる。
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
    // :: 構外へ、の矢印
    var toOutsideArrow = new createjs.Bitmap("./imgs/" + j_mapImgsData.ToOutsideArrow); // *p
    // 位置、角度のセット
    toOutsideArrow.scaleX = gm_general.scaleX * 1;
    toOutsideArrow.scaleY = gm_general.scaleY * 1;
    toOutsideArrow.x      = 250 * gm_general.scaleX; // *z 座標を入れよう
    toOutsideArrow.y      = 100 * gm_general.scaleY; // *z
    InsideTopContainer.addChild(toOutsideArrow);
    // :: 構内棟ごとのエリア
    for(i=0;i<j_mapImgsData.Campus.buildingRects.length;i++){
      var c_rect = new createjs.Shape();
      var j_rect = j_mapImgsData.Campus.buildingRects[i];
      c_rect.graphics.beginFill("DarkRed");
      c_rect.graphics.drawRect(0,0,j_rect.width * gm_general.scaleX,j_rect.height * gm_general.scaleY);
      c_rect.x = j_rect.x * gm_general.scaleX; // 位置座標セット
      c_rect.y = j_rect.y * gm_general.scaleY; // 位置座標セット
      c_rect.alpha = 0.5;                   // 透明度      
      c_rect.alpha = 0.0059;                   // 透明度
      InsideTopContainer.addChild(c_rect);
      c_rects.push(c_rect);
    }
    // :: 構内マップに表示される吹き出し
    var balloonContainers = []; // 吹き出しと同時に表示されるオブジェクトが格納される
    var c_balloons = []; // 吹き出したち
    var c_balloonsRects = []; // 吹き出しの上の全てのオブジェクト [吹き出し番号][吹き出し内番号]
    //吹き出しとその上に配置されるオブジェクトの配置
    for(i=0;i<j_mapImgsData.Campus.balloons.length;i++){
      //吹き出しの配置
      var BalloonContainer = new createjs.Container();
      var j_balloon = j_mapImgsData.Campus.balloons[i];
      var j_balloonRect = j_mapImgsData.Campus.balloonRects[i];
      var c_balloon = new createjs.Bitmap("./imgs/" + j_balloon.img);
      var c_balloonRects = []; // i番目吹き出しに載せられる四角たちが格納されている。
      c_balloon.scaleX = gm_general.scaleX * 0.26; // *z スケール調整
      c_balloon.scaleY = gm_general.scaleY *0.26; // *z
      c_balloon.x = j_balloon.x * gm_general.scaleX;
      c_balloon.y = j_balloon.y * gm_general.scaleY;
      BalloonContainer.addChild(c_balloon);
      c_balloons.push(c_balloon);
      // 吹き出しの上の四角形たちの配置
      for(j=0;j<j_balloonRect.length;j++){
        var c_balloonRect = new createjs.Shape();
        c_balloonRect.graphics.beginFill("DarkRed"); // ** あとで色を消す
        c_balloonRect.graphics.drawRect(0,0,j_balloonRect[j].width * gm_general.scaleX,j_balloonRect[j].height * gm_general.scaleY);
        c_balloonRect.x = j_balloonRect[j].x * gm_general.scaleX; // 位置座標セット
        c_balloonRect.y = j_balloonRect[j].y * gm_general.scaleY; // 位置座標セット
        c_balloonRect.alpha = 0.0059;                      // 透明度
        BalloonContainer.addChild(c_balloonRect);
        c_balloonRects.push(c_balloonRect);
      }
      c_balloonsRects.push(c_balloonRects);
      balloonContainers.push(BalloonContainer);
    }
    // 棟と階のMAPの配置
    var BuildingFloorContainers = [];
    var bfm_sizes_tmp = []; // await時間短縮用
    var bfm_sizes = []; // await時間短縮用
    var bf_toCampusTops = []; // 構内マップTOPへ飛ぶ矢印
    var bf_pins = []; // 構内の全てのピン格納用　bf_pins[棟][階][ピン番号]
    //各フロア拡大画像のサイズの取得
    for(i=0;i<j_mapImgsData.Campus.buildings.length;i++){
      bfm_sizes_tmp[i] = []; // 2次元配列化
      for(j=0;j<j_mapImgsData.Campus.buildings[i].floorImg.length;j++){
        var fm_img = new createjs.Bitmap("./imgs/"+ j_mapImgsData.Campus.buildings[i].floorImg[j]);
        bfm_sizes_tmp[i][j] = getImageSize(fm_img);
      }
    }
    for(i=0;i<j_mapImgsData.Campus.buildings.length;i++){
      bfm_sizes[i]=[];
      for(j=0;j<j_mapImgsData.Campus.buildings[i].floorImg.length;j++){
        bfm_sizes[i][j] = await bfm_sizes_tmp[i][j];
      }
    }
    //各フロアオブジェクトの配置
    for(i=0;i<j_mapImgsData.Campus.buildings.length;i++){
      var FloorContainers = []; 
      bf_toCampusTops[i] = []; //i棟の中にある全体への画像が格納される（後に.push）
      var b_pins = [];     
      for(j=0;j<j_mapImgsData.Campus.buildings[i].floorImg.length;j++){
        var FloorContainer = new createjs.Container();
        // 各フロアの拡大画像の配置 // *p
        var fm_img = new createjs.Bitmap("./imgs/"+ j_mapImgsData.Campus.buildings[i].floorImg[j]);
        var fm_size = bfm_sizes[i][j];
        // canvasのサイズに画像を合わせる。
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
        // ピンの処理
        var f_pins =[]; 
        var f_PinContainer = new createjs.Container();
        var f_pin1Tmp = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1);
        var f_pin1Size = await getImageSize(f_pin1Tmp); // pinの画像サイズを取得
        for(k=0;k<j_mapImgsData.Campus.buildings[i].pins[j].length;k++){
          var f_pin = new createjs.Bitmap("./imgs/"+j_mapImgsData.PinImg_1);
          f_pin.scaleX = gm_general.scaleX;
          f_pin.scaleY = gm_general.scaleY;
          f_pin.x = j_mapImgsData.Campus.buildings[i].pins[j][k].x * gm_general.scaleX;
          f_pin.y = j_mapImgsData.Campus.buildings[i].pins[j][k].y * gm_general.scaleY;
          f_PinContainer.addChild(f_pin);
          var f_pin_rect = new createjs.Shape();
          f_pin_rect.graphics.beginFill("DarkRed");
          f_pin_rect.graphics.drawRect(0,0,f_pin1Size[0] * f_pin.scaleX,f_pin1Size[1] * f_pin.scaleY);      
          f_pin_rect.x = f_pin.x;
          f_pin_rect.y = f_pin.y;
          f_pin_rect.alpha = 0.0059; // *z 透明度の変更
          f_PinContainer.addChild(f_pin_rect);
          f_pins.push(f_pin_rect);//pinの上に係る四角形たちを入れる（クリック判定は透明の四角形）
        }
        b_pins.push(f_pins);
        FloorContainer.addChild(f_PinContainer);
        // 上の階へ
        // 下の階へ
        // 構内TOPへの画像の配置 // *p
        var f_toCampusTop = new createjs.Bitmap("./imgs/" + j_mapImgsData.Campus.goTopArrow);
        f_toCampusTop.scaleX = gm_general.scaleX;
        f_toCampusTop.scaleY = gm_general.scaleY;
        f_toCampusTop.x = j_mapImgsData.Campus.buildings[i].goTop[j].x * gm_general.scaleX;
        f_toCampusTop.y = j_mapImgsData.Campus.buildings[i].goTop[j].y * gm_general.scaleY;
        FloorContainer.addChild(f_toCampusTop);
        bf_toCampusTops[i].push(f_toCampusTop);
        FloorContainers.push(FloorContainer);
      }
      bf_pins.push(b_pins);
      bf_toCampusTops.push(bf_toCampusTops[i]); // forループ出たときi+1されるので-1をしている
      BuildingFloorContainers.push(FloorContainers);
      //console.log(bf_toCampusTops);
    }
    bf_toCampusTops.pop(); // 末尾の要素を削除
    //console.log(bf_toCampusTops);
    //console.log(BuildingFloorContainers);
    //event
    var e_balloons = []; //吹き出しが出ていれば 1 出ていなければ0
    var e_buildNum = [2,3,5,8]; // 棟の番号
    var e_balloonBuildNum = [2,3,8]; // 吹き出しが存在する棟の番号
    for(i=0;i<j_mapImgsData.Campus.balloons.length;i++)e_balloons.push(0);
    EventListener();
    // :: 初期状態にする。
    // :: 全体MAPを表示する。
    DisplayContainer.addChild(OutsideContainer);
    //DisplayContainer.addChild(InsideTopContainer);
    //d_DisplayContainerInit(BuildingFloorContainers[0][1]);
    // -- eventListener
    function EventListener(){
      // 構内への矢印に対する処理
      toCampusArrow.addEventListener("click",GeneraltoCampusTop);
      // 構外への矢印に対する処理
      toOutsideArrow.addEventListener("click",CampusToptoGeneral);
      //エリアを示す四角に対する処理
      for(i=0;i<g_rects.length;i++){
        g_rects[i].addEventListener("click",GeneraltoArea); 
        g_rects[i].eventParam = i ;
        //エリア内にとんだときに全体エリアに飛ぶ処理
        a_toGenerals[i].addEventListener("click",AreatoGeneral);
        a_toGenerals[i].eventParam = i;
        // 構外MAPピンに対する処理
        for(j=0;j<j_mapImgsData.OutsideAreas[i].pins.length;j++){
          outSidePins_r[i][j].addEventListener("click",OutsideWriteInfo);
          outSidePins_r[i][j].eventParam  = i;
          outSidePins_r[i][j].eventParam2 = j;
        }
      }
      //構内の棟を示す四角に対する処理 >> 吹き出しの出現
      for(i=0;i<c_rects.length;i++){
        //c_rects : 吹き出しを出すための四角
        c_rects[i].addEventListener("click",SetBalloon); // CampusTop to Buildings 
        c_rects[i].eventParam = i ;
      }
      //構内の吹き出しの中身に対する処理
      for(i=0;i<c_balloons.length;i++){
        for(j=0;j<c_balloonsRects[i].length;j++){
          c_balloonsRects[i][j].addEventListener("click",BalloontoCampus);
          c_balloonsRects[i][j].eventParam = i;
          c_balloonsRects[i][j].eventParam2 = j;
        }
      }
      // 構内TOPへに対する処理
      for(i=0;i<bf_toCampusTops.length;i++){
        for(j=0;j<bf_toCampusTops[i].length;j++){
          bf_toCampusTops[i][j].addEventListener("click",FloortoCampusTop);
          bf_toCampusTops[i][j].eventParam = i;
          bf_toCampusTops[i][j].eventParam2 = j;
        }
      }
      // 構内の各ピンに対する処理
      for(i=0;i<bf_pins.length;i++){
        for(j=0;j<bf_pins[i].length;j++){
          for(k=0;k<bf_pins[i][j].length;k++){
            bf_pins[i][j][k].addEventListener("click",InsideWriteInfo);
            bf_pins[i][j][k].eventParam = i;
            bf_pins[i][j][k].eventParam2 = j;
            bf_pins[i][j][k].eventParam3 = k;
          }
        }
      }
      // 上の階へのボタンに対する処理
      // 下の階へのボタンに対する処理
    }//ここまでEventListener

    // 全体画面から各エリアへ飛ぶ
    function GeneraltoArea(event){
      var i = event.target.eventParam;
      MapChange(OutsideContainer,areaContainers[i]);
    }
    // 構外の各エリアから全体へ
    function AreatoGeneral(event){
      var i = event.target.eventParam;
      MapChange(areaContainers[i],OutsideContainer);
    }
    // 全体から構内topへ
    function GeneraltoCampusTop(event){
      MapChange(OutsideContainer,InsideTopContainer);
    }
    // 構内Topから全体へ
    function CampusToptoGeneral(event){
      MapChange(InsideTopContainer,OutsideContainer);
    }
    // 構内Topから吹き出しを出力
    function SetBalloon(event){
      var i = event.target.eventParam;
      // 吹き出しに対応していなければその棟の1階にジャンプ
      var check=false;
      var e_balloonTarget; // 吹き出し対応リストの添え字（吹き出し対応のみ）
      for(j=0;j<e_balloonBuildNum.length;j++){
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
      //console.log(e_balloonTarget);
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
          e_balloons[j] =0;
        }
      }
      InsideTopContainer.addChild(balloonContainers[e_balloonTarget]);
      e_balloons[e_balloonTarget] = 1;
    }
    // 吹き出しから各棟の階へ
    function BalloontoCampus(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      // e_ballons[i] 棟の吹き出しのj階をクリックした
      //console.log(String(e_balloonBuildNum[i])+"棟の"+String(j)+"階をクリックしました");
      // i,jをBuildingFloorContainerないの適切な値に変更する
      //e_balloonBuildNum = [2,3,8] >> BuildingFloorContainers[i] = [0,1,3]  (2は5棟)
      var buildingIndex = [0,1,3]; //吹き出しから飛べる棟番号(e_balloonBuildNumに対応)
      // 今開いている吹き出しを検索して閉じる
      for(k=0;k<c_balloons.length;k++){
        if(e_balloons[k] == 1){
          InsideTopContainer.removeChild(balloonContainers[k]);
          e_balloons[k] =0;
        }
      }
      MapChange(InsideTopContainer,BuildingFloorContainers[buildingIndex[i]][j]);
    }
    // フロアから構内のトップへ
    function FloortoCampusTop(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      var buildingIndex = [0,1,3]; //吹き出しから飛べる棟番号(e_balloonBuildNumに対応)
      MapChange(BuildingFloorContainers[i][j],InsideTopContainer);
    }
    // 現在のページから次のページに切り替わる >>
    function MapChange(CurrentContainer,NextContainer){
      DisplayContainer.removeChild(CurrentContainer);
      DisplayContainer.addChild(NextContainer);
    }
    // 情報を書き込む（DOM出力）
    function OutsideWriteInfo(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      h_shopname.textContent = "エリア"+g_areaTexts[i]+"の"+j+"番目";
    }
    //
    function InsideWriteInfo(event){
      var i = event.target.eventParam;
      var j = event.target.eventParam2;
      var k = event.target.eventParam3;
      h_shopname.textContent = i+"棟"+j+"階の"+k+"番目のピン";
    }
    // debug用 DisplayContainerに最初に格納する要素を入れる
    function d_DisplayContainerInit(initContainer){
      DisplayContainer.addChild(initContainer);
    }
    function d_UpdateCache(Container){
      Container.updateCache();
    }
    // 画面更新
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.on("tick",function(){
      stage.update();
      DisplayContainer.updateCache();
    });
  }// ここまでmain
  //Resize
  window.addEventListener('resize' , function(){
    (!window.requestAnimationFrame) ? this.setTimeout(Sizing) : window,requestAnimationFrame(Sizing);
  });
  
}