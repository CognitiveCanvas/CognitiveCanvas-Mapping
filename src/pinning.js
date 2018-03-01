/**
 *@file Uploading Images and Pinning to them
 *@author Isaac Fehr <ifehr@ucsd.edu>
 *@version 1.0
*/

$("#uploadImageBtn").on("click", function(e){
	console.log("clicked");
	webstrate.uploadAsset();
});

webstrate.on("asset", function(asset){

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
});

function insertImage(width, height, imgSrc){

	console.log("Inserting Image: " + imgSrc);
	var pinnedImage = d3.select(canvas)
		.append("image")
		.classed("map-image", true)
		.attr("xlink:href", imgSrc)
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", width)
		.attr("height", height)
		.attr("children_ids", "");
}