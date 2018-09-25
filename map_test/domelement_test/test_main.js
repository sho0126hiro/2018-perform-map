window.addEventListener("load",init);

function init(){
  // Canvas / Stage 定義
  var canvasContainer = document.getElementById("wrap");
  var canvasElement = document.getElementById("myCanvas");
  var title = document.getElementById("info");
  var shop = document.getElementById("shopname");
  // canvasの大きさを画面サイズにする
  var Sizing = function(){
    canvasElement.height = canvasContainer.offsetHeight;
    // canvasElement.height = canvasContainer.offsetHeight;    
    canvasElement.width  = canvasContainer.offsetWidth;
  };
  Sizing();
  var stage = new createjs.StageGL(canvasElement);
  stage.setClearColor('#FFFFFF');
  // bitmap / rect の定義
  var bmp = new createjs.Bitmap("./../imgs/base.png");
  var rect = new createjs.Shape();
  // Containerの定義
  var rectContainer   = new createjs.Container();
  var DisplayContainer = new createjs.Container();
  main();
  // main
  async function main(){
    // 画像のロードを完全に済ませる
    var bmp_width = await LoadImage(bmp);
    bmp.scaleX = canvasContainer.offsetWidth / bmp_width;
    bmp.scaleY = bmp.scaleX;
    //canvasElement.width = bmp.image.width;
    canvasContainer.style.height = bmp.image.height * bmp.scaleY;
    canvasElement.style.height = bmp.image.height * bmp.scaleY;
    // rectの描画
    DrawRect();
    // 親子構造の構築
    PushContainer();
  }
  // Eevnt Listener
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
function func(shop){
  console.log(shop);
  return '<div class="w3-half" style="display: block;"><img class="w3-margin w3-circle" src="https://avatars0.githubusercontent.com/u/28134110?s=200&amp;v=4"><p>クラス名</p><table class="w3-table w3-white" style="width: 250px; display: block" id="search_shop_table"><tbody><tr><th>item</th><th>price</th></tr><tr><td>banana</td><td>200en</td></tr></tbody></table></div>';
}
  // Click

  function handleClick(event){
    //alert("red Zone");
    title.textContent = "おまえ、赤の四角をクリックしたな";
    shop.innerHTML = func("4j");
  } 

  // 画像の読み込み
  function LoadImage(bitmap){
    return new Promise(function(resolve,reject){
      bitmap.image.onload = function(){
        resolve(this.width);
      }
    });
  }

  // rectの描画
  function DrawRect(){
    rect.graphics.beginFill("DarkRed"); // 赤色で描画するように設定
    rect.graphics.drawRect(0, 0, 100 * bmp.scaleX, 200 * bmp.scaleY);
    rect.x = bmp.x + parseInt(440) * bmp.scaleX ;
    rect.y = bmp.y + parseInt(200) * bmp.scaleY;
    rect.alpha = 0.5;
  }

  // コンテナの構築
  function PushContainer(){
    rectContainer.addChild(rect);
    DisplayContainer.addChild(bmp);
    DisplayContainer.addChild(rectContainer);
    DisplayContainer.cache(0,0,2000,2000);
    stage.addChild(DisplayContainer);
  }
}
