hud.event("key", function( element, listener, capture, code ){
  function keyup( e ){
    if ( code == e.keyCode
      || code && code.indexOf && ~code.indexOf(e.keyCode) )
      return listener()
  }
  element.addEventListener("keyup", keyup, false)
  return function( element, listener, capture ){
    element.removeEventListener("keyup", keyup, false)
  }
})