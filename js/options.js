// ====================== OPTIONS ======================
(function ( chrome ){

  hud.register("login", function ( login ){
    var user = this.find("login:user")
      , password = this.find("login:password")
      , error = this.find("login:error")

    this.role("login:submit").on("click", function (){
      error.textContent = ""
      humm.authenticate(user.value, password.value, function ( err, resp ){
        if ( err ) {
          error.textContent = err.toString()
        }
        else {
          chrome.storage.sync.set({
            user: user.value
          }, function ( err, resp ){
            location.reload()
          })
        }
      })
    })
  })

  hud.register("user", function ( login ){
    var user = this.find("user:name")
    chrome.storage.sync.get("user", function ( values ){
      user.textContent = values.user
    })
    this.role("user:logout").on("click", function (){
      humm.removeToken(function (){
        location.reload()
      })
    })
  })

  hud.create(hud.find(document.body, "setting:user"), function ( element ){
    var setting = this
    humm.getToken(function ( value ){
      if ( value ) {
        util.render("user").appendTo(setting.element)
      }
      else {
        util.render("login").appendTo(setting.element)
      }
      humm.contextMenu.init()
    })
  })

}(window.chrome))