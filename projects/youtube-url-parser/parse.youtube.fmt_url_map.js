"use strict";

var YouTubeParser = /*#__PURE__*/function () {
  function YouTubeParser() {
    this.videoInfo = '';
    this.rdata = []; // this.debug = true;
  }

  var _proto = YouTubeParser.prototype;

  _proto.setVideoInfo = function setVideoInfo(videoInfo) {
    this.videoInfo = videoInfo;
  };

  _proto.buildVideoUrlHTMLTag = function buildVideoUrlHTMLTag(item, title, method) {
    return '<a href="' + decodeURIComponent(item.fmt_url) + "&title=" + encodeURI(title.replace('"', '')) + '" target="_blank"><b>' + method + '&nbsp;&nbsp;&nbsp;' + item.fmtstr + '</b></a>';
  };

  _proto.parseInfo = function parseInfo(infostr) {
    var result = {};
    var tmp = infostr.split('&');

    for (var i in tmp) {
      var tmp2 = tmp[i].split('=');
      result[tmp2[0]] = decodeURIComponent(tmp2[1]);
    }

    return result;
  };

  _proto.getYouTubeUrl = function getYouTubeUrl() {
    var succ = 0,
        dllinks = [],
        webmlinks = [],
        dllinksAdaptive = [];
    var rdataArray = this.parseInfo(this.videoInfo);
    this.rdata = rdataArray; // this.debugInfo(this.rdata);

    var url_classic = this.parseUrls(rdataArray, 'formats'); // this.debugInfo(url_classic);

    var url_adaptive = this.parseUrls(rdataArray, 'adaptiveFormats'); // this.debugInfo(url_adaptive);

    var title = this.parseTitle(rdataArray); // this.debugInfo(title);

    for (var i in url_classic) {
      var item = url_classic[i];

      if (item.is_webm) {
        webmlinks.push(this.buildVideoUrlHTMLTag(item, title, 'Watch online'));
      } else {
        dllinks.push(this.buildVideoUrlHTMLTag(item, title, 'Download'));
      }
    }

    for (var _i in url_adaptive) {
      var _item = url_adaptive[_i];
      dllinksAdaptive.push(this.buildVideoUrlHTMLTag(_item, title, 'Download'));
    }

    var dl_links_result = '';

    if (dllinks.length > 0) {
      dl_links_result += dllinks.join('<br />');
    }

    if (webmlinks.length > 0) {
      dl_links_result += '<br />' + webmlinks.join('<br />');
    }

    if (dllinksAdaptive.length > 0) {
      dl_links_result += '<br /><br />special files (separated audio and video):<br />';
      dl_links_result += '<br />' + dllinksAdaptive.join('<br />');
    }

    var div_dl;

    if (dl_links_result.length > 0) {
      $('#result_div').remove();
      div_dl = document.createElement('div');
      $(div_dl).html(dl_links_result).css('padding', '7px 0 0 0');
      $(div_dl).attr('id', 'result_div');
      $('#videoInfo').after(div_dl);
      $('#downloadInfo').css('display', 'block');
      succ = 1;
    }

    if (succ == 0) {
      var player_response = JSON.parse(rdataArray.player_response);
      var rdata_status = "[" + player_response.playabilityStatus.status + "] " + player_response.playabilityStatus.reason;
      var rdata_reason = '';

      try {
        var c = player_response.playabilityStatus.errorScreen.playerErrorMessageRenderer.subreason.runs;

        for (var _i2 in c) {
          rdata_reason += c[_i2].text;
        }

        rdata_reason = rdata_reason.replace(/\+/g, ' ');
      } catch (e) {
        rdata_reason = '因不明原因無法擷取';
      }

      var result = '<b>&#28961;&#27861;&#21462;&#24471;&#24433;&#29255; URL</b><br />status : <span style="color:#f00;">' + rdata_status + '</span><br />' + 'reason : <span style="color:#f00;">' + rdata_reason + '</span>';
      $('#result_div').remove();
      div_dl = document.createElement('div');
      $(div_dl).html(result).css('padding', '7 0 7px 0');
      $(div_dl).attr('id', 'result_div');
      $('#videoInfo').after(div_dl);
    }

    return true;
  };

  _proto.parseUrls = function parseUrls(rdataArray, type) {
    var items = [];

    if (typeof rdataArray.player_response !== "undefined") {
      var player_response = JSON.parse(rdataArray.player_response); // this.debugInfo(player_response);

      if (typeof player_response.streamingData !== 'undefined') {
        var streamingDataItems = player_response.streamingData[type];
        items = this.parseUrlsItems(streamingDataItems);
      }
    }

    return items;
  };

  _proto.parseUrlsItems = function parseUrlsItems(streamingDataItems) {
    var items = [];

    for (var i in streamingDataItems) {
      var data = streamingDataItems[i];
      var item = {};
      item.fmt = parseInt(data.itag, 10);

      if (typeof data.url !== 'undefined') {
        item.fmt_url = data.url;
      } else if (typeof data.cipher !== 'undefined') {
        data.cipher = this.parseInfo(data.cipher);
        item.fmt_url = decodeURIComponent(data.cipher.url) + '&' + data.cipher.sp + '=' + this.SigHandlerAlternative(data.cipher.s);
      } else if (typeof data.signatureCipher !== 'undefined') {
        data.signatureCipher = this.parseInfo(data.signatureCipher);
        item.fmt_url = decodeURIComponent(data.signatureCipher.url) + '&' + data.signatureCipher.sp + '=' + this.SigHandlerAlternative(data.signatureCipher.s);
      }

      item.is_webm = this.checkIsWebM(data.mimeType);
      item.fmtstr = this.getFormatStr(data);
      items.push(item);
    }

    return items;
  };

  _proto.parseTitle = function parseTitle(rdataArray) {
    var player_response = JSON.parse(rdataArray.player_response);
    var title = player_response.videoDetails.title;

    if (typeof title === "undefined") {
      title = '';
    } else {
      title = title.replace(/%22/g, '');
    }

    return title;
  };

  _proto.checkIsWebM = function checkIsWebM(mimeType) {
    return mimeType.split(';')[0].split('/')[1].toUpperCase() == 'WEBM' ? true : false;
  };

  _proto.getFormatStr = function getFormatStr(data) {
    var fmtstr = '';

    if (typeof data.qualityLabel === 'undefined') {
      // audio only
      fmtstr = "<div style=\"display: inline-block; width: 250px;\">Audio (" + data.mimeType.split(';')[0].split('/')[1].toUpperCase() + (typeof data.audioChannels === 'undefined' ? '' : ', ' + (data.audioChannels == 2 ? 'Stereo' : 'Mono') + (typeof data.audioSampleRate === "undefined" ? '' : ' ' + parseInt(data.audioSampleRate / 1000, 10) + 'KHz')) + ")</div> \u274C <span style=\"color: #f00\">video</span> &nbsp;&nbsp;&nbsp; \u2705 <span style=\"color:#008000;\">audio</span>";
    } else {
      fmtstr = data.qualityLabel + " (" + data.mimeType.split(';')[0].split('/')[1].toUpperCase() + ", " + data.width + " x " + data.height;

      if (typeof data.audioQuality === 'undefined') {
        // video only
        fmtstr = '<div style="display: inline-block; width: 250px;">' + fmtstr + ")</div> \u2705 <span style=\"color: #008000\">video</span> &nbsp;&nbsp;&nbsp; \u274C <span style=\"color:#f00;\">audio</span>";
      } else {
        // audio and video
        fmtstr += (typeof data.audioChannels === 'undefined' ? '' : ', ' + (data.audioChannels == 2 ? 'Stereo' : 'Mono') + (typeof data.audioSampleRate === "undefined" ? '' : ' ' + parseInt(data.audioSampleRate / 1000, 10) + 'KHz')) + ")";
      }
    }

    return fmtstr;
  };

  _proto.urldecode = function urldecode(str) {
    return decodeURIComponent(str.replace(/\+/g, '%20'));
  };

  _proto.swap = function swap(sArray, location) {
    location = location % sArray.length;
    var _ref = [sArray[location], sArray[0]];
    sArray[0] = _ref[0];
    sArray[location] = _ref[1];
    return sArray;
  };

  _proto.SigHandlerAlternative = function SigHandlerAlternative(s) {
    var sArray = s.split("");
    var scode = [17, 0, -3, 12, -1, 0, 47, 0];

    for (var i in scode) {
      var code = scode[i];

      if (code > 0) {
        sArray = this.swap(sArray, code);
      } else if (code == 0) {
        sArray = sArray.reverse();
      } else {
        sArray = sArray.slice(-1 * code);
      }
    }

    return sArray.join("");
  };

  _proto.debugInfo = function debugInfo(info) {
    if (this.debug) {
      console.log(info);
    }
  };

  return YouTubeParser;
}();

function getYouTubeUrl() {
  var parser = new YouTubeParser();
  parser.setVideoInfo($('#videoInfo').val());
  return parser.getYouTubeUrl();
}

;
