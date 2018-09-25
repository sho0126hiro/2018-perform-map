window.addEventListener("load",init);

function init() {
  // Canvas / Stage 定義
  var canvasElement = document.getElementById("myCanvas");
  var stage = new createjs.StageGL(canvasElement);
  // Resize処理
  window.addEventListener("resize",handleResize);
  
  //画像の表示
  stage.setClearColor('#FFFFFF')
  var bmp = new createjs.Bitmap("./../imgs/base.png");
  var rect = new createjs.Shape();
  
  rect.graphics.beginFill("DarkRed"); // 赤色で描画するように設定
  rect.graphics.drawRect(0, 0, 100, 200);
  rect.x = 350;
  rect.y=340;
  rect.alpha = 0.5;
  var rectContainer   = new createjs.Container();
  rectContainer.addChild(rect);
  var DisplayContainer = new createjs.Container();
  DisplayContainer.addChild(bmp);
  DisplayContainer.addChild(rectContainer);
  DisplayContainer.cache(0,0,2000,2000);
  stage.addChild(DisplayContainer);
  handleResize();
  rect.addEventListener("click",handleClick);
  
  // 画面更新
  createjs.Ticker.on("tick",function(){
    stage.update();
    DisplayContainer.updateCache();
  });
  
  // Resize
  function handleResize(event){
    canvasElement.width  = window.innerWidth;
    canvasElement.height = window.innerHeight;
    stage.update();
    DisplayContainer.updateCache();
  }
  
  // Click
  function handleClick(event){
    alert("hey");
  }
  
}