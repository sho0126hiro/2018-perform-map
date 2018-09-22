window.addEventListener("load",init);

function init() {
  var canvasElement = document.getElementById("myCanvas");
  canvasElement.width = 2000;
  canvasElement.height = 1000;
  var stage = new createjs.StageGL(canvasElement);
  //画像の表示
  stage.setClearColor('#FFFFFF')
  var bmp = new createjs.Bitmap("./imgs/base.png");
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
  
  rect.addEventListener("click",handleClick);
  createjs.Ticker.on("tick",function(){
    // Stageの描画を更新します
    stage.update();
    DisplayContainer.updateCache();
  });
  function handleClick(event){
    alert("hey");
  }
}