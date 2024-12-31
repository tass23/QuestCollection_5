var webPlayer = false;
var canSendCommand = true;
var platform = "desktop";

// Disables backspace outside of the command bar
// Otherwise backspace jumps the browser to the previous page, and the game disappears
$(function(){
    var rx = /INPUT|SELECT|TEXTAREA/i;

    $(document).bind("keydown keypress", function(e){
        if( e.which == 8 ){ // 8 == backspace
            if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                e.preventDefault();
            }
        }
    });
});

function sendCommand(text, metadata) {
    markScrollPosition();
    var data = new Object();
    data["command"] = text;
    if (typeof metadata != "undefined") {
        data["metadata"] = metadata;
    }
    UIEvent("RunCommand", JSON.stringify(data));
}

function ASLEvent(event, parameter) {
    UIEvent("ASLEvent", event + ";" + parameter);
}


// RestartGame added by KV
function RestartGame() {
    UIEvent("RestartGame", "");
}

// SaveTranscript "renamed"/replaced by WriteToTranscript
function SaveTranscript(data) {
    WriteToTranscript(data);
}

// WriteToTranscript added by KV to write/append to GAMENAME-transcript.txt in Documents\Quest Transcripts
function WriteToTranscript(data) {
  if (data != '' && typeof (data) == 'string') {
    UIEvent("WriteToTranscript", data);
  }
}

// Added by KV to write/append to GAMENAME-log.txt in Documents\Quest Logs
function WriteToLog(data) {
    if (data != '' && typeof (data) == 'string') {
        UIEvent("WriteToLog", getTimeAndDateForLog() + " " + data);
    }
}

function goUrl(href) {
    UIEvent("GoURL", href);
}

function sendEndWait() {
    UIEvent("EndWait", "");
}

function doSave() {
    UIEvent("Save", $("#divOutput").html());
}

function UIEvent(cmd, parameter) {
    questCefInterop.uiEvent(cmd, parameter);
}

function disableMainScrollbar() {
    $("body").css("overflow", "hidden");
}

function ui_init() {
    $("#gameTitle").remove();
    $("#cmdExitFullScreen").click(function () {
        UIEvent("ExitFullScreen", "");
    });
}

function updateListEval(listName, listData) {
    updateList(listName, eval("(" + listData + ")"));
}

function showExitFullScreenButton(show) {
    if (eval(show)) {
        $("#cmdExitFullScreen").show();
    }
    else {
        $("#cmdExitFullScreen").hide();
    }
    updateStatusVisibility();
}

function panesVisibleEval(visible) {
    panesVisible(eval(visible));
}

function setCompassDirectionsEval(list) {
    setCompassDirections(eval(list));
}

function selectText(containerid) {
    var range = document.createRange();
    range.selectNodeContents(document.getElementById(containerid));
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
