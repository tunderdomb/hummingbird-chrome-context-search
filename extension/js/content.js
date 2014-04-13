(function( chrome ){

  function toast( message ){
    var div = document.createElement("div")
    div.textContent = message.content
    var css = {
      position: "fixed",
      top: "0",
      right: "0",
      maxHeight: "0",
      padding: "0",
      borderRadius: "5px 1px 5px 5px",
      color: "white",
      fontSize: "16px",
      fontVariant: "small-caps",
      transition: "all 0.5s ease",
      overflow: "hidden",
      zIndex: 999999999999999999
    }
    switch( message.type ){
      case "error":
        div.textContent = "No such anime: "+message.query
        css.background =  "#FD594B"
        break
      case "success":
        css.background =  "#4BBDFD"
        break
    }
    for( var rule in css ){
      div.style[rule] = css[rule]
    }
    document.body.appendChild(div)
    setTimeout(function(  ){
      div.style.maxHeight = "50px"
      div.style.padding = "10px 20px"
    }, 1)
    setTimeout(function(  ){
      div.style.maxHeight = "0"
      div.style.padding = "0"
    }, 3000)
    setTimeout(function(  ){
      document.body.removeChild(div)
    }, 3500)
  }

  chrome.runtime.onMessage.addListener(function( message, sender, respond ){
    if ( message.debug ) {
      console.log(message)
    }
    else {
      toast(message)
    }
  })
}( window.chrome ))