window.addEventListener("load",init);

function init(){
  // load json
  var queue = new createjs.LoadQueue(true);
  var manifest =[
    {"src":"./JSON/1.json","id":"j1"},
    {"src":"./JSON/2.json","id":"j2"}
  ]
  queue.loadManifest(manifest,true);
  queue.addEventListener("complete",getJson);
}
// getJson data 全て読み込み完了すると入る
function getJson(event){
  // completeハンドラに渡される引数が持っているgetResult()にidを指定してファイルオブジェクトを取得する
  var json_1 = event.target.getResult("j1");
  var json_2 = event.target.getResult("j2");
  console.log(json_1);
  console.log(json_2);
  console.log(json_1.shop.shopname.goods.name)
}
