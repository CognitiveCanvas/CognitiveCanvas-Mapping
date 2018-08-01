/* Handling Messages that have been post on the Webstrate */
window.onmessage = function(e) {
  
  //console.log("Handling Message");
  
  if (e.data.id == "search") {
    console.log("Message Type: Search");
    sendRelatedEleToContainer(e.data.query);
  } 
  else {
    // 400: Message does not have id in Header
    //console.log("400: Message type is not recognized")
    //console.log(e.data)
  }
  
}

