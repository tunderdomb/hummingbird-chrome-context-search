var embrace = (function ( f ){
  return f()
}(function (  ){
  function load( src, done ){
    var script = document.createElement("script")
    script.src = src
    script.async = false
    document.head.appendChild(script)
    var ok
    script.onload = function( e ){
      ok || done()
      ok = true
    }
    script.onerror = function( e ){
      ok || done()
      ok = true
    }
  }

  return function embrace( template, done ){
    if ( typeof template == "string" ) {
      load(template, done)
    }
    else {
      var toLoad = template.length
        , i = -1
        , next = function( err ){
          if ( err ) {
            console.warn(err)
          }
          --toLoad
          if ( !toLoad ) {
            done()
          }
        }
      while ( ++i < toLoad ) {
        load(template[i], next)
      }
    }
  }
}))