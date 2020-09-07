
import { asyncLoad } from './loader.js'
import VideoProcessing from './video-processing.js'

export default class CvStarter {

  constructor(options) {

    console.info("----------------------")
    console.info("CvStarter constructor.")

    if (typeof options !== "undefined") {
      if (typeof options.videoProcessing !== "undefined") {
        // Run Video processing async
        let vp = new VideoProcessing()
        console.info("vp object => ", vp)
      }
    }

    this.cv = window.cv
    console.info("cv object => ", this.cv)
    console.info("adapter => ", window.adapter)
    console.info("----------------------")

  }

}
