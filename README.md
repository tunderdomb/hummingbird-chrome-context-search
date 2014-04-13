Hummingbird chrome extension
====

## Install & run

    git clone https://github.com/tunderdomb/hummingbird-chrome-context-search.git
    cd hummingbird-chrome-context-search
    npm install
    grunt

## Structure

### `extension/`

The extension dir that goes to the store in zipped form.

### `js/`

The bulk of the extension, these files are concatenated into the
extension dir.

#### `js/api/context-menu.js`

Creates the context menu items.

#### `js/api/Hummingbird.js`

The [Hummingbird.me API](https://www.mashape.com/vikhyat/hummingbird-v1#!endpoint-Authenticate) integration.

#### `js/api/util.js`

Utility stuff.

Check the `Gruntfile.js` to see what's happening to them.

### `templates/`

dust files and compiled js templates of them.