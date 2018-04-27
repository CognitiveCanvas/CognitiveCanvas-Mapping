/**
 *@file Uploading Images and Pinning to them
 *@author Isaac Fehr <ifehr@ucsd.edu>
 *@version 1.0
*/

$("#uploadImageBtn").on("click", function(e){
	console.log("clicked");
	webstrate.on("asset", handleImageUpload)
	webstrate.uploadAsset();
});

//Handles the uploaded Image
var handleImageUpload = function(asset){

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
	let imgId = getID();
	console.log("Inserting Image: " + imgSrc);
	var pinnedImage = d3.select(canvas)
		.insert("image", ":first-child")
		.classed("map-image", true)
		.classed("group", true)
		.attr("xlink:href", imgSrc)
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", width)
		.attr("height", height)
		.attr("children_ids", "")
		.attr("id", imgId);
	logImage(width, height, imgSrc, imgId);
}