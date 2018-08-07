REP_TEMPLATES = {
	'mapping': {
		'node': NODE_TEMPLATE,
		'link': LINK_TEMPLATE
	}
};

MASTER_TEMPLATE = {

};

function generateAttributeMap(){
	Object.keys(REP_TEMPLATES).forEach((repType)=>{
		Object.keys(repType).forEach((eleType)=>{

		})
	})
}

function createFromTemplate(repType, eleType, eleInfo={}){
	let template = REP_TEMPLATES[repType][eleType];
	let object = {}

	let iterate = function(currObj, currTemp){
		Object.keys(currTemp).forEach((currProp)=>{
			if (typeof currTemp[currProp] === "object"){
				currObj[currProp] = iterate(currObj[currProp], currTemp[currProp]);
			}
			else if (eleInfo.hasOwnProperty(currProp)) {
				currObj[currProp]=eleInfo[currProp];
			}
			else{
				currObj[currProp]= currTemp[currProp];
			} 
		});
		return cuurObj;
	}

	iterate(object, template);

	return object;
}

function changeRep(eleInfo){

}

function styleFromInfo(repType, eleType, element){

}