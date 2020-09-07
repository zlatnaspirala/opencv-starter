
export default class VideoProcessing {

  constructor() {

    console.log("VideoProcessing ...")

    // In this case, We set width 320, and the height will be computed based on the input stream.
    this.width = 320
    this.height = 0

    // whether this.streaming video from the camera.
    this.streaming = false

    this.video = document.getElementById("video")
    this.stream = null
    this.vc = null

    this.lastFilter = ''
    this.src = null
    this.dstC1 = null
    this.dstC3 = null
    this.dstC4 = null

    this.contoursColor = []
    for (let i = 0; i < 10000; i++) {
      this.contoursColor.push(
        [
          Math.round(Math.random() * 255),
          Math.round(Math.random() * 255),
          Math.round(Math.random() * 255),
          0
        ]
      )
    }

    this.base;
    this.stats = null;

    this.filters = {
      'passThrough': 'Pass Through',
      'gray': 'Gray',
      'hsv': 'HSV',
      'canny': 'Canny Edge Detection',
      'inRange': 'In Range',
      'threshold': 'Threshold',
      'adaptiveThreshold': 'Adaptive Threshold',
      'gaussianBlur': 'Gaussian Blurring',
      'medianBlur': 'Median Blurring',
      'bilateralFilter': 'Bilateral Filtering',
      'sobel': 'Sobel Derivatives',
      'scharr': 'Scharr Derivatives',
      'laplacian': 'Laplacian Derivatives',
      'contours': 'Contours',
      'calcHist': 'Calculation',
      'equalizeHist': 'Equalization',
      'backprojection': 'Backprojection',
      'erosion': 'Erosion',
      'dilation': 'Dilation',
      'morphology': 'Morphology',
    };

    this.filterName = document.getElementById('filterName');
    this.controls;

    console.log('VideoProcessing class instance is ready.');
    this.initUI()
    this.startCamera()
  }

  /**
   * @description For now run own video tag for webcam access.
   */
  startCamera() {

    var root = this

    if (this.streaming) return;
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
      .then(function(s) {
      root.stream = s;
      video.srcObject = s;
      video.play()
    })
      .catch(function(err) {
      console.log("An error occured! " + err)
    });

    video.addEventListener("canplay", function(ev) {
      if (!this.streaming) {
        root.height = video.videoHeight / (video.videoWidth/root.width)
        video.setAttribute("width", root.width)
        video.setAttribute("height", root.height)
        root.streaming = true
        root.vc = new cv.VideoCapture(video)
      }
      root.startVideoProcessing()
    }, false)

  }

  initUI() {

    var root = this
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.getElementById('container').appendChild(this.stats.domElement);

    this.controls = {
      filter: 'passThrough',
      setFilter: (filter) => {
        this.filter = filter;
        filterName.innerHTML = this.filters[filter];
      },
      passThrough: function() { this.setFilter('passThrough'); },
      gray: function() { this.setFilter('gray'); },
      hsv: function() { this.setFilter('hsv'); },
      inRange: function() { this.setFilter('inRange'); },
      inRangeLow: 75,
      inRangeHigh: 150,
      threshold: function() { this.setFilter('threshold'); },
      thresholdValue: 100,
      adaptiveThreshold: function() { this.setFilter('adaptiveThreshold'); },
      adaptiveBlockSize: 3,
      gaussianBlur: function() { this.setFilter('gaussianBlur'); },
      gaussianBlurSize: 7,
      medianBlur: function() { this.setFilter('medianBlur'); },
      medianBlurSize: 5,
      bilateralFilter: function() { this.setFilter('bilateralFilter'); },
      bilateralFilterDiameter: 5,
      bilateralFilterSigma: 75,
      sobel: function() { this.setFilter('sobel'); },
      sobelSize: 3,
      scharr: function() { this.setFilter('scharr'); },
      laplacian: function() { this.setFilter('laplacian'); },
      laplacianSize: 3,
      canny: function() { this.setFilter('canny'); },
      cannyThreshold1: 150,
      cannyThreshold2: 300,
      cannyApertureSize: 3,
      cannyL2Gradient: false,
      contours: function() { this.setFilter('contours'); },
      contoursMode: cv.RETR_CCOMP,
      contoursMethod: cv.CHAIN_APPROX_SIMPLE,
      calcHist: function() { this.setFilter('calcHist'); },
      equalizeHist: function() { this.setFilter('equalizeHist'); },
      backprojection: function() { this.setFilter('backprojection'); },
      backprojectionRangeLow: 0,
      backprojectionRangeHigh: 150,
      morphology: function () { this.setFilter('morphology'); },
      morphologyShape: cv.MORPH_RECT,
      morphologyOp: cv.MORPH_ERODE,
      morphologySize: 5,
      morphologyBorderType: cv.BORDER_CONSTANT,
    };

    let gui = new dat.GUI({ autoPlace: false });
    let guiContainer = document.getElementById('guiContainer');
    guiContainer.appendChild(gui.domElement);

    let lastFolder = null;
    function closeLastFolder(folder) {
      if (lastFolder != null && lastFolder != folder) {
        lastFolder.close();
      }
      lastFolder = folder;
    }

    let passThrough = gui.add(this.controls, 'passThrough').name(root.filters['passThrough']).onChange(() => {
      this.controls.filter = "passThrough"
      closeLastFolder(null);
    });

    let colorConversion = gui.addFolder('Color Conversion');
    colorConversion.add(this.controls, 'gray').name(root.filters['gray']).onChange(() => {
      this.controls.filter = "gray"
      closeLastFolder(null);
    });

    colorConversion.add(this.controls, 'hsv').name(root.filters['hsv']).onChange(() => {
      this.controls.filter = "hsv"
      closeLastFolder(null);
    });

    let inRange = colorConversion.addFolder(root.filters['inRange'])
    inRange.domElement.onclick = () => {
      closeLastFolder(inRange)
      root.controls.inRange()
    };
    inRange.add(root.controls, 'inRangeLow', 0, 255, 1).name('lower boundary')
    inRange.add(root.controls, 'inRangeHigh', 0, 255, 1).name('higher boundary')

    // let geometricTransformations = gui.addFolder('Geometric Transformations');
    // TODO

    let thresholding = gui.addFolder('Thresholding')

    let threshold = thresholding.addFolder(this.filters['threshold'])
    threshold.domElement.onclick = () => {
      this.controls.filter = "threshold"
      closeLastFolder(threshold)
      this.controls.threshold()
    };
    threshold.add(this.controls, 'thresholdValue', 0, 200, 1).name('threshold value')

    let adaptiveThreshold = thresholding.addFolder(this.filters['adaptiveThreshold'])
    adaptiveThreshold.domElement.onclick = () => {
      closeLastFolder(adaptiveThreshold);
      this.controls.adaptiveThreshold();
    };
    adaptiveThreshold.add(this.controls, 'adaptiveBlockSize', 3, 99, 1).name('block size').onChange((value) => { if (value % 2 === 0) this.controls.adaptiveBlockSize = value + 1;});

    let smoothing = gui.addFolder('Smoothing')

    let gaussianBlur = smoothing.addFolder(this.filters['gaussianBlur'])
    gaussianBlur.domElement.onclick = () => {
      closeLastFolder(gaussianBlur);
      this.controls.gaussianBlur();
    };
    gaussianBlur.add(this.controls, 'gaussianBlurSize', 7, 99, 1).name('kernel size').onChange((value) => { if (value % 2 === 0) this.controls.gaussianBlurSize = value + 1;});

    let medianBlur = smoothing.addFolder(this.filters['medianBlur']);
    medianBlur.domElement.onclick = () => {
      closeLastFolder(medianBlur);
      this.controls.medianBlur();
    };
    medianBlur.add(this.controls, 'medianBlurSize', 3, 99, 1).name('kernel size').onChange((value) => { if (value % 2 === 0) this.controls.medianBlurSize = value + 1;});

    let bilateralFilter = smoothing.addFolder(this.filters['bilateralFilter']);
    bilateralFilter.domElement.onclick = () => {
      closeLastFolder(bilateralFilter);
      this.controls.bilateralFilter();
    };
    bilateralFilter.add(this.controls, 'bilateralFilterDiameter', 1, 15, 1).name('diameter');
    bilateralFilter.add(this.controls, 'bilateralFilterSigma', 1, 255, 1).name('sigma')

    let morphology = gui.addFolder('Morphology');
    morphology.domElement.onclick = () => {
      closeLastFolder(morphology);
      this.controls.morphology();
    };
    morphology.add(this.controls, 'morphologyOp', {'MORPH_ERODE': cv.MORPH_ERODE, 'MORPH_DILATE': cv.MORPH_DILATE, 'MORPH_OPEN ': cv.MORPH_OPEN, 'MORPH_CLOSE': cv.MORPH_CLOSE, 'MORPH_GRADIENT': cv.MORPH_GRADIENT, 'MORPH_TOPHAT': cv.MORPH_TOPHAT, 'MORPH_BLACKHAT': cv.MORPH_BLACKHAT}).name('operation');
    morphology.add(this.controls, 'morphologyShape', {'MORPH_RECT': cv.MORPH_RECT, 'MORPH_CROSS': cv.MORPH_CROSS, 'MORPH_ELLIPSE': cv.MORPH_ELLIPSE}).name('shape');
    morphology.add(this.controls, 'morphologySize', 1, 15, 1).name('kernel size').onChange(function(value) { if (value % 2 === 0) this.controls.morphologySize = value + 1;});
    morphology.add(this.controls, 'morphologyBorderType', {'BORDER_CONSTANT': cv.BORDER_CONSTANT, 'BORDER_REPLICATE': cv.BORDER_REPLICATE, 'BORDER_REFLECT': cv.BORDER_REFLECT, 'BORDER_REFLECT_101': cv.BORDER_REFLECT_101}).name('boarder type');

    let gradients = gui.addFolder('Gradients')
    let sobel = gradients.addFolder(this.filters['sobel'])

    sobel.domElement.onclick = () => {
      closeLastFolder(sobel);
      this.controls.sobel();
    }

    sobel.add(this.controls, 'sobelSize', 3, 19, 1).name('kernel size').onChange((value) => {
      if (value % 2 === 0) root.controls.sobelSize = value + 1;
    })

    gradients.add(this.controls, 'scharr').name(this.filters['scharr']).onChange(() => {
      closeLastFolder(null)
    })

    let laplacian = gradients.addFolder(this.filters['laplacian'])
    laplacian.domElement.onclick = () => {
      closeLastFolder(laplacian);
      this.controls.laplacian();
    };
    laplacian.add(this.controls, 'laplacianSize', 1, 19, 1).name('kernel size').onChange((value) => {

      if (value % 2 === 0) root.controls.laplacianSize = value + 1;

    })

    let canny = gui.addFolder(this.filters['canny'])
    canny.domElement.onclick = () => {
      closeLastFolder(canny);
      this.controls.canny();
    };
    canny.add(this.controls, 'cannyThreshold1', 1, 500, 1).name('threshold1');
    canny.add(this.controls, 'cannyThreshold2', 1, 500, 1).name('threshold2');
    canny.add(this.controls, 'cannyApertureSize', 3, 7, 1).name('aperture size').onChange(function(value) { if (value % 2 === 0) root.controls.cannyApertureSize = value + 1;});
    canny.add(this.controls, 'cannyL2Gradient').name('l2 gradient');

    let contours = gui.addFolder(this.filters['contours']);
    contours.domElement.onclick = () => {
      closeLastFolder(contours);
      root.controls.contours();
    };
    contours.add(root.controls, 'contoursMode', {'RETR_EXTERNAL': cv.RETR_EXTERNAL, 'RETR_LIST': cv.RETR_LIST, 'RETR_CCOMP': cv.RETR_CCOMP, 'RETR_TREE': cv.RETR_TREE}).name('mode');
    contours.add(root.controls, 'contoursMethod', {'CHAIN_APPROX_NONE': cv.CHAIN_APPROX_NONE, 'CHAIN_APPROX_SIMPLE': cv.CHAIN_APPROX_SIMPLE, 'CHAIN_APPROX_TC89_L1': cv.CHAIN_APPROX_TC89_L1, 'CHAIN_APPROX_TC89_KCOS': cv.CHAIN_APPROX_TC89_KCOS}).name('method');

    let histograms = gui.addFolder('Histograms');
    histograms.add(root.controls, 'calcHist').name(root.filters['calcHist']).onChange(function() {
      closeLastFolder(null);
    })
    histograms.add(this.controls, 'equalizeHist').name(root.filters['equalizeHist']).onChange(function() {
      closeLastFolder(null);
    });

    let backprojection = histograms.addFolder(root.filters['backprojection']);
    backprojection.domElement.onclick = () => {
      closeLastFolder(backprojection);
      root.controls.backprojection();
    };
    backprojection.add(root.controls, 'backprojectionRangeLow', 0, 255, 1).name('range low');
    backprojection.add(root.controls, 'backprojectionRangeHigh', 0, 255, 1).name('range high');
  }

  backprojection(src) {
    if (this.lastFilter !== 'backprojection') {
      if (this.base instanceof cv.Mat)
        this.base.delete();
      this.base = src.clone();
      cv.cvtColor(this.base, this.base, cv.COLOR_RGB2HSV, 0)
    }
    cv.cvtColor(src, this.dstC3, cv.COLOR_RGB2HSV, 0);
    let baseVec = new cv.MatVector(), targetVec = new cv.MatVector();
    baseVec.push_back(base); targetVec.push_back(this.dstC3);
    let mask = new cv.Mat(), hist = new cv.Mat();
    let channels = [0], histSize = [50];
    let ranges;
    if (this.controls.backprojectionRangeLow < this.controls.backprojectionRangeHigh)
      ranges = [this.controls.backprojectionRangeLow, this.controls.backprojectionRangeHigh];
    else
      return src;
    cv.calcHist(baseVec, channels, mask, hist, histSize, ranges);
    cv.normalize(hist, hist, 0, 255, cv.NORM_MINMAX);
    cv.calcBackProject(targetVec, channels, hist, dstC1, ranges, 1);
    baseVec.delete();
    targetVec.delete();
    mask.delete();
    hist.delete();
    return dstC1;
  }

  erosion(src) {
    let kernelSize = this.controls.erosionSize;
    let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
    let color = new cv.Scalar();
    cv.erode(src, dstC4, kernel, {x: -1, y: -1}, 1, Number(this.controls.erosionBorderType), color);
    kernel.delete();
    return dstC4;
  }

  dilation(src) {
    let kernelSize = this.controls.dilationSize;
    let kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
    let color = new cv.Scalar();
    cv.dilate(src, dstC4, kernel, {x: -1, y: -1}, 1, Number(this.controls.dilationBorderType), color);
    kernel.delete();
    return dstC4;
  }

  morphology(src) {
    let kernelSize = this.controls.morphologySize;
    let kernel = cv.getStructuringElement(Number(this.controls.morphologyShape), {width: kernelSize, height: kernelSize});
    let color = new cv.Scalar();
    let op = Number(this.controls.morphologyOp);
    let image = src;
    if (op === cv.MORPH_GRADIENT || op === cv.MORPH_TOPHAT || op === cv.MORPH_BLACKHAT) {
      cv.cvtColor(src, dstC3, cv.COLOR_RGBA2RGB);
      image = this.dstC3;
    }
    cv.morphologyEx(image, dstC4, op, kernel, {x: -1, y: -1}, 1, Number(this.controls.morphologyBorderType), color);
    kernel.delete();
    return dstC4;
  }

  processVideo = () => {

    this.stats.begin()
    this.vc.read(this.src)
    let result

    console.log("...this.controls.filter...", this.controls.filter)
    // console.log("...this.controls.this.gray...", this.gray)
    switch (this.controls.filter) {
      case 'passThrough': result = this.passThrough(this.src); break;
      case 'gray': result = this.gray(this.src); break;
      case 'hsv': result = this.hsv(this.src); break;
      case 'canny': result = this.canny(this.src); break;
      case 'inRange': result = this.inRange(this.src); break;
      case 'threshold': result = this.threshold(this.src); break;
      case 'adaptiveThreshold': result = this.adaptiveThreshold(this.src); break;
      case 'gaussianBlur': result = this.gaussianBlur(this.src); break;
      case 'bilateralFilter': result = this.bilateralFilter(this.src); break;
      case 'medianBlur': result = this.medianBlur(this.src); break;
      case 'sobel': result = this.sobel(this.src); break;
      case 'scharr': result = this.scharr(this.src); break;
      case 'laplacian': result = this.laplacian(this.src); break;
      case 'contours': result = this.contours(this.src); break;
      case 'calcHist': result = this.calcHist(this.src); break;
      case 'equalizeHist': result = this.equalizeHist(this.src); break;
      case 'backprojection': result = this.backprojection(this.src); break;
      case 'erosion': result = this.erosion(this.src); break;
      case 'dilation': result = this.dilation(this.src); break;
      case 'morphology': result = this.morphology(this.src); break;
      default: result = this.passThrough(this.src);
    }

    cv.imshow("canvasOutput", result)
    this.stats.end()

    this.lastFilter = this.controls.filter
    requestAnimationFrame(this.processVideo)

  }

  stopVideoProcessing() {

    if (this.src != null && !this.src.isDeleted()) this.src.delete()
    if (this.dstC1 != null && !this.dstC1.isDeleted()) this.dstC1.delete()
    if (this.dstC3 != null && !this.dstC3.isDeleted()) this.dstC3.delete()
    if (this.dstC4 != null && !this.dstC4.isDeleted()) this.dstC4.delete()

  }

  stopCamera() {
    if (!this.streaming) return;
    stopVideoProcessing();
    document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, width, height);
    video.pause();
    video.srcObject=null;
    this.stream.getVideoTracks()[0].stop();
    this.streaming = false;
  }

  contours(src) {
    cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
    cv.threshold(dstC1, dstC4, 120, 200, cv.THRESH_BINARY);
    let contours  = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(dstC4, contours, hierarchy, Number(this.controls.contoursMode), Number(this.controls.contoursMethod), {x: 0, y: 0});
    this.dstC3.delete();
    this.dstC3 = cv.Mat.ones(this.height, width, cv.CV_8UC3);
    for (let i = 0; i<contours.size(); ++i)
    {
      let color = contoursColor[i];
      cv.drawContours(dstC3, contours, i, color, 1, cv.LINE_8, hierarchy);
    }
    contours.delete(); hierarchy.delete();
    return dstC3;
  }

  calcHist(src) {
    cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
    let srcVec = new cv.MatVector();
    srcVec.push_back(dstC1);
    let scale = 2;
    let channels = [0], histSize = [src.cols/scale], ranges = [0,255];
    let hist = new cv.Mat(), mask = new cv.Mat(), color = new cv.Scalar(0xfb, 0xca, 0x04, 0xff);
    cv.calcHist(srcVec, channels, mask, hist, histSize, ranges);
    let result = cv.minMaxLoc(hist, mask);
    var max = result.maxVal;
    cv.cvtColor(dstC1, dstC4, cv.COLOR_GRAY2RGBA);
    // draw histogram on src
    for(var i = 0; i < histSize[0]; i++)
    {
        var binVal = hist.data32F[i] * src.rows / max;
        cv.rectangle(dstC4, {x: i * scale, y: src.rows - 1}, {x: (i + 1) * scale - 1, y: src.rows - binVal/3}, color, cv.FILLED);
    }
    srcVec.delete();
    mask.delete();
    hist.delete();
    return dstC4;
  }

  equalizeHist(src) {
    cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY, 0);
    cv.equalizeHist(dstC1, dstC1);
    return dstC1;
  }

  laplacian(src) {
    var mat = new cv.Mat(this.height, this.width, cv.CV_8UC1)
    cv.cvtColor(this.src, mat, cv.COLOR_RGB2GRAY)
    cv.Laplacian(mat, this.dstC1, cv.CV_8U, this.controls.laplacianSize, 1, 0, cv.BORDER_DEFAULT)
    mat.delete()
    return this.dstC1
  }

  startVideoProcessing() {

    if (!this.streaming) { console.warn("Please startup your webcam"); return; }
    console.warn("startVideoProcessing", this.stopVideoProcessing)
    this.stopVideoProcessing()
    this.src = new cv.Mat(this.height, this.width, cv.CV_8UC4)
    this.dstC1 = new cv.Mat(this.height, this.width, cv.CV_8UC1)
    this.dstC3 = new cv.Mat(this.height, this.width, cv.CV_8UC3)
    this.dstC4 = new cv.Mat(this.height, this.width, cv.CV_8UC4)
    requestAnimationFrame(this.processVideo)

  }

  passThrough(src) {
    return src;
  }

  gray(src) {
    console.log("WORK OR NOT src ", src)
    console.log("WORK OR NOT cv", cv)
    cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY);
    return this.dstC1;
    // cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
    // return dstC1;
  }

  hsv(src) {
    cv.cvtColor(src, this.dstC3, cv.COLOR_RGBA2RGB);
    cv.cvtColor(this.dstC3, this.dstC3, cv.COLOR_RGB2HSV);
    return this.dstC3;
  }

  canny(src) {
    cv.cvtColor(src, this.dstC1, cv.COLOR_RGBA2GRAY);
    cv.Canny(this.dstC1, this.dstC1, this.controls.cannyThreshold1, this.controls.cannyThreshold2, this.controls.cannyApertureSize, this.controls.cannyL2Gradient);
    return this.dstC1;
  }

  inRange(src) {
    let lowValue = this.controls.inRangeLow;
    let lowScalar = new cv.Scalar(lowValue, lowValue, lowValue, 255);
    let highValue = this.controls.inRangeHigh;
    let highScalar = new cv.Scalar(highValue, highValue, highValue, 255);
    let low = new cv.Mat(height, width, src.type(), lowScalar);
    let high = new cv.Mat(height, width, src.type(), highScalar);
    cv.inRange(src, low, high, dstC1);
    low.delete(); high.delete();
    return dstC1;
  }

  threshold(src) {
    cv.threshold(src, this.dstC4, this.controls.thresholdValue, 200, cv.THRESH_BINARY);
    return this.dstC4;
  }

  adaptiveThreshold(src) {
    let mat = new cv.Mat(this.height, this.width, cv.CV_8U)
    cv.cvtColor(src, mat, cv.COLOR_RGBA2GRAY)
    cv.adaptiveThreshold(mat, this.dstC1, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, Number(this.controls.adaptiveBlockSize), 2)
    mat.delete()
    return this.dstC1
  }

  gaussianBlur(src) {
    cv.GaussianBlur(src, dstC4, {width: this.controls.gaussianBlurSize, height: this.controls.gaussianBlurSize}, 0, 0, cv.BORDER_DEFAULT);
    return dstC4;
  }

  bilateralFilter(src) {
    let mat = new cv.Mat(height, width, cv.CV_8UC3);
    cv.cvtColor(src, mat, cv.COLOR_RGBA2RGB);
    cv.bilateralFilter(mat, dstC3, this.controls.bilateralFilterDiameter, this.controls.bilateralFilterSigma, this.controls.bilateralFilterSigma, cv.BORDER_DEFAULT);
    mat.delete();
    return dstC3;
  }

  medianBlur(src) {
    cv.medianBlur(src, dstC4, this.controls.medianBlurSize);
    return dstC4;
  }

  sobel(src) {
    var mat = new cv.Mat(height, width, cv.CV_8UC1);
    cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);
    cv.Sobel(mat, dstC1, cv.CV_8U, 1, 0, this.controls.sobelSize, 1, 0, cv.BORDER_DEFAULT);
    mat.delete();
    return dstC1;
  }

  scharr(src) {
    var mat = new cv.Mat(height, width, cv.CV_8UC1);
    cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);
    cv.Scharr(mat, dstC1, cv.CV_8U, 1, 0, 1, 0, cv.BORDER_DEFAULT);
    mat.delete();
    return dstC1;
  }

}
