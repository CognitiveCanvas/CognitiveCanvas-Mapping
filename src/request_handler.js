/* Handling Messages that have been post on the Webstrate */
window.onmessage = function(e) {
  
  //console.log("Start Handling Message");
  
  if (e.data.id == "search") {
    console.log("Message Type: Search");
    sendRelatedEleToContainer(e.data.query);
  }
  
}

