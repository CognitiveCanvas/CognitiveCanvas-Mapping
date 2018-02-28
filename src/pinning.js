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
	var imgHeight = 100, imgWidth = 100;
	var imgSrc = '/' + webstrateId + '/' + asset.fileName;
    newImg.onload = function() {
      imgHeight = newImg.height;
      imgWidth = newImg.width;
      insertImage(asset, imgWidth, imgHeight, imgSrc);
      newImg = null;
    }
	newImg.src = imgSrc; // this must be done AFTER setting onload
});

function insertImage(asset, width, height, imgSrc){

	imgSrc = '/' + webstrateId + '/' + asset.fileName;

	console.log("Uploaded Image recieved: ");
	console.log(asset);
	var pinnedImage = d3.select(canvas).append("image")
		.attr("xlink:href", imgSrc)
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", width)
		.attr("height", height);
}