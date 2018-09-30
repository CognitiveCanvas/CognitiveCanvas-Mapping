import {toggleDrawing, initDrawing} from './draw.js';
import {initToolPanel} from './tool_panel.js';
import {initSnap} from './svg_effects.js';
import {initTransformer, canHammerize, autoHammerize} from './hammer_events.js';
import {postLogs} from './logger';
import {updateMinimapPosition, initMinimap} from './minimap.js';
import {getElementsWithEditedNote} from './request_handler.js';

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
    initDrawing().then(initToolPanel); 
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
  Window.webstrateId = webstrateId;
  Window.clientId = clientId;
  Window.editId = "edit_" + clientId;
}

function initDragLine() {
  let drag_line = document.getElementById("drag_line");
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

function initAddedNodeHandling(){
  canvas.webstrate.on("nodeAdded", function(node) {
    if(canHammerize(node)) autoHammerize(node);
  });
}