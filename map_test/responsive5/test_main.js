window.addEventListener("load",init);

function init() {
  // Canvas / Stage 定義
  var canvasContainer = document.getElementById("wrap");
  var canvasElement = document.getElementById("myCanvas");
  Sizing();
  var stage = new createjs.StageGL(canvasElement);
  stage.setClearColor('#FFFFFF')
  var bmp = new createjs.Bitmap("./../imgs/base.png");
  var rect = new createjs.Shape();
  //画像を画面いっぱいのサイズに
  SizeMaxBitmap(bmp);
  bmp.y=0;
  rect.graphics.beginFill("DarkRed"); // 赤色で描画するように設定
  rect.graphics.drawRect(0, 0, 100, 200);
  rect.x = 420;
  rect.y=bmp.y+parseInt(200);
  rect.alpha = 0.5;
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

  function Sizing(){
    canvasElement.height = canvasContainer.offsetHeight;
    canvasElement.width  = canvasContainer.offsetWidth;
  }
  function SizeMaxBitmap(bmp){
    bmp.scaleX = canvasElement.width / bmp.getBounds().width;
    bmp.scaleY = bmp.scaleX;
    // x,yの位置に画像の中央が表示されるように設定
    //bmp.regX = bmp.getBounds().width / 2;
    //bmp.regY = bmp.getBounds().height / 2;
  }
  // Click
  function handleClick(event){
    alert("red Zone");
  } 
}