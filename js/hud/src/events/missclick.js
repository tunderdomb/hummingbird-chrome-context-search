hud.event("missclick", function( element, listener, capture ){
  function missClick( e ){
    if ( element.contains(e.target) || e.target == element ) {
      return
    }
    listener()
  }
  window.addEventListener("click", missClick, true)
  return function( element, listener, capture ){
    window.removeEventListener("click", missClick, true)
  }
})