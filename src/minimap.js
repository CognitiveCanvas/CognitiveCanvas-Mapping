//Uses the position of the viewport and the canvas to update the Minimap element
function updateMinimapPosition(){
	var viewBBox = document.getElementById("d3_container").getBoundingClientRect();
	var canvasBBox = canvas.getBoundingClientRect();

	var minimapPlacer = document.getElementById("minimap-placer");

	var mapPlacerBBox = {
		top: 	Math.round(Math.abs(canvasBBox.top) / canvasBBox.height * 100),
		left: 	Math.round(Math.abs(canvasBBox.left) / canvasBBox.width * 100),
		height: Math.round(viewBBox.height / canvasBBox.height * 100),
		width: 	Math.round(viewBBox.width / canvasBBox.width * 100)  
	}

	Object.keys(mapPlacerBBox).forEach(function(attr){
		minimapPlacer.style[attr] = mapPlacerBBox[attr] + "%";
	});
}

//Uses the position of the place indicator on the Minimap to update the viewport's position over the canvas
function updateMapPositionFromMinimap(){
	var minimapBBox = document.getElementById('minimap').getBoundingClientRect();
	var placerBBox = document.getElementById('minimap-placer').getBoundingClientRect();
	var canvasBBox = canvas.getBoundingClientRect();

	newPoint = new Point( ( (placerBBox.left - minimapBBox.left) / minimapBBox.width * canvasBBox.width ).toFixed(2),
						  ( (placerBBox.top - minimapBBox.top) / minimapBBox.height * canvasBBox.height ).toFixed(2) 
						);

	translateCanvas( newPoint, false );
}