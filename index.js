
/**
 * Middle part
 * @description Opencvjs Exporter 1.0.0
 */

exports.cvjs = function(cvjsCallback) {

  console.log("Welcome here...");

  function asyncLoad(path, callback) {

    if (typeof callback === "undefined") {
      callback = function() {}
    }

    var nuiScript = document.createElement("script")
    nuiScript.src = path
    document.head.appendChild(nuiScript)
    nuiScript.onload = function () {
      callback()
    }
  }

  asyncLoad('./src/lib/opencv-3.4.0.js', cvjsCallback)

}
