// Send an event once the script has been loaded. This leveraged when loading the .js dynamically.
jQuery(document).trigger("libraryLoaded", "backshift");