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
		.insert("image", ":first-child")
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