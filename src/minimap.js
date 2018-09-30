import {createElement, faIcon, makeUIDraggable, roundToPlace, translateCanvas, zoomCanvas} from './main.js';
import {hammerizeMinimap} from './hammer_events.js';

const DEFAULT_ZOOM_INCREMENT = 0.25;

function createMinimap(){
	let transient = 		createElement("transient");
	let panel = 			createElement("div", [], 	{id: "minimap-panel"}, 			transient);
	let minimapWrapper = 	createElement("div", [], 	{id: "minimap-wrapper"}, 		panel);
	//Create Minimap
	let minimap = 			createElement("div", [], 	{id: "minimap"}, 				minimapWrapper);
	let minimapBG = 		createElement("iframe", [], {id: "minimap-bg", src: "."}, 	minimap);
	let minimapBarrier = 	createElement("div", [], 	{id: "minimap-barrier"}, 		minimap);
	let minimapPlacer = 	createElement("div", [], 	{id: "minimap-placer"}, 		minimap);
	//Create Buttons
	let zoomButtons = createElement("div", "minimap-button", {id: "minimap-zoom-buttons"},  panel);
	let plusButton = zoomButtons.appendChild(faIcon("plus"));
	plusButton.addEventListener("click", ()=>{zoomCanvas(1 + DEFAULT_ZOOM_INCREMENT)});
	let minusButton = zoomButtons.appendChild(faIcon("minus"));
	minusButton.addEventListener("click", ()=>{zoomCanvas(1 - DEFAULT_ZOOM_INCREMENT)});

	let locateButton = createElement("div", "minimap-button", {id: "minimap-locate-button"}, panel);
	locateButton.appendChild(faIcon("expand"));
	
	let expandButton = createElement("div", "minimap-button", {id: "minimap-expand-button"}, panel);
	expandButton.appendChild(faIcon("expand-arrows-alt"));
	
	let anchor = createElement("div", ["minimap-button", "anchor"], {id: "minimap-anchor"}, panel);
	anchor.appendChild(faIcon("street-view"));

	makeUIDraggable(panel);

	document.body.appendChild(transient);
	//Use the panel's size and document size to position the minimap in the bottom-right corner
	panel.style.top = document.documentElement.clientHeight - panel.clientHeight - INITIAL_UI_PADDING + "px";
	panel.style.left = document.documentElement.clientWidth - panel.clientWidth - INITIAL_UI_PADDING + "px";
	return transient;
}

export function initMinimap(){
  return new Promise( (resolve, reject) => {
  	let minimap = createMinimap();
    var minimapIframe = document.getElementById("minimap-bg");
    minimapIframe.webstrate.on("transcluded", (event)=>{
      var iframeDoc = minimapIframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.body.setAttribute("transient-is-minimap", true);

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

//Uses the position of the viewport and the canvas to update the Minimap element
export function updateMinimapPosition(){
	var viewBBox = document.getElementById("d3_container").getBoundingClientRect();
	var canvasBBox = canvas.getBoundingClientRect();

	var minimapPlacer = document.getElementById("minimap-placer");

	var mapPlacerBBox = {
		top: 	roundToPlace(Math.abs(canvasBBox.top) / canvasBBox.height * 100, 2),
		left: 	roundToPlace(Math.abs(canvasBBox.left) / canvasBBox.width * 100, 2),
		height: roundToPlace(viewBBox.height / canvasBBox.height * 100, 2),
		width: 	roundToPlace(viewBBox.width / canvasBBox.width * 100, 2)
	}

	Object.keys(mapPlacerBBox).forEach(function(attr){
		minimapPlacer.style[attr] = mapPlacerBBox[attr] + "%";
	});
}

//Uses the position of the place indicator on the Minimap to update the viewport's position over the canvas
export function updateMapPositionFromMinimap(){
	var minimapBBox = document.getElementById('minimap').getBoundingClientRect();
	var placerBBox = document.getElementById('minimap-placer').getBoundingClientRect();
	var canvasBBox = canvas.getBoundingClientRect();

	let newPoint = new Point( roundToPlace( (placerBBox.left - minimapBBox.left) / minimapBBox.width * canvasBBox.width, 2),
						  roundToPlace( (placerBBox.top - minimapBBox.top) / minimapBBox.height * canvasBBox.height, 2) 
						);

	translateCanvas( newPoint, false );
}