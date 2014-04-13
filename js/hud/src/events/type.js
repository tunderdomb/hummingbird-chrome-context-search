hud.event("type", function( el, callback, capture ){
  var pressed = 0
    , released = 1
  function press( e ){
    pressed && callback.call(this, e)
    released = 0
  }
  function up( e ){
    if ( !released ) {
      callback.call(this, e)
      released = 1
    }
    pressed = 0
  }
  el.addEventListener("keypress", press, capture)
  el.addEventListener("keyup", up, capture)
  return function removeListeners(){
    el.removeEventListener("keypress", press, capture)
    el.removeEventListener("keyup", up, capture)
  }
})
