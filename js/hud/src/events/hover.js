hud.event("hoverin", function( element, listener, capture ){
  var hover = false
  function mouseover(  ){
    if ( !hover ) listener(true)
    hover = true
  }
  function mouseout( e ){
    hover = this.contains(e.target)
  }
  element.addEventListener("mouseover", mouseover, capture)
  element.addEventListener("mouseout", mouseout, capture)
  return function( element, listener, capture ){
    element.removeEventListener("mouseover", mouseover, capture)
    element.removeEventListener("mouseout", mouseout, capture)
  }
})
hud.event("hoverout", function( element, listener, capture ){
  var hover = false
  function mouseover(  ){
    hover = true
  }
  function mouseout( e ){
    hover = this.contains(e.target)
    if ( !hover ) listener(true)
  }
  element.addEventListener("mouseover", mouseover, capture)
  element.addEventListener("mouseout", mouseout, capture)
  return function( element, listener, capture ){
    element.removeEventListener("mouseover", mouseover, capture)
    element.removeEventListener("mouseout", mouseout, capture)
  }
})
hud.event("hovermove", function( element, listener, capture ){
  var hover = false
  function mouseover(  ){
    hover = true
  }
  function mouseout( e ){
    hover = this.contains(e.target)
  }
  function mousemove( e ){
    if( hover ) listener(true)
  }
  element.addEventListener("mouseover", mouseover, capture)
  element.addEventListener("mouseout", mouseout, capture)
  element.addEventListener("mousemove", mousemove, capture)
  return function( element, listener, capture ){
    element.removeEventListener("mouseover", mouseover, capture)
    element.removeEventListener("mouseout", mouseout, capture)
    element.removeEventListener("mousemove", mousemove, capture)
  }
})