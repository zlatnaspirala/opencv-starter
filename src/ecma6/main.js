
import { asyncLoad } from './loader.js'
import VideoProcessing from './video-processing.js'

export default class CvStarter {

  constructor(options) {

    if (typeof options !== "undefined") {
      if (typeof options.videoProcessing !== "undefined") {
        // Run Video processing async
        let vp = new VideoProcessing()
      }
    }

    this.cv = window.cv
    console.info("----------------------")
    console.info("CvStarter constructed.")
    console.info("cv object => ", this.cv)
    console.info("adapter => ", window.adapter)
    console.info("----------------------")

  }

}
