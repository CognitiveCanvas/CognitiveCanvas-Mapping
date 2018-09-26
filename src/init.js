/* init.js */
var initStatus = null;
var isInitialized = false;

webstrate.on("loaded", (webstrateId, clientId, user) => {
  console.log("Webstrate Loaded")
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
    
    // Waiting on Promise initStatus to send Edited Note List
    getElementsWithEditedNote()
  });
});

function onLoaded(webstrateId, clientId, user) {
  return new Promise( (resolve, reject)=>{
    getDefaultStyle();
    initIDs(webstrateId, clientId);
    initDragLine();
    initDataElement();
    initDrawing().then( () => {
      initToolPanel() 
    }); 
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

function initTransformer() {
  return new Promise( (resolve, reject)=>{
    window.Matrix = Transformer.Matrix; //Give Global access to Matrix
    window.Point = Transformer.Point;

    canvas.addEventListener("wheel", updateMinimapPosition, {capture: true, passive: false}) //So it fires before Hammerize's mouse scroll event stops propagation

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

/**
 * Initializes snap, and creates a transient SVG tag containing only the
 * definitions for SVG effects to be used in the canvas.  This is a workaround
 * to Webstrate's problems with not recreating SVG patterns after they are
 * first added to the DOM.
 */
function initSnap(){
  snap = Snap(canvas);

  createTransientDefsSVG();
  createCanvasBackground();
  createSelectedFilter();
}