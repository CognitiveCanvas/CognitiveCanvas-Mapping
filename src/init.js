/* init.js */
var initStatus = null;
var isInitialized = false;

webstrate.on("loaded", (webstrateId, clientId, user) => {
  
  if(isInitialized ) return;

  //If this is a minimap, don't run the initialization scripts
  if(window.frameElement && window.frameElement.id === "minimap-bg"){
    console.log("stopping minimap initialization");
    return;
  }

  let startTime = new Date();

  initStatus = onLoaded(webstrateId, clientId, user);

  initStatus.then( (endTime)=>{
    console.log("Initialization Completion Time: " + ((endTime-startTime)/1000) + " seconds");
    isInitialized = true;
  });
});

function onLoaded(webstrateId, clientId, user) {
  return new Promise( (resolve, reject)=>{
    getDefaultStyle();
    initIDs(webstrateId, clientId);
    initDragLine();
    initDataElement();
    //reloadElement();
    initToolPalette();
    initDrawing();
    initLog();
    initTransformer().then( ()=>{
      initSnap();
      initAddedNodeHandling();
      initMinimap().then( ()=> {
        resolve(new Date());
      });
    });
  });
}


function initLog(){
  let logIntervalMinute = 3;
  let minute = 60000;
  var intervalID = window.setInterval(postLogs, minute * logIntervalMinute); // 3 minutes
  // log("level EVENT", "test interaction", "test logs");
}


function initIDs(webstrateId, clientId) {
  this.webstrateId = webstrateId;
  this.clientId = clientId;
  this.editId = "edit_" + clientId;
}

//DEPRECATED
/*
function reloadElement() {
  let NodeEleCollection = document.getElementsByClassName("node");
  let EdgeEleCollection = document.getElementsByClassName("link"); 
  
  for (i = 0; i < NodeEleCollection.length; i++) {
    let currNodeEle = NodeEleCollection[i];
    let node = { type: "node", id: currNodeEle.id, content: currNodeEle.getAttribute("content") };
    n = nodes.push(node);
  }
    
  for (j = 0; j < EdgeEleCollection.length; j++) {
    let currEdgeEle = EdgeEleCollection[j];
    let link = { type: "link", id: currEdgeEle.id, sourceId: currEdgeEle.getAttribute("sourceId"), destId: currEdgeEle.getAttribute("targetId"), content: currEdgeEle.getAttribute("content") };
    l = links.push(link);
  }
}*/

function initDragLine() {
  drag_line = document.getElementById("drag_line");
  if (drag_line === null) {
    d3.select(canvas)
      .append("line")
      .attr("id", "drag_line")
      .attr("class", "drag_line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0);

    drag_line = document.getElementById("drag_line");
  }
}

function getDefaultStyle() {
  let defaultStyle = document.getElementsByTagName(DEFAULT_STYLE)[0];

  if (defaultStyle) {
    defaultShape = defaultStyle.getAttribute("shape") 
                  ? defaultStyle.getAttribute("shape")
                  : defaultShape;

    defaultColor = defaultStyle.getAttribute("color") 
                  ? defaultStyle.getAttribute("color")
                  : defaultColor;
  }
}

/**
 * Initialize data element which holds all data
 */
function initDataElement() {
  initHTMLElement("body", DATA_COLLECTION, true)
}

function initToolPalette() {
    let toolPalette = document.createElement("transient");
    toolPalette.setAttribute("id", "tool-palette");
    document.getElementById("content_container").appendChild(toolPalette);
    document.getElementById("tool-palette").style.visibility = "hidden";
} 

function initTransformer() {
  return new Promise( (resolve, reject)=>{
    window.Matrix = Transformer.Matrix; //Give Global access to Matrix
    window.Point = Transformer.Point;

    canvas.addEventListener("wheel", updateMinimapPosition) //So it fires before Hammerize's mouse scroll event stops propagation

    hammerizeCanvas().then( ()=>{

      let promises = [];

      document.querySelectorAll(".link,.node,.group").forEach( (element) => {
        promises.push( new Promise( resolveIter => {
          let prom;
          if( element.classList.contains("node")) prom = hammerizeNode(element);
          else if ( element.classList.contains("link")) prom = hammerizeLink(element);
          else if ( element.classList.contains("group")) prom = hammerizeGroup(element);
          prom.then( ()=> resolveIter() );
        }));
      });

      Promise.all(promises).then( ()=> resolve());
    });
  });
}

function initAddedNodeHandling(){
  canvas.webstrate.on("nodeAdded", function(node) {
    if(canHammerize(node)) autoHammerize(node);
  });
}

function initMinimap(){
  return new Promise( (resolve, reject) => {
    var minimapIframe = document.getElementById("minimap-bg");
    minimapIframe.webstrate.on("transcluded", (event)=>{
      var iframeDoc = minimapIframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.body.setAttribute("transient-is-minimap", true);
      console.log(iframeDoc);

      hammerizeMinimap();

      var minimapCanvas = iframeDoc.getElementById("canvas");
      var minimapBBox = document.getElementById("minimap").getBoundingClientRect();

      var minimapHeight = parseInt( minimapCanvas.style.height, 10 );
      var minimapWidth = parseInt( minimapCanvas.style.width, 10 );

      var scale = {
        x: minimapBBox.width / minimapWidth,
        y: minimapBBox.height / minimapHeight
      }

      var transform = "scale(" + scale.x + "," + scale.y + ")";
      
      minimapIframe.style.transform = transform;

      minimapIframe.style.height = (100 / scale.y) + "%";
      minimapIframe.style.width = (100 / scale.x) + "%";

      updateMinimapPosition();

      resolve();
    });
  });
}