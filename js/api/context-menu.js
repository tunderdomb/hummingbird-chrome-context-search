// ====================== SEARCH ======================
!function ( f ){
  f(window, window.chrome)
}(function ( win, chrome ){

  chrome.contextMenus.onClicked.addListener(function( info, tab ){
    var query = info.selectionText

    switch( info.menuItemId ){
      case "search":
        humm.search(query, function( err, resp ){
          if ( err ) {
            query = query.replace(/(^[#\s]*)|([#\s]*$)/, "")
            util.open("http://hummingbird.me/search?query="+encodeURIComponent(query))
          }
          else {
            util.open("http://hummingbird.me/anime/"+humm.normalize(query))
          }
        })
        break
      case "plan-to-watch":
        humm.library.planToWatch(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Plan to watch "+query)
          }
        })
        break
      case "currently-watching":
        humm.library.currentlyWatching(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Currently watching "+query)
          }
        })
        break
      case "completed":
        humm.library.completed(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Completed "+query)
          }
        })
        break
      case "on-hold":
        humm.library.onHold(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success(query+" on hold")
          }
        })
        break
      case "dropped":
        humm.library.dropped(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Dropped "+query)
          }
        })
        break
      case "remove":
        humm.library.removeAnime(humm.normalize(query), function( err ){
          if ( err ) {
            util.message.error(err, query)
          }
          else {
            util.message.success("Removed "+query+" from library")
          }
        })
        break
    }
  })

  humm.contextMenu = {}
  humm.contextMenu.createSimple = function(  ){
    chrome.contextMenus.create({
      id: "search",
      title: "Search on Hummingbird",
      contexts: ["selection"]
    })
  }
  humm.contextMenu.createComplex = function(  ){
    var parentId = chrome.contextMenus.create({
      title: "Hummingbird",
      contexts: ["selection"]
    })
    console.log(parentId)
    chrome.contextMenus.create({
      parentId: parentId,
      title: "%s",
      enabled: false,
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      type: "separator",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "search",
      title: "Search",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "plan-to-watch",
      title: "Plan to watch",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "currently-watching",
      title: "Currently watching",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "completed",
      title: "Completed",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "on-hold",
      title: "On hold",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "dropped",
      title: "Dropped",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      parentId: parentId,
      id: "remove",
      title: "Remove from library",
      contexts: ["selection"]
    })
  }

  humm.contextMenu.init = function(  ){
    humm.getToken(function( token ){
      chrome.contextMenus.removeAll(function(  ){
        if( token ) humm.contextMenu.createComplex()
        else humm.contextMenu.createSimple()
      })
    })
  }

  humm.contextMenu.init()

})