(function() {
  var addMatrixToHistory, addSlide, clearAfter, decodeQS, encodeQS, evExpr, finalize, historyElt, install, matToTextarea, multBtn, multFactor, multRow, newMatBtn, newMatDiv, newMatrix, newSlide, onSlideChange, pageTitle, parseMatrix, parseSlide, popMatrixFromHistory, refDiv, renderMatrix, rrefDiv, rrepBtn, rrepFactor, rrepRow1, rrepRow2, selectorRow, selectors, swapBtn, swapRow1, swapRow2, updateRREF, updatingState, urlCallback, urlParams, useMatBtn;

  urlCallback = function() {};

  urlParams = {};

  window.onpopstate = function() {
    var decode, match, pl, query, search;
    pl = /\+/g;
    search = /([^&=]+)=?([^&]*)/g;
    decode = function(s) {
      return decodeURIComponent(s.replace(pl, " "));
    };
    query = window.location.search.substring(1);
    urlParams = {};
    while (match = search.exec(query)) {
      urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlCallback();
  };

  window.onpopstate();

  evExpr = function(expr) {
    var error;
    try {
      return exprEval.Parser.evaluate(expr);
    } catch (error) {
      return 0;
    }
  };

  parseMatrix = function(str) {
    var entries, entry, inRow, inRows, j, k, l, len1, len2, len3, m, mat, maxRow, n, ref, ref1, row;
    if (!str) {
      return null;
    }
    inRows = str.split(':');
    maxRow = 0;
    mat = [];
    for (k = 0, len1 = inRows.length; k < len1; k++) {
      inRow = inRows[k];
      row = [];
      entries = inRow.split(',');
      for (j = l = 0, len2 = entries.length; l < len2; j = ++l) {
        entry = entries[j];
        row.push(evExpr(entry));
        maxRow = Math.max(maxRow, j + 1);
      }
      mat.push(row);
    }
    for (m = 0, len3 = mat.length; m < len3; m++) {
      row = mat[m];
      for (n = ref = row.length, ref1 = maxRow; ref <= ref1 ? n < ref1 : n > ref1; ref <= ref1 ? n++ : n--) {
        row.push(0);
      }
    }
    if (mat.length === 0 || maxRow === 0) {
      return null;
    }
    return mat;
  };

  parseSlide = function(shortOp) {
    var factor, parseFrac, row1, row2, rowNum, sourceRow, targetRow, type, vals;
    type = shortOp[0];
    vals = shortOp.slice(1).split(':');
    parseFrac = function(s) {
      return evExpr(s.replace('.', '/'));
    };
    if (type === 's') {
      row1 = parseInt(vals[0]);
      row2 = parseInt(vals[1]);
      return rrmat.rowSwap(row1, row2).chain;
    }
    if (type === 'm') {
      rowNum = parseInt(vals[0]);
      factor = parseFrac(vals[1]);
      return rrmat.rowMult(rowNum, factor).chain;
    }
    if (type === 'r') {
      sourceRow = parseInt(vals[0]);
      factor = parseFrac(vals[1]);
      targetRow = parseInt(vals[2]);
      return rrmat.rowRep(sourceRow, factor, targetRow).chain;
    }
  };

  encodeQS = function() {
    var den, encMat, encOps, ent, k, l, len1, len2, mat, num, outRow, outRows, ref, ret, row, slide;
    mat = slideshow.states[0].matrix;
    outRows = [];
    for (k = 0, len1 = mat.length; k < len1; k++) {
      row = mat[k];
      outRow = [];
      for (l = 0, len2 = row.length; l < len2; l++) {
        ent = row[l];
        ref = RRMatrix.approxFraction(ent), num = ref[0], den = ref[1];
        outRow.push(num + (den !== 1 ? "%2F" + den : ""));
      }
      outRows.push(outRow.join(','));
    }
    encMat = outRows.join(':');
    encOps = ((function() {
      var len3, m, ref1, results;
      ref1 = slideshow.slides;
      results = [];
      for (m = 0, len3 = ref1.length; m < len3; m++) {
        slide = ref1[m];
        results.push(slide.data.shortOp);
      }
      return results;
    })()).join(',');
    ret = "mat=" + encMat + "&ops=" + encOps + "&cur=" + slideshow.currentSlideNum;
    if (urlParams.augment) {
      ret += "&augment=" + urlParams.augment;
    }
    return ret;
  };

  updatingState = false;

  decodeQS = function() {
    var cur, i, k, len1, mat, op, ops, same, slide, state;
    mat = parseMatrix(urlParams.mat);
    cur = parseInt(urlParams.cur);
    if (isNaN(cur)) {
      cur = 0;
    }
    if (urlParams.ops) {
      ops = urlParams.ops.split(',');
    } else {
      ops = [];
    }
    state = slideshow.states[0];
    same = true;
    updatingState = true;
    for (i = k = 0, len1 = ops.length; k < len1; i = ++k) {
      op = ops[i];
      if (same) {
        if (i >= slideshow.slides.length || op !== slideshow.slides[i].data.shortOp) {
          same = false;
          clearAfter(i);
        }
      }
      if (same) {
        slide = slideshow.slides[i];
      } else {
        slide = parseSlide(op);
        addSlide(slide);
      }
      state = slide.transform(state);
      if (!same) {
        addMatrixToHistory(state.matrix, slide.data.texOp);
      }
    }
    if (same && ops.length < slideshow.slides.length) {
      clearAfter(ops.length);
    }
    slideshow.goToSlide(cur);
    updatingState = false;
    return updateRREF();
  };

  matToTextarea = function(mat) {
    var den, ent, k, l, len1, len2, num, outRow, outRows, ref, row, text;
    outRows = [];
    for (k = 0, len1 = mat.length; k < len1; k++) {
      row = mat[k];
      outRow = [];
      for (l = 0, len2 = row.length; l < len2; l++) {
        ent = row[l];
        ref = RRMatrix.approxFraction(ent), num = ref[0], den = ref[1];
        text = num.toString();
        if (den !== 1) {
          text += '/' + den.toString();
        }
        outRow.push(text);
      }
      outRows.push(row.join(', '));
    }
    return outRows.join('\n');
  };

  renderMatrix = function(mat, elt) {
    var augment, ent, i, k, l, latex, len1, len2, m, n, o, outRow, outRows, ref, ref1, ref2, ref3, row;
    latex = '\\left[\\begin{array}';
    augment = parseInt(urlParams.augment);
    latex += '{';
    if (isNaN(augment)) {
      for (i = k = 0, ref = mat[0].length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        latex += 'c';
      }
    } else {
      for (i = l = 0, ref1 = augment; 0 <= ref1 ? l <= ref1 : l >= ref1; i = 0 <= ref1 ? ++l : --l) {
        latex += 'c';
      }
      latex += '|';
      for (i = m = ref2 = augment, ref3 = mat[0].length; ref2 <= ref3 ? m < ref3 : m > ref3; i = ref2 <= ref3 ? ++m : --m) {
        latex += 'c';
      }
    }
    latex += '}';
    outRows = [];
    for (n = 0, len1 = mat.length; n < len1; n++) {
      row = mat[n];
      outRow = [];
      for (o = 0, len2 = row.length; o < len2; o++) {
        ent = row[o];
        outRow.push(RRMatrix.texFraction(ent));
      }
      outRows.push(outRow.join('&'));
    }
    latex += outRows.join('\\\\');
    latex += '\\end{array}\\right]';
    return katex.render(latex, elt);
  };

  addMatrixToHistory = function(mat, texOp) {
    var arrow, child;
    child = document.createElement('div');
    historyElt.appendChild(child);
    renderMatrix(mat, child);
    if (texOp) {
      arrow = document.createElement('div');
      arrow.className = 'arrow';
      katex.render(texOp, arrow);
      return child.insertBefore(arrow, child.firstChild);
    }
  };

  popMatrixFromHistory = function() {
    return historyElt.lastChild.remove();
  };

  selectorRow = function(selector) {
    var child, i, k, len1, ref;
    ref = selector.children;
    for (i = k = 0, len1 = ref.length; k < len1; i = ++k) {
      child = ref[i];
      if (child.classList.contains('selected')) {
        return i;
      }
    }
    return null;
  };

  clearAfter = function(slideNum) {
    var i, k, len, ref, ref1, results;
    len = slideshow.slides.length;
    results = [];
    for (i = k = ref = slideNum, ref1 = len; ref <= ref1 ? k < ref1 : k > ref1; i = ref <= ref1 ? ++k : --k) {
      slideshow.removeSlide(slideNum);
      results.push(popMatrixFromHistory());
    }
    return results;
  };

  addSlide = function(slide) {
    var anim, blink, col, i, k, len1, s, shake, slides;
    slides = [slide];
    if (slide.data.type === 'rowRep') {
      slides.push(rrmat.highlightPivots());
    }
    if (rrmat.isRREF(slide.transform(slideshow.getState(slideshow.slides.length)))) {
      slide.on('done', updateRREF);
      blink = function(col, delay) {
        var bigger, i, smaller;
        bigger = {
          transform: "scale(2,2)",
          entries: (function() {
            var k, ref, results;
            results = [];
            for (i = k = 0, ref = rrmat.numRows; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
              results.push([i, col]);
            }
            return results;
          })(),
          duration: 0.4,
          delay: delay,
          timing: 'linear'
        };
        smaller = {
          transform: "",
          entries: (function() {
            var k, ref, results;
            results = [];
            for (i = k = 0, ref = rrmat.numRows; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
              results.push([i, col]);
            }
            return results;
          })(),
          duration: 0.4,
          delay: delay + 0.4,
          timing: 'linear'
        };
        return [bigger, smaller];
      };
      shake = function(delay) {
        var center, entries, i, j, left, right;
        entries = [].concat.apply([], (function() {
          var k, ref, results;
          results = [];
          for (j = k = 0, ref = rrmat.numCols; 0 <= ref ? k < ref : k > ref; j = 0 <= ref ? ++k : --k) {
            results.push((function() {
              var l, ref1, results1;
              results1 = [];
              for (i = l = 0, ref1 = rrmat.numRows; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
                results1.push([i, j]);
              }
              return results1;
            })());
          }
          return results;
        })());
        left = {
          transform: "rotate(-20deg)",
          entries: entries,
          duration: .1,
          delay: delay,
          timing: 'linear'
        };
        right = {
          transform: "rotate(20deg)",
          entries: entries,
          duration: .2,
          delay: delay + .1,
          timing: 'linear'
        };
        center = {
          transform: "",
          entries: entries,
          duration: .1,
          delay: delay + .3,
          timing: 'linear'
        };
        return [left, right, center];
      };
      anim = [].concat.apply([], (function() {
        var k, ref, results;
        results = [];
        for (col = k = 0, ref = rrmat.numCols; 0 <= ref ? k < ref : k > ref; col = 0 <= ref ? ++k : --k) {
          results.push(blink(col, col * 0.2));
        }
        return results;
      })());
      anim = anim.concat.apply(anim, (function() {
        var k, ref, results;
        results = [];
        for (col = k = ref = rrmat.numCols - 1; ref <= 0 ? k <= 0 : k >= 0; col = ref <= 0 ? ++k : --k) {
          results.push(blink(col, (rrmat.numCols - col - 1) * 0.2 + rrmat.numCols * 0.4 - 0.2));
        }
        return results;
      })());
      anim = anim.concat.apply(anim, (function() {
        var k, results;
        results = [];
        for (i = k = 0; k < 5; i = ++k) {
          results.push(shake(i * .4 + rrmat.numCols * 0.8 - 0.2));
        }
        return results;
      })());
      slides.push(rrmat.setStyle(anim));
    }
    for (k = 0, len1 = slides.length; k < len1; k++) {
      s = slides[k];
      slideshow.addSlide(s);
    }
    return slideshow["break"]();
  };

  newSlide = function(slide) {
    if (slideshow.playing) {
      slideshow.nextSlide();
    }
    clearAfter(slideshow.currentSlideNum);
    addSlide(slide);
    return slideshow.nextSlide();
  };

  updateRREF = function() {
    if (rrmat.isRREF()) {
      refDiv.classList.add('inactive');
      return rrefDiv.classList.remove('inactive');
    } else if (rrmat.isREF()) {
      rrefDiv.classList.add('inactive');
      return refDiv.classList.remove('inactive');
    } else {
      rrefDiv.classList.add('inactive');
      return refDiv.classList.add('inactive');
    }
  };

  onSlideChange = function() {
    var current, i, k, matrices, ref, ref1, results;
    if (updatingState) {
      return;
    }
    updateRREF();
    history.pushState({}, pageTitle, '?' + encodeQS());
    current = slideshow.currentSlideNum;
    matrices = historyElt.children.length;
    if (current >= matrices) {
      results = [];
      for (i = k = ref = matrices, ref1 = current; ref <= ref1 ? k <= ref1 : k >= ref1; i = ref <= ref1 ? ++k : --k) {
        results.push(addMatrixToHistory(slideshow.states[i].matrix, slideshow.slides[i - 1].data.texOp));
      }
      return results;
    }
  };

  historyElt = null;

  pageTitle = null;

  historyElt = null;

  swapBtn = null;

  multBtn = null;

  rrepBtn = null;

  swapRow1 = null;

  swapRow2 = null;

  multRow = null;

  multFactor = null;

  rrepFactor = null;

  rrepRow1 = null;

  rrepRow2 = null;

  newMatBtn = null;

  newMatDiv = null;

  newMatrix = null;

  useMatBtn = null;

  refDiv = null;

  rrefDiv = null;

  selectors = null;

  install = function() {
    var elt, j, k, l, len1, ref, ref1, ref2, select, selector, startMatrix;
    startMatrix = parseMatrix(urlParams.mat);
    pageTitle = document.querySelector('title').innerText;
    historyElt = document.querySelector('div.history');
    swapBtn = document.querySelector('.ops-label.row-swap button');
    multBtn = document.querySelector('.ops-label.row-mult button');
    rrepBtn = document.querySelector('.ops-label.row-rrep button');
    ref = document.querySelectorAll('.ops-control.row-swap .row-selector'), swapRow1 = ref[0], swapRow2 = ref[1];
    multRow = document.querySelector('.ops-control.row-mult .row-selector');
    multFactor = document.querySelector('.ops-control.row-mult input');
    rrepFactor = document.querySelector('.ops-control.row-rrep input');
    ref1 = document.querySelectorAll('.ops-control.row-rrep .row-selector'), rrepRow1 = ref1[0], rrepRow2 = ref1[1];
    newMatBtn = document.querySelector('.newmat-button button');
    newMatDiv = document.querySelector('div.newmat');
    newMatrix = document.querySelector('.newmat textarea');
    useMatBtn = document.querySelector('.newmat div > button');
    refDiv = document.querySelector('.row-ref');
    rrefDiv = document.querySelector('.row-rref');
    selectors = document.querySelectorAll('.slideshow .row-selector');
    useMatBtn.onclick = function() {
      var val;
      val = newMatrix.value.replace(/\n/g, ":").replace(/\s/g, "").replace(/:+$/, "");
      val = encodeURIComponent(val).replace(/%(?:2C|3A)/g, unescape);
      return window.location.href = "?mat=" + val;
    };
    if (!startMatrix) {
      newMatDiv.classList.add('active');
      document.getElementById("rrmat-ui").style.display = 'none';
      document.getElementById("mathbox").style.display = 'none';
      return;
    }
    for (k = 0, len1 = selectors.length; k < len1; k++) {
      selector = selectors[k];
      select = (function(selector) {
        return function(ev) {
          var child, l, len2, ref2, results;
          ref2 = selector.children;
          results = [];
          for (l = 0, len2 = ref2.length; l < len2; l++) {
            child = ref2[l];
            if (child === ev.target) {
              results.push(child.classList.add('selected'));
            } else {
              results.push(child.classList.remove('selected'));
            }
          }
          return results;
        };
      })(selector);
      for (j = l = 1, ref2 = startMatrix.length; 1 <= ref2 ? l <= ref2 : l >= ref2; j = 1 <= ref2 ? ++l : --l) {
        elt = document.createElement('button');
        elt.className = 'row-button';
        elt.innerText = j.toString();
        elt.onclick = select;
        selector.appendChild(elt);
      }
    }
    newMatrix.value = matToTextarea(startMatrix);
    swapBtn.onclick = function() {
      var row1, row2;
      row1 = selectorRow(swapRow1);
      row2 = selectorRow(swapRow2);
      if ((row1 == null) || (row2 == null) || row1 === row2) {
        return;
      }
      return newSlide(rrmat.rowSwap(row1, row2).chain);
    };
    multBtn.onclick = function() {
      var factor, row;
      row = selectorRow(multRow);
      factor = evExpr(multFactor.value);
      if ((row == null) || isNaN(factor) || factor === 0) {
        return;
      }
      return newSlide(rrmat.rowMult(row, factor).chain);
    };
    rrepBtn.onclick = function() {
      var factor, row1, row2;
      row1 = selectorRow(rrepRow1);
      row2 = selectorRow(rrepRow2);
      factor = evExpr(rrepFactor.value);
      if ((row1 == null) || (row2 == null) || row1 === row2 || isNaN(factor)) {
        return;
      }
      return newSlide(rrmat.rowRep(row1, factor, row2).chain);
    };
    newMatBtn.onclick = function() {
      if (newMatDiv.classList.contains('active')) {
        return newMatDiv.classList.remove('active');
      } else {
        return newMatDiv.classList.add('active');
      }
    };
    addMatrixToHistory(startMatrix);
    return startMatrix;
  };

  finalize = function() {
    slideshow.on('slide.new', onSlideChange);
    urlCallback = decodeQS;
    return decodeQS();
  };

  window.RRInter = {};

  window.RRInter.install = install;

  window.RRInter.finalize = finalize;

  window.RRInter.urlParams = urlParams;

}).call(this);
