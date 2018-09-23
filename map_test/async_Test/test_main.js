window.addEventListener("load",init);

function init() {
  // Canvas / Stage 定義
  var canvasContainer = document.getElementById("wrap");
  var canvasElement = document.getElementById("myCanvas");
  // サイズ調整
  var Sizing = function(){
    canvasElement.height = canvasContainer.offsetHeight;
    canvasElement.width  = canvasContainer.offsetWidth;
  };
  Sizing();
  // stageの宣言
  var stage = new createjs.StageGL(canvasElement);
  stage.setClearColor('#FFFFFF');
  // 画像の読み込み
  var bmp = new createjs.Bitmap("./../imgs/base.png");
  //画像を画面いっぱいのサイズに
  SizeMaxBitmap(bmp);
  // rectの宣言
  var rect = new createjs.Shape();
  rect.graphics.beginFill("DarkRed"); // 赤色で描画するように設定
  rect.graphics.drawRect(0, 0, 100, 200);
  // async - await
  function GetBitmapWidth(bmp){
    return new Promise((resolve,reject) => {
      bmp.image.onload = function(){
        resolve(bmp.width);
      };
    });
  }
  async function SizeMaxBitmap(bmp){
    const bmp1 = GetBitmapWidth(bmp);
    const width1 = await bmp1;
    // widthがこの下から使えるぞ
    bmp.scaleX = canvasElement.width / width1;
    bmp.scaleY = bmp.scaleX;
    rect.x = bmp.x * bmp.scaleX + parseInt(420);
    rect.y =bmp.y * bmp.scale+parseInt(200);
    rect.alpha = 0.5;
  }
  var rectContainer   = new createjs.Container();
  rectContainer.addChild(rect);
  var DisplayContainer = new createjs.Container();
  DisplayContainer.addChild(bmp);
  DisplayContainer.addChild(rectContainer);
  DisplayContainer.cache(0,0,2000,2000);
  stage.addChild(DisplayContainer);
  rect.addEventListener("click",handleClick);
  //Resize
  window.addEventListener('resize' , function(){
    (!window.requestAnimationFrame) ? this.setTimeout(Sizing) : window,requestAnimationFrame(Sizing);
  })
  // 画面更新
  createjs.Ticker.on("tick",function(){
    stage.update();
    DisplayContainer.updateCache();
  });    
  // Click
  function handleClick(event){
    alert("red Zone");
  } 
}