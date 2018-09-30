/**
 *@file Uploading Images and Pinning to them
 *@author Isaac Fehr <ifehr@ucsd.edu>
 *@version 1.0
*/

export var isPinning = false;

/**
 * Turns "Pinning Mode" on or off.  When on, single clicks on a group will
 * create "pins"
 * @param  {Boolean} newValue If true, will be in pinning mode, else
 *                            the amp will be have as normal
 * @return {Boolean}          True if the map is now in pinning mode
 */
export function togglePinning(newValue){
	if (newValue === undefined) isPinning = !isPinning;
	else isPinning = newValue; 
	return isPinning;
}

export var uploadImage = function(){
	webstrate.on("asset", handleImageUpload)
	webstrate.uploadAsset();
}

//Handles the uploaded Image
var handleImageUpload = function(asset){
	console.log("ASSET UPLOADED", asset);
	//Get height and width of original image then insert the image into the canvas
	var newImg = new Image();
	var oldImgHeight = 0, oldImgWidth = 0, imgHeight, imgWidth;
	var imgSrc = '/' + webstrateId + '/' + asset.fileName;
    newImg.onload = function() {
      
      oldImgWidth = newImg.width;
      oldImgHeight = newImg.height;
      var widthHeightRatio = parseFloat(oldImgWidth) / parseFloat(oldImgHeight); 
      imgWidth = oldImgWidth / IMG_MAX_SIZE[0] >= oldImgHeight / IMG_MAX_SIZE[1] ? IMG_MAX_SIZE[0] : IMG_MAX_SIZE[1] * widthHeightRatio;
      imgHeight = imgWidth / widthHeightRatio; 

      insertImage(imgWidth, imgHeight, imgSrc);
      newImg = null;
    }
	newImg.src = imgSrc; // this must be done AFTER setting onload
	webstrate.off('asset', handleImageUpload);
};

/*Inserts an image at [0,0] to the back of the canvas.  The image acts like a group
 *
 */
function insertImage(width, height, imgSrc){
	let imgId = generateObjectId();
	console.log("Inserting Image: " + imgSrc);

	var center = new Point( $(window).width() /2,
		$(window).scrollTop() + $(window).height() /2);	

	center = canvas.transformer.fromGlobalToLocal(center);

	var pinnedImage = d3.select(canvas)
		.insert("image", "#canvas-bg::after")
		.classed("map-image", true)
		.classed("group", true)
		.attr("xlink:href", imgSrc)
		.attr("width", width)
		.attr("height", height)
		.attr("id", imgId)
		.attr("transform", "matrix(1, 0, 0, 1, " + (center.x - width/2) + ", " + (center.y - height/2) + ")")
		.attr("children_ids", "");

	hammerizeGroup(pinnedImage.node());
	logImage(width, height, imgSrc, imgId);
}