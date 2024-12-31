/*
Quest Compiler
KVMod
version 6.5.2

game.js version 20241208.1100
*/

var selectSizeWithoutStatus = 8;
var selectSizeWithStatus = 6;
var numCommands = 0;
var thisCommand = 0;
var commandsList = new Array();
var tmrTick = null;
var tickCount = 0;
var sendNextGameTickerAfter = 0;
var verbButtonCount = 9;
var commandLog = null;
var canSendCommand = true;
var qjsPlayer = true;
var multiple = false;
var speakEnabled = false;

var game;
function init() {
    game = GetObject("game");
    showStatusVisible(false);
	game.qjsPlayer = true;
    var newFont = GetAttribute(GetObject("game"), "defaultfont");
    if (HasAttribute(GetObject("game"), "cover") && GetAttribute(GetObject("game"), "cover") != "") {
        $("#cover-art").attr('href',GetAttribute(GetObject("game"), "cover")).show();
        $("#cover-pic").attr('src',GetFileURL(GetAttribute(GetObject("game"), "cover")));
    }
    if (HasAttribute(GetObject("game"), "mailto") && GetAttribute(GetObject("game"), "mailto") != '') {
        $("#contact-div").show();
        var mailto = GetAttribute(GetObject("game"), "mailto");
        var link =  $("#contact-link").attr('href');
        var newlink = link.replace(/\$\$YOUREMAILADDRESS\$\$/, mailto);
        $("#contact-link").attr('href', newlink);
    }
    if (HasAttribute(GetObject("game"), "defaultwebfont")) {
        var s = "<link href=\"https://fonts.googleapis.com/css?family=";
        s += GetAttribute(GetObject("game"), "defaultwebfont");
        s += "\" rel=\"stylesheet\">";
        $("body").append(s);
        GetObject("game").defaultfont = GetObject("game").defaultwebfont + ", " + GetObject("game").defaultfont;
        newFont = GetAttribute(GetObject("game"), "defaultwebfont");
    }
    $('body').css('background', GetObject('game').defaultbackground);
    $("#divOutput div span").css("font-family", newFont);
    $("#fontSample").css("font-family", newFont);
    currentFont = newFont;
    var newFontSize = GetAttribute(GetObject("game"), "defaultfontsize");
    $("#divOutput div span").css("font-size", newFontSize + "pt");
    $("#fontSample").css("font-size", newFontSize + "pt");
    currentFontSize = newFontSize;
    $("#button-restart").button().click(function () {
        $("#button-restart").removeClass("ui-state-focus ui-state-hover");
        uiDoRestart();
    });
    $("#button-undo").button().click(function () {
        $("#button-undo").removeClass("ui-state-focus ui-state-hover");
        uiDoUndo();
    });
    $("#button-wait").button().click(function () {
        $("#button-wait").removeClass("ui-state-focus ui-state-hover");
        uiDoWait();
    });
    //%%DEBUG START
    $("#button-test").button().click(function () {
        $("#button-test").removeClass("ui-state-focus ui-state-hover");
        reportError("test error");
    });
    //%%DEBUG END
    $("#button-options").button().click(function () {
        $("#button-options").removeClass("ui-state-focus ui-state-hover");
        $("#gameMore").hide();
        $("#gameOptions").show();
    });
    $("#fontOptions").change(function () {
        var newFont = $("#fontOptions option:selected").text();
        $("#divOutput div span").css("font-family", newFont);
        $("#fontSample").css("font-family", newFont);
        currentFont = newFont;
        set(GetObject("game"), "defaultfont", newFont);
        saveGame();
    });
    $("#fontSize").change(function () {
        var newFontSize = $("#fontSize option:selected").val();
        $("#divOutput div span").css("font-size", newFontSize + "pt");
        $("#fontSample").css("font-size", newFontSize + "pt");
        currentFontSize = newFontSize;
        set(GetObject("game"), "defaultfontsize", parseInt(newFontSize));
        saveGame();
    });
	  
    $(document).on("click", function () {
        if (_waitMode) {
            endWait();
            $("#txtCommand").focus();
        }
    });
	
	$(document).on("click", ".elementmenu", function (event) {
        if (!$(this).hasClass("disabled")) {
            event.preventDefault();
            event.stopPropagation();
            $(this).blur();
            return false;
        }
        $("#txtCommand").focus();
    });

    $(document).on("click", ".exitlink", function () {
        if (!$(this).hasClass("disabled")) {
            sendCommand($(this).data("command"));
        }
        $("#txtCommand").focus();
    });

    $(document).on("click", ".commandlink", function () {
        var $this = $(this);
        if (!$this.hasClass("disabled") && canSendCommand) {
            if ($this.data("deactivateonclick")) {
                $this.addClass("disabled");
                $this.data("deactivated", true);
            }
            sendCommand($this.data("command"));
        }
        $("#txtCommand").focus();
    });

    $(document).on("click", "#compassLabel", function () {
        $("#compassAccordion").toggle();
    });
    $(document).on("click", "#placesObjectsLabel", function () {
        $("#objectsList").toggle();
    });
    $(document).on("click", "#inventoryLabel", function () {
        $("#inventoryList").toggle();
    });
    $("#gamePanes").css("min-width", $("#gamePanes").width());
    // fix to make compass button icons centred
    $(".compassbutton span").css("left", "0.8em");
    worldmodelInitialise();
    if (!loadGame()) {
        worldModelBeginGame();
    }
    if ($(window).width() < 800) {
        currentTab = "string";
    }
    if (ListContains(AllObjects(), GetObject("key "))) {
        GetObject("key ").alias = "key";
    }
    GetObject("game").runturnscripts = false;
    TryFinishTurn();
}

function endWait() {
    if (!_waitMode) return;
    sendEndWait();
}

function sendEndWait() {
    waitEnded();

}

function waitEnded() {
    _waitMode = false;
    $("#endWaitLink").remove();
    $("#divCommand").show();
    beginningOfCurrentTurnScrollPosition = $("#gameContent").height();
    window.setTimeout(function () {
       awaitingCallback = false;
       waitCallback();
       TryFinishTurn();
       $("#txtCommand").focus();
    }, 100);
}

function extLink(url) {
    window.open(url, "_system");
}

function showStatusVisible(visible) {
    if (visible) {
        $("#statusVars").show();
        $("#statusLabel").show();
    }
    else {
        $("#statusVars").hide();
        $("#statusLabel").hide();
    }
}

var beginningOfCurrentTurnScrollPosition = 0;
var scrollTimeout = null;

function scrollToEnd() {
    if (scrollTimeout != null) {
        clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(function () {
        scrollTimeout = null;
        scrollToEndNow();
    }, 500);
}

function scrollToEndNow() {
    $('html, body').animate({ scrollTop: beginningOfCurrentTurnScrollPosition - 30 }, 200);
}

function updateLocation(text) {
    if (GetObject("game").showlocation) {
        $("#location").html(text);
    }
    else {
        $("#location").hide();
    }
}

var _waitMode = false;
var _pauseMode = false;
var _waitingForSoundToFinish = false;

var waitButtonId = 0;

function beginWait() {
    if (runningWalkthrough) {
        awaitingCallback = false;
        waitCallback();
        TryFinishTurn();
        return;
    }
    _waitMode = true;
    waitButtonId++;
    addText("<a class=\"cmdlink\" style=\"color:" + currentLinkForeground + ";font-family:" + currentFont + ";font-size:" + currentFontSize + "pt;\" id=\"endWaitLink\" >Continue...</a><br/><br/>");
    $("#endWaitLink").click(function () {
        _waitMode = false;
        $(this).remove();
        $("#divCommand").show();
        
        beginningOfCurrentTurnScrollPosition = $("#gameContent").height();
        window.setTimeout(function () {
            awaitingCallback = false;
            waitCallback();
            TryFinishTurn();
            $("#txtCommand").focus();
        }, 100);
    });
    $("#divCommand").hide();
}



function beginPause(ms) {
    _pauseMode = true;
    $("#divCommand").hide();
    window.setTimeout(function () {
        endPause()
    }, ms);
}

function endPause() {
    _pauseMode = false;
    $("#divCommand").show();
    window.setTimeout(function () {
        // TO DO
        //$("#fldUIMsg").val("endpause");
        //$("#cmdSubmit").click();
    }, 100);
}

function SetTimeout(time,todo){
    //setTimeout(eval(todo),time * 1000);
    //SetTimeoutID (interval, "", script);
    setTimeout(function(){eval(script);}, time*1000);
}


function globalKey(e) {
    if (_waitMode) {
        endWait();
        if (e.keyCode == 13) {
            e.preventDefault();
        }
        return;
    }
}

function commandKey(e) {
    switch (keyPressCode(e)) {
        case 13:
            runCommand();
            return false;
        case 38:
            thisCommand--;
            if (thisCommand == 0) thisCommand = numCommands;
            $("#txtCommand").val(commandsList[thisCommand]);
            break;
        case 40:
            thisCommand++;
            if (thisCommand > numCommands) thisCommand = 1;
            $("#txtCommand").val(commandsList[thisCommand]);
            break;
        case 27:
            thisCommand = numCommands + 1;
            $("#txtCommand").val("");
            break;
        case 82:
            if (e.ctrlKey) {
                uiDoRestart();
                e.preventDefault();
            }
            break;
    }
}

function runCommand() {
    var command = $("#txtCommand").val();
    if (command.length > 0) {
        numCommands++;
        commandsList[numCommands] = command;
        thisCommand = numCommands + 1;
        sendCommand(command);
        $("#txtCommand").val("");
    }
}

function prepareCommand(command) {
    // TO DO
    //$("#fldUITickCount").val(getTickCountAndStopTimer());
    //$("#fldUIMsg").val("command " + command);
}

function showQuestion(title) {
    $("#msgboxCaption").html(title);

    var msgboxOptions = {
        modal: true,
        autoOpen: false,
        buttons: [
            {
                text: "Yes",
                click: function () { msgboxSubmit("yes"); }
            },
            {
                text: "No",
                click: function () { msgboxSubmit("no"); }
            }
        ],
        closeOnEscape: false,
        open: function (event, ui) { $(".ui-dialog-titlebar-close").hide(); }    // suppresses "close" button
    };

    $("#msgbox").dialog(msgboxOptions);
    $("#msgbox").dialog("open");
}

function msgboxSubmit(text) {
    $("#msgbox").dialog("close");
    window.setTimeout(function () {
        // TO DO
        //$("#fldUIMsg").val("msgbox " + text);
        //$("#cmdSubmit").click();
    }, 100);
}

var _menuSelection = "";

function showMenu(title, options, allowCancel) {
    $("#dialogOptions").empty();
    $.each(options, function (key, value) {
        $("#dialogOptions").append(
            $("<option/>").attr("value", key).text(value)
        );
    });

    $("#dialogCaption").html(title);

    var dialogOptions = {
        modal: true,
        autoOpen: false,
        buttons: [{
            text: "Select",
            click: function () { dialogSelect(); }
        }]
    };

    if (allowCancel) {
        dialogOptions.buttons = dialogOptions.buttons.concat([{
            text: "$$TEXT_CANCEL$$",
            click: function () { dialogCancel(); }
        }]);
        dialogOptions.close = function (event, ui) { dialogClose(); };
    }
    else {
        dialogOptions.closeOnEscape = false;
        dialogOptions.open = function (event, ui) { $(".ui-dialog-titlebar-close").hide(); };    // suppresses "close" button
    }

    _menuSelection = "";
    $("#dialog").dialog(dialogOptions);

    $("#dialog").dialog("open");
}

function dialogSelect() {
    _menuSelection = $("#dialogOptions").val();
    if (_menuSelection.length > 0) {
        $("#dialog").dialog("close");
        window.setTimeout(function () {
            SetMenuSelection(_menuSelection);
            updateLists();
        }, 100);
    }
}

function dialogCancel() {
    $("#dialog").dialog("close");
}

function dialogClose() {
    if (_menuSelection.length == 0) {
        dialogSendCancel();
    }
}

function dialogSendCancel() {
    window.setTimeout(function () {
        // TO DO
        //$("#fldUIMsg").val("choicecancel");
        //$("#cmdSubmit").click();
    }, 100);
}

function sessionTimeout() {
    disableInterface();
}

function gameFinished() {
    disableInterface();
}

function disableInterface() {
    $("#divCommand").hide();
    $("#gamePanesRunning").hide();
    $("#gamePanesFinished").show();
}

function playWav(filename, sync, looped) {
    playAudio(filename, sync, looped);
}

function playMp3(filename, sync, looped) {
    playAudio(filename, sync, looped);
}

//function playAudio(filename, format, sync, looped) {
function playAudio(filename, sync, looped) {
    stopAudio();
    msg(" <audio autoplay id='audio-div'><source src='"+filename+"'>Your browser does not support the audio element.</audio> ");
    soundDiv = document.getElementById('audio-div');
    if (looped) {
        $("#audio-div").attr('loop', true);
        if (typeof soundDiv.loop == 'boolean') {
            soundDiv.loop = true;
        }
        else {
            soundDiv.addEventListener('ended', function () {
                soundDiv.currentTime = 0;
                soundDiv.play();
            }, false);
        }
    }
    if (sync) {
        _waitingForSoundToFinish = true;
        $("#divCommand").hide();
        $("#gamePanes").hide();
        setTimeout(function () { $('a').css('color', 'black'); }, 500);
        soundDiv.addEventListener('ended', function () {
            stopAudio();
        }, false);
    }
    //$("#audio-div")[0].play();
}

function stopAudio() {
    $("#audio-div").remove();
    $("#divCommand").show();
    $("#gamePanes").show();
    $('a').css('color', 'blue');
    if (_waitingForSoundToFinish) {
        _waitingForSoundToFinish = false;
    }
}

function finishSync() {
    _waitingForSoundToFinish = false;
    window.setTimeout(function () {
        $("#divCommand").show();
        $("#fldUIMsg").val("endwait");
        $("#cmdSubmit").click();
    }, 100);
}

function panesVisible(visible) {
    if (visible) {
        $("#gamePanes").show();
    }
    else {
        $("#gamePanes").hide();
    }
}

function uiShow(element) {
    if (element == "") return;
    $(element).show();
}

function uiHide(element) {
    if (element == "") return;
    $(element).hide();
}

var _compassDirs = ["northwest", "north", "northeast", "west", "east", "southwest", "south", "southeast", "up", "down", "in", "out"];

var lastPaneLinkId = 0;

function updateList(listName, listData) {
    var listElement = "";
    var emptyListLabel = "";

    if (listName == "inventory") {
        listElement = "#inventoryList";
        emptyListLabel = "#inventoryEmpty";
    }

    if (listName == "placesobjects") {
        $('#gameObjects').show();
        listElement = "#objectsList";
        emptyListLabel = "#placesObjectsEmpty";
    }

    $(listElement).empty();
    $(listElement).show();
    var listcount = 0;
    var anyItem = false;

    $.each(listData, function (key, value) {
        var splitString = value.split(":");
        var objectDisplayName = splitString[0];
        if (typeof (thisObj) !== "undefined") {
            return false;
        }
        var objectVerbs = splitString[1];
        var hasListAlias = false;
        var thisObj = GetObject(objectDisplayName);
        var objNameToClass = objectDisplayName.replace(/ /g, '-');
        var objectListAlias = objectDisplayName;
        if (typeof (thisObj) !== "undefined") {
            if (typeof (thisObj['listalias']) === "string") {
                if (thisObj['listalias'] !== "") {
                    hasListAlias = true;
                    objectListAlias = ProcessText(thisObj['listalias']);
                }
            }
        }
        if (listName == "inventory" && !_compassDirs.includes(objectListAlias)) {
            listcount++;
            lastPaneLinkId++;
            var paneLinkId = "paneLink" + lastPaneLinkId;
            $(listElement).append(
                "<li id=\"" + paneLinkId + "\" class=\"" + objNameToClass + "\" href=\"#\">" + objectListAlias + "</li>"
            );
            bindMenu(paneLinkId, objectVerbs, objectDisplayName, false);
            anyItem = true;
        }
        else if (listName == "placesobjects" && !_compassDirs.includes(objectListAlias)) {

            listcount++;
            lastPaneLinkId++;
            var paneLinkId = "paneLink" + lastPaneLinkId;
            $(listElement).append(
				"<li id=\"" + paneLinkId + "\" class=\"" + objNameToClass + "\" href=\"#\">" + objectListAlias + "</li>"
            );
            bindMenu(paneLinkId, objectVerbs, objectDisplayName, false);
            anyItem = true;
        }
    });
    $(listElement + " li:last-child").addClass('last-child')
    if (listcount == 0) $(listElement).hide();
    if (anyItem) {
        $(emptyListLabel).hide();
    }
    else {
        $(emptyListLabel).show();
    }
}

function updateCompass(directions) {
    updateDir(directions, "NW", _compassDirs[0]);
    updateDir(directions, "N", _compassDirs[1]);
    updateDir(directions, "NE", _compassDirs[2]);
    updateDir(directions, "W", _compassDirs[3]);
    updateDir(directions, "E", _compassDirs[4]);
    updateDir(directions, "SW", _compassDirs[5]);
    updateDir(directions, "S", _compassDirs[6]);
    updateDir(directions, "SE", _compassDirs[7]);
    updateDir(directions, "U", _compassDirs[8]);
    updateDir(directions, "D", _compassDirs[9]);
    updateDir(directions, "In", _compassDirs[10]);
    updateDir(directions, "Out", _compassDirs[11]);
    // fix to make compass button icons centred
    $(".compassbutton span").css("left", "0.8em");
}

function updateDir(directions, label, dir) {
    if (!directions.includes(dir)) {
        $("#cmdCompass" + label).button("disable");
        $("#cmdCompass" + label).addClass("ui-state-disabled").addClass("ui-button-disabled");
    }
    else {
        $("#cmdCompass" + label).button("enable");
        $("#cmdCompass" + label).removeClass("ui-state-disabled").removeClass("ui-button-disabled");
    }
    
}


function compassClick(direction) {
    sendCommand(direction);
}



function addExternalStylesheet(source) {
    var link = $("<link>");
    link.attr({
        type: "text/css",
        rel: "stylesheet",
        href: source
    });
    $("head").append(link);
}

function AddExternalStylesheet(stylesheet)

{

    if (GetObject("game").externalstylesheets == null) {

        set(GetObject("game"), "externalstylesheets", NewStringList());

        }

    if (!(ListContains(GetObject("game").externalstylesheets, stylesheet))) {

        listadd(GetObject("game").externalstylesheets, stylesheet);

        addExternalStylesheet (stylesheet)

    }

}

function sendCommand(text) {
    if (!gameRunning) return;
    if (awaitingInputCallback) {
        awaitingInputCallback = false;
        awaitingCallback = false;
        getinputCallback(text);
        return;
    }
    if (awaitingCallback) return;
    beginningOfCurrentTurnScrollPosition = $("#gameContent").height();

    if (_pauseMode || _waitingForSoundToFinish) return;
    if (_waitMode) {
        endWait();
        return;
    }
    window.setTimeout(function () {
        // TO DO - send tick count
        //prepareCommand(text);

        //%%MAX V510
        msg("");
        msg("&gt; " + text);
        //%%END MAX V510

        //%%DEBUG START
        if (text.substring(0, 4) == "dbg ") {
            runDebugCommand(text.substring(4));
        }
        else {
            //%%DEBUG END
            if (text.substring(0, 6) == "cheat ") {
                runCheatCode(text.substring(6));
            }
            else if (text.trim().toLowerCase() == "restart") {
                uiDoRestart();
            }
            else if (text.trim().toLowerCase() == "menu") {
                $("#moreBtn").click();
            }
            else {
                sendCommandInternal(text);
            }
            //%%DEBUG START
        }
        //%%DEBUG END
    }, 100);
}

function sendCommandInternal(command) {
    var start = (new Date).getTime();
    addToCommandLog(command);
    HandleCommand(command);
    var diff = (new Date).getTime() - start;
    if (typeof (GetObject("game").aslversion) == 'undefined' || game.aslversion < 580) {
        TryFinishTurn();
    }
}

function addToCommandLog(command) {
    if (commandLog == null) {
        commandLog = new Array();
    }
    commandLog.push(command);
}
/*
function runCheatCode(code) {
    var walkthrough = window["object_main"];
    if (walkthrough.steps.indexOf("label:" + code) > -1) {
        runWalkthrough("main", 0, 0, code);
    }
    else {
        sendCommandInternal("cheat " + code);
    }
}
*/
function runCheatCode(code) {
    if (typeof (getElement(code)) != 'undefined' && getElement(code).steps.length > 0) {
        runWalkthrough(code);
    }
    else {
        sendCommandInternal("cheat " + code);
    }
}

//%%DEBUG START
function runDebugCommand(cmd) {
    msg("Debug command: " + cmd);
    if (cmd.substring(0, 2) == "w ") {
        walkthroughUndoTest = false;
        runWalkthrough(cmd.substring(2), 0, 0, "");
    }
    if (cmd.substring(0, 3) == "wu ") {
        walkthroughUndoTest = true;
        walkthroughUndoSteps = 100;
        runWalkthrough(cmd.substring(3), 0, 0, "");
    }
    if (cmd.substring(0, 3) == "wm ") {
        walkthroughUndoTest = false;
        var args = cmd.substring(3).split(" ", 2);
        runWalkthrough(args[1], 0, parseInt(args[0]), "");
    }
    if (cmd.substring(0, 3) == "wr ") {
        walkthroughUndoTest = false;
        var args = cmd.substring(3).split(" ", 3);
        runWalkthrough(args[2], parseInt(args[0]), parseInt(args[1]), "");
    }
    if (cmd == "log") {
        generateSaveLog(function (object, attribute, value) {
            msg(object.name + "." + attribute + "=" + value);
        });
    }
    if (cmd == "parent") {
        for (var idx in allObjects) {
            var obj = allObjects[idx];
            if (obj["_children"]) {
                var childList = "";
                for (var childIdx in obj["_children"]) {
                    childList += obj["_children"][childIdx].name + ",";
                }
                msg(obj.name + ": " + childList);
            }
            else {
                msg(obj.name + ": no children");
            }
        }
    }
}
//%%DEBUG END

function generateSaveLog(fn) {
    var gameElementArray = new Array();
    gameElementArray.push(GetObject("game"));
    generateSaveLogForArray(gameElementArray, fn);
    generateSaveLogForArray(allObjects, fn);
    generateSaveLogForArray(allExits, fn);
    generateSaveLogForArray(allCommands, fn);
    generateSaveLogForArray(allTurnScripts, fn);
    generateSaveLogForArray(allTimers, fn);
    thisTurnModifiedItems = new Array();
}

function generateSaveLogForArray(array, fn) {
    for (var idx in array) {
        var object = array[idx];
        var attrs = object["__modified"];
        if (attrs != undefined) {
            for (var attrIdx in attrs) {
                var attr = attrs[attrIdx];
                fn(object, attr, object[attr]);
            }
        }

        for (var attr in object) {
            var value = object[attr];
            if (typeof value === "object") {
                for (var idx in thisTurnModifiedItems) {
                    var item = thisTurnModifiedItems[idx];

                    if (value === item) {
                        markAttributeModified(object, attr);
                        fn(object, attr, value);
                        break;
                    }
                }
            }
        }
    }
}

function saveGame() {
    if (!gameRunning) return;
    if (awaitingCallback) return;
    if (runningWalkthrough) return;
    setTimeout(function () {
        var start = (new Date).getTime();
        saveGameInternal();
        var diff = (new Date).getTime() - start;
    }, 250);
}

function saveGameInternal() {
    if (!gameRunning) return;
    if (awaitingCallback) return;
    if (!localStorage) return;
    try {
        localStorageTransactionId = localStorage.getItem("transaction");
        if (localStorageTransactionId == undefined) {
            localStorageTransactionId = 1;
        }
        else {
            localStorageTransactionId = 3 - localStorageTransactionId;
        }

        localStorageSet("output", allOutput);
        localStorageSet("output2", $("#divOutput").html());
        localStorageSet("divCount", _divCount);
        if (commandLog != null) {
            localStorageSet("commandLog", commandLog.join(";"));
        }
        localStorageSet("nextObjectId", nextObjectId);

        // Save all object creations
        var createId = 0;
        for (var idx in createdObjects) {
            createId++;
            localStorageSet("create" + createId, createdObjects[idx]);
        }
        localStorageSet("numCreates", createId);

        // Save all object type additions
        var addTypeId = 0;
        for (var idx in addedTypes) {
            addTypeId++;
            localStorageSet("addtype" + addTypeId, addedTypes[idx]);
        }
        localStorageSet("numAddTypes", addTypeId);

        // Save all object attribute changes
        var changeId = 0;
        generateSaveLog(function (object, attribute, value) {
            var valueType = TypeOf(value);
            if (object.name == "player" && StartsWith(attribute, "currentcommand")) return;
            changeId++;
            var key = "change" + changeId;
            var storeValue = value;
            switch (valueType) {
                case "stringlist":
                    storeValue = value.length;
                    var count = 0;
                    for (var idx in value) {
                        localStorageSet(key + "_" + count, value[idx]);
                        count++;
                    }
                    break;
                case "objectlist":
                    storeValue = value.length;
                    var count = 0;
                    for (var idx in value) {
                        localStorageSet(key + "_" + count, value[idx]._js_name);
                        count++;
                    }
                    break;
                case "stringdictionary":
                case "scriptdictionary":
                    var count = 0;
                    for (var dictKey in value) {
                        localStorageSet(key + "_k" + count, dictKey);
                        localStorageSet(key + "_v" + count, value[dictKey]);
                        count++;
                    }
                    storeValue = count;
                    break;
                case "objectdictionary":
                    var count = 0;
                    for (var dictKey in value) {
                        localStorageSet(key + "_k" + count, dictKey);
                        localStorageSet(key + "_v" + count, value[dictKey]._js_name);
                        count++;
                    }
                    storeValue = count;
                    break;
                case "object":
                    storeValue = value._js_name;
                    break;
                case "null":
                    storeValue = "";
            }

            localStorageSet(key, object._js_name + "." + attribute + "=" + valueType + ":" + storeValue);
        });
        localStorageSet("numChanges", changeId);

        // Save all object destroys
        var destroyId = 0;
        for (var idx in destroyedObjects) {
            destroyId++;
            localStorageSet("destroy" + destroyId, destroyedObjects[idx]);
        }
        localStorageSet("numDestroys", destroyId);

        localStorage.setItem("transaction", localStorageTransactionId);
    }
    catch (err) {
        reportError("Failed to save game: " + err);
    }
}

function loadGame() {
    if (!localStorage) return false;

    localStorageTransactionId = localStorage.getItem("transaction");
    if (localStorageTransactionId == undefined) {
        return false;
    }
    try {
        nextObjectId = parseInt(localStorageGet("nextObjectId"));

        // Load object creations

        var commandLogList = localStorageGet("commandLog");
        if (commandLogList != null) {
            commandLog = commandLogList.split(";");
        }
        addToCommandLog("* loaded game");

        var createCount = localStorageGet("numCreates");
        for (var i = 1; i <= createCount; i++) {
            var data = localStorageGet("create" + i);
            var params = data.split(";");
            // format is name;defaultTypeObject.name;objectType
            switch (params[2]) {
                case "object":
                    var array = allObjects;
                    break;
                case "exit":
                    var array = allExits;
                    break;
                case "timer":
                    break;
                case "turnscript":
                    break;
                default:
                    throw "Unhandled create object type " + params[2];
            }
            if (params[2] == "timer") {
                createtimer(params[0]);
            }
            else if (params[2] == "turnscript") {
                createturnscript(params[0]);
            }
            else {
                createInternal(params[0], array, GetObject(params[1]), params[2]);
                // TODO: Add to objectsNameMap
                objectsNameMap[GetObject(params[0])] = GetObject(params[0]);
            }
        }

        // Load object type additions

        var addTypeCount = localStorageGet("numAddTypes");
        for (var i = 1; i <= addTypeCount; i++) {
            var data = localStorageGet("addtype" + i);
            var params = data.split(";");
            // format is object;type
            addTypeToObject(window[params[0]], window[params[1]]);
        }

        // Load object attribute changes

        var changeCount = localStorageGet("numChanges");
        for (var i = 1; i <= changeCount; i++) {
            var data = localStorageGet("change" + i);
            var dotPos = data.indexOf(".");
            var eqPos = data.indexOf("=");
            var colonPos = data.indexOf(":");
            var objectName = data.substring(0, dotPos);
            var attrName = data.substring(dotPos + 1, eqPos);
            var type = data.substring(eqPos + 1, colonPos);
            var valueString = data.substring(colonPos + 1);

            var object = window[objectName];
            var value = valueString;

            switch (type) {
                case "script":
                    eval("_temp_assignfn=" + valueString);
                    value = _temp_assignfn;
                    break;
                case "stringlist":
                    var count = parseInt(valueString);
                    value = new Array();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        value.push(localStorageGet("change" + i + "_" + listIdx));
                    }
                    break;
                case "objectlist":
                    var count = parseInt(valueString);
                    value = new Array();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        value.push(window[localStorageGet("change" + i + "_" + listIdx)]);
                    }
                    break;
                case "stringdictionary":
                    var count = parseInt(valueString);
                    value = new Object();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        var dictKey = localStorageGet("change" + i + "_k" + listIdx);
                        var dictVal = localStorageGet("change" + i + "_v" + listIdx);
                        value[dictKey] = dictVal;
                    }
                    break;
                case "objectdictionary":
                    var count = parseInt(valueString);
                    value = new Object();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        var dictKey = localStorageGet("change" + i + "_k" + listIdx);
                        var dictVal = localStorageGet("change" + i + "_v" + listIdx);
                        value[dictKey] = window[dictVal];
                    }
                    break;
                case "scriptdictionary":
                    var count = parseInt(valueString);
                    value = new Object();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        var dictKey = localStorageGet("change" + i + "_k" + listIdx);
                        var dictVal = localStorageGet("change" + i + "_v" + listIdx);
                        eval("_temp_assignfn=" + dictVal);
                        value[dictKey] = _temp_assignfn;
                    }
                    break;
                case "object":
                    value = window[valueString];
                    break;
                case "null":
                    value = null;
                    break;
                case "int":
                    value = parseInt(valueString);
                    break;
                case "double":
                    value = parseFloat(valueString);
                    break;
                case "boolean":
                    value = (valueString == "true");
            }

            set(object, attrName, value, false);
        }

        // Load object destroys

        var destroyCount = localStorageGet("numDestroys");
        for (var i = 1; i <= destroyCount; i++) {
            var data = localStorageGet("destroy" + i);
            destroy(data);
        }
        game = GetObject("game");
        currentFont = GetObject("game").defaultfont;
        $("#fontOptions").val(currentFont);

        currentFontSize = GetObject("game").defaultfontsize.toString();
        $("#fontSize").val(currentFontSize);

        $("#fontSample").css("font-family", currentFont);
        $("#fontSample").css("font-size", currentFontSize + "pt");

        clearScreen();
        _divCount = localStorageGet("divCount");
        $("#divOutput").html(localStorageGet("output2"));
        msg(localStorageGet("output"));

        beginningOfCurrentTurnScrollPosition = $("#gameContent").height();
        scrollToEnd();

        updateLists();
        return true;
    }
    catch (err) {
        reportError("Failed to load game: " + err);
        return false;
    }
}

var localStorageTransactionId;
var lastRead;

function localStorageSet(key, value) {
    localStorage.setItem("c" + localStorageTransactionId + key, value);
}

function localStorageGet(key) {
    lastRead = key;
    return localStorage.getItem("c" + localStorageTransactionId + key);
}

var currentWalkthroughSteps;
var runningWalkthrough = false;
var stepCount;
var walkthroughMaxSteps;
var walkthroughFinishCode;
//%%DEBUG START
var walkthroughUndoTest = false;
var walkthroughUndoStage;
var walkthroughUndoSteps = 0;
//%%DEBUG END

function runWalkthrough(name, startStep, maxSteps, cheatCode) {
    //%%DEBUG START
    msg("Running walkthrough " + name);
    //%%DEBUG END
    stepCount = 0;
    //%%DEBUG START
    walkthroughUndoStage = 1;
    //%%DEBUG END
    walkthroughMaxSteps = maxSteps;
    walkthroughFinishCode = cheatCode;
    var walkthrough = getElement(name);
    if (walkthrough == undefined) { var walkthrough = getElement("main"); }
    if (walkthrough) {
        currentWalkthroughSteps = addWalkthroughSteps(walkthrough);
        currentWalkthroughSteps.splice(0, startStep);
        runningWalkthrough = true;
        runWalkthroughSteps();
    }
    else {
        msg("No walkthrough of that name");
    }
}

function addWalkthroughSteps(walkthrough) {
    var list = new Array();
    if (walkthrough.parent != null) {
        list = list.concat(addWalkthroughSteps(walkthrough.parent));
    }
    list = list.concat(walkthrough.steps);
    return list;
}

var postStep = null;

function runWalkthroughSteps() {
    //%%DEBUG START
    if (walkthroughUndoTest) {
        if (walkthroughUndoStage == 1) {
            if (walkthroughUndoSteps == stepCount) {
                walkthroughUndoStage++;
            }
        }
        if (walkthroughUndoStage == 2) {
            if (stepCount > 0) {
                stepCount--;
                sendCommandInternal("undo");
                setTimeout(function () {
                    runWalkthroughSteps();
                }, 100);
            }
            else {
                msg("Finished undoing walkthrough steps");
            }
            return;
        }
    }
    //%%DEBUG END

    if (currentWalkthroughSteps == null || currentWalkthroughSteps.length == 0 || (walkthroughMaxSteps > 0 && stepCount >= walkthroughMaxSteps)) {
        //%%DEBUG START
        msg("Finished running walkthrough");
        //%%DEBUG END
        runningWalkthrough = false;
        saveGame();
        return;
    }

    var step = currentWalkthroughSteps.splice(0, 1)[0];

    if (step == "label:" + walkthroughFinishCode) {
        runningWalkthrough = false;
        saveGame();
        return;
    }

    msg("");
    if (StartsWith(step, "assert:")) {
        //%%DEBUG START
        var expr = step.substring(7);
        msg("<b>Assert: </b>" + expr);
        if (eval(expr)) {
            msg("<span style=\"color:green\"><b>Pass</b></span>");
        }
        else {
            msg("<span style=\"color:red\"><b>Failed</b></span>");
            return;
        }
        //%%DEBUG END
    }
    else if (StartsWith(step, "label:")) {
        // ignore
    }
    else {
        stepCount++;
        //%%DEBUG START
        //msg("Step " + stepCount);
        console.log("*** WALKTHROUGH STEP " + stepCount + " ***");
        console.log("Command: " + step);
        //%%DEBUG END
        beginningOfCurrentTurnScrollPosition = $("#gameContent").height();
        //%%MAX V510
        msg("&gt; " + step);
        //%%END MAX V510
        sendCommandInternal(step);
        scrollToEndNow();
    }
    while (postStep) {
        var fn = postStep;
        postStep = null;
        fn();
    }

    setTimeout(function () {
        runWalkthroughSteps();
    }, 100);
}

function updateStatus(text) {
    if (text.length > 0) {
        showStatusVisible(true);
        $("#statusVars").html(text.replace(/\n/g, "<br/>"));
    }
    else {
        showStatusVisible(false);
    }
}

function setBackground(col) {
    $("#divOutput").css("background-color", col);
    $("#gamePanel").css("background-color", col);
}

function ASLEvent(event, parameter) {
    var fn = window[event];
    fn.apply(null, [parameter]);
}

function disableMainScrollbar() {
    $("#divOutput").css("overflow", "hidden");
}

function stopTimer() {
    clearInterval(tmrTick);
}

function getTickCountAndStopTimer() {
    stopTimer();
    return tickCount;
}

function goUrl(href) {
    window.open(href);
}

function setCompassDirections(directions) {
    if (typeof directions === "string") {
        _compassDirs = directions.split(";")
    } else {
        _compassDirs = directions;
    }
    $("#cmdCompassNW").attr("title", _compassDirs[0]);
    $("#cmdCompassN").attr("title", _compassDirs[1]);
    $("#cmdCompassNE").attr("title", _compassDirs[2]);
    $("#cmdCompassW").attr("title", _compassDirs[3]);
    $("#cmdCompassE").attr("title", _compassDirs[4]);
    $("#cmdCompassSW").attr("title", _compassDirs[5]);
    $("#cmdCompassS").attr("title", _compassDirs[6]);
    $("#cmdCompassSE").attr("title", _compassDirs[7]);
    $("#cmdCompassU").attr("title", _compassDirs[8]);
    $("#cmdCompassD").attr("title", _compassDirs[9]);
    $("#cmdCompassIn").attr("title", _compassDirs[10]);
    $("#cmdCompassOut").attr("title", _compassDirs[11]);
}

function setInterfaceString(name, text) {
    switch (name) {
        case "InventoryLabel":
            $("#inventoryLabel").html(text);
            break;
        case "PlacesObjectsLabel":
            $("#placesObjectsLabel").html(text);
            break;
        case "CompassLabel":
            $("#compassLabel").html(text);
            break;
        case "InButtonLabel":
            $("#cmdCompassIn").attr("value", text);
            break;
        case "OutButtonLabel":
            $("#cmdCompassOut").attr("value", text);
            break;
        case "EmptyListLabel":
            break;
        case "NothingSelectedLabel":
            break;
    }
}

function updateVerbButtons(list, verbsArray, idprefix) {
    var selectedIndex = list.prop("selectedIndex");
    var verbs = verbsArray[selectedIndex].split("/");
    var count = 1;
    $.each(verbs, function () {
        var target = $("#" + idprefix + count);
        target.attr("value", this);
        target.show();
        count++;
    });
    for (var i = count; i <= verbButtonCount; i++) {
        var target = $("#" + idprefix + i);
        target.hide();
    }
}
var _currentDiv = null;

function setCommandBarStyle(style) {
    var width = $("#txtCommand").width();
    $("#txtCommand").attr("style", style);
    $("#txtCommand").width(width);
}

var _divCount = 0;

function createNewDiv(alignment) {
    var classes = _outputSections.join(" ");
    _divCount++;
    $("<div/>", {
        id: "divOutputAlign" + _divCount,
        style: "text-align: " + alignment,
        "class": classes
    }).appendTo("#divOutput");
    setCurrentDiv("#divOutputAlign" + _divCount);
}

var _currentDiv = null;

function getCurrentDiv() {
    if (_currentDiv) return _currentDiv;

    var divId = $("#outputData").attr("data-currentdiv");
    if (divId) {
        _currentDiv = $(divId);
        return _currentDiv;
    }

    return null;
}

function setCurrentDiv(div) {
    _currentDiv = $(div);
    $("#outputData").attr("data-currentdiv", div);
}

var _divCount = -1;

function getDivCount() {
    return _divCount;
}

function setDivCount(count) {
    _divCount = count;
    $("#outputData").attr("data-divcount", _divCount);
}

function bindMenu(linkid, verbs, text, inline) {
    var verbsList = verbs.split("/");

    var options = [];
    $.each(verbsList, function (key, value) {
        options = options.concat({ title: value, action: { type: "fn", callback: "doMenuClick('" + value.toLowerCase() + " " + text.replace("'", "\\'") + "');" } });
    });

    $("#" + linkid).jjmenu("both", options, {}, { show: "fadeIn", speed: 100, xposition: "left", yposition: "auto", "orientation": "auto" });
}

function doMenuClick(command) {
    $("div[id^=jjmenu]").remove();
    sendCommand(command);
}

function updateObjectLinks(data) {
    $(".elementmenu").each(function (index, e) {
        var $e = $(e);
        var verbs = data[$e.data("elementid")];
        if (verbs) {
            $e.removeClass("disabled");
            $e.data("verbs", verbs);
            // also set attribute so verbs are persisted to savegame
            $e.attr("data-verbs", verbs);
        } else {
            $e.addClass("disabled");
        }
		var verbs = $(this).attr('data-verbs');
		var linkid = $(this).attr('id');
		var text = $(this).html();
		var inline = false;
		bindMenu(linkid, verbs, text, inline);
    });
}

function updateExitLinks(data) {
    $(".exitlink").each(function (index, e) {
        var $e = $(e);
        var exitid = $e.data("elementid");
        var available = $.inArray(exitid, data) > -1;
        if (available) {
            $e.removeClass("disabled");
        } else {
            $e.addClass("disabled");
        }
    });
}

function updateCommandLinks(data) {
    $(".commandlink").each(function (index, e) {
        var $e = $(e);
        var exitid = $e.data("elementid");
        var available = $.inArray(exitid, data) > -1;
        if (available) {
            $e.removeClass("disabled");
        } else {
            $e.addClass("disabled");
        }
    });
}

function disableAllCommandLinks() {
    $(".commandlink").each(function (index, e) {
        $(e).addClass("disabled");
		$(e).href('');
    });
}

function clearScreen() {
    allOutput = "";
    $("#divOutput").css("min-height", 0);
    $("#divOutput").html("");
    createNewDiv("left");
    beginningOfCurrentTurnScrollPosition = 0;
    setTimeout(function () {
        $("html,body").scrollTop(0);
    }, 100);
}
// Modified by KV to handle the scrollback feature
// Changing saveClearedText to false by default, due to performance issues.
var saveClearedText = false;
// Authors can change noScrollback to true to disable the scrollback functions.
var noScrollback = false;
var clearedOnce = false;
function clearScreen() {
    if (!saveClearedText) {
        $("#divOutput").css("min-height", 0);
        $("#divOutput").html("");
        createNewDiv("left");
        beginningOfCurrentTurnScrollPosition = 0;
        setTimeout(function () {
            $("html,body").scrollTop(0);
        }, 100);
    } else {
        $("#divOutput").append("<hr class='clearedAbove' />");
        if (!clearedOnce) {
            addText('<style>#divOutput > .clearedScreen { display: none; }</style>');
        }
        clearedOnce = true;
        $('#divOutput').children().addClass('clearedScreen');
        $('#divOutput').css('min-height', 0);
        createNewDiv('left');
        beginningOfCurrentTurnScrollPosition = 0;
        setTimeout(function () {
            $('html,body').scrollTop(0);
        }, 100);
    }
}

// Scrollback function added by KV

/**
 * The player can print the game's text or save as PDF.
 * This will include cleared text if saveClearedText is set to true (saveClearedText is false by default).
 * Setting noScrollback to true will disable this. (noScrollback is false by default)
 */
function printScrollback() {
  if (noScrollback) return;
  addText("<div id='scrollback-hider' style='display:none; color:black !important; background-color:white !important; font-family:sans-serif !important;background:white !important;text-align:left !important;'><div id='scrollbackdata'></div></div>");
  $('#scrollbackdata').html($('#divOutput').html());
  $("#scrollbackdata a").addClass("disabled");
  setTimeout(function () {
      $("#scrollbackdata a").addClass("disabled");
  }, 1);
  var iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  iframe.contentWindow.document.write($("#scrollbackdata").html());
  iframe.contentWindow.print();
  document.body.removeChild(iframe);
};

function keyPressCode(e) {
    var keynum
    if (window.event) {
        keynum = e.keyCode
    } else if (e.which) {
        keynum = e.which
    }
    return keynum;
}

function AddYouTube(id) {
    var embedHTML = "<object width=\"425\" height=\"344\"><param name=\"movie\" value=\"http://www.youtube.com/v/" + id + "\"></param><param name=\"allowFullScreen\" value=\"true\"></param><param name=\"allowscriptaccess\" value=\"always\"></param><embed src=\"http://www.youtube.com/v/" + id + "\" type=\"application/x-shockwave-flash\" allowscriptaccess=\"always\" allowfullscreen=\"true\" width=\"425\" height=\"344\"></embed></object>";
    addText(embedHTML);
}

function AddVimeo(id) {
    var embedHTML = "<object width=\"400\" height=\"225\"><param name=\"allowfullscreen\" value=\"true\" /><param name=\"allowscriptaccess\" value=\"always\" /><param name=\"movie\" value=\"http://vimeo.com/moogaloop.swf?clip_id=" + id + "&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00adef&amp;fullscreen=1&amp;autoplay=0&amp;loop=0\" /><embed src=\"http://vimeo.com/moogaloop.swf?clip_id=" + id + "&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00adef&amp;fullscreen=1&amp;autoplay=0&amp;loop=0\" type=\"application/x-shockwave-flash\" allowfullscreen=\"true\" allowscriptaccess=\"always\" width=\"400\" height=\"225\"></embed></object>";
    addText(embedHTML);
}

function SetMenuBackground(color) {
    var css = getCSSRule("div.jj_menu_item");
    if (css) {
        css.style.backgroundColor = color;
    }
}

function SetMenuForeground(color) {
    var css = getCSSRule("div.jj_menu_item");
    if (css) {
        css.style.color = color;
    }
}

function SetMenuHoverBackground(color) {
    var css = getCSSRule("div.jj_menu_item_hover");
    if (css) {
        css.style.backgroundColor = color;
    }
}

function SetMenuHoverForeground(color) {
    var css = getCSSRule("div.jj_menu_item_hover");
    if (css) {
        css.style.color = color;
    }
}

function SetMenuFontName(font) {
    var css = getCSSRule("div.jjmenu");
    if (css) {
        css.style.fontFamily = font;
    }
}

function SetMenuFontSize(size) {
    // disabled
    //var css = getCSSRule("div.jjmenu");
    //if (css) {
    //    css.style.fontSize = size;
    //}
}

function TurnOffHyperlinksUnderline() {
    var css = getCSSRule("a.cmdlink");
    if (css) {
        css.style.textDecoration = "none";
    }
}

var _outputSections = new Array();

function JsStartOutputSection(name) {
    if ($.inArray(name, _outputSections) == -1) {
        _outputSections.push(name);
        createNewDiv("left");
    }
}

function JsEndOutputSection(name) {
    var index = $.inArray(name, _outputSections);
    if (index != -1) {
        _outputSections.splice(index, 1);
        createNewDiv("left");
    }
}

function JsHideOutputSection(name) {
    EndOutputSection(name);
    $("." + name + " a").attr("onclick", "");
    setTimeout(function () {
        $("." + name).hide(250, function () { $(this).remove(); });
        $("#divOutput").animate({'min-height':0}, 250);
        scrollToEnd();
    }, 250);
}

/*
	Modified by KV 08-13-2024, copied directly from https://github.com/textadventures/quest/blob/63f159054e088a40b3b22ed1954392c4d3cb9974/WebPlayer/playercore.js#L1031C1-L1073C2
*/

function getCSSRule(ruleName, deleteFlag) {
    ruleName = ruleName.toLowerCase();
    if (document.styleSheets) {
        for (var i = 0; i < document.styleSheets.length; i++) {
            var styleSheet = document.styleSheets[i];
            var ii = 0;
            var cssRule = false;
            try {
                do {
                    if (styleSheet.cssRules) {
                        cssRule = styleSheet.cssRules[ii];
                    } else if (styleSheet.rules) {
                        cssRule = styleSheet.rules[ii];
                    }
                    if (cssRule) {
                        if (typeof cssRule.selectorText != "undefined") {
                            if (cssRule.selectorText.toLowerCase() == ruleName) {
                                if (deleteFlag == 'delete') {
                                    if (styleSheet.cssRules) {
                                        styleSheet.deleteRule(ii);
                                    } else {
                                        styleSheet.removeRule(ii);
                                    }
                                    return true;
                                } else {
                                    return cssRule;
                                }
                            }
                        }
                    }
                    ii++;
                } while (cssRule)
            } catch (e) {
                // Firefox throws a SecurityError if you try reading
                // a cross-domain stylesheet
                if (e.name !== "SecurityError") {
                    throw e;
                }
            }
        }
    }
    return false;
}

function killCSSRule(ruleName) {
    return getCSSRule(ruleName, 'delete');
}

function addCSSRule(ruleName) {
    if (document.styleSheets) {
        if (!getCSSRule(ruleName)) {
            if (document.styleSheets[0].addRule) {
                document.styleSheets[0].addRule(ruleName, null, 0);
            } else {
                document.styleSheets[0].insertRule(ruleName + ' { }', 0);
            }
        }
    }
    return getCSSRule(ruleName);
}

function uiDoRestart() {
    if (localStorage) {
        localStorage.clear();
    }
    $("input#txtCommand").val("");
    window.location.reload();
}

function reportError(errorMessage) {
    alert(errorMessage);
    console.log(errorMessage);
}

// WORLDMODEL ===================================================================================================================

var webPlayer = true;
var tmrTick = null;
var awaitingCallback = false;
var gameRunning = true;
var gameActive = true;

function worldmodelInitialise() {
    resolveObjectReferences();
    GetObject("game").timeelapsed = 0;
    for (var idx in allTimers) {
        var timer = allTimers[idx];
        if (timer.enabled) {
            timer.trigger = timer.interval;
        }
    }
    setObjectChildAttributes();
    if (typeof InitInterface == 'function') {
        InitInterface();
    }
    updateLists();
    tmrTick = setInterval(function () {
        timerTick();
    }, 1000);
}

function worldModelBeginGame() {
    StartGame();
    TryRunOnReadyScripts();
    updateLists();
    $("input#txtCommand").focus();
}

function resolveObjectReferences() {
    for (var item in objectReferences) {
        var objData = objectReferences[item];
        window[objData[0]][objData[1]] = window[objData[2]];
    }
    for (var item in objectListReferences) {
        var objData = objectListReferences[item];
        var parent = window[objData[0]];
        if (parent == undefined) { parent = GetObject("game"); }
        var attribute = objData[1].replace(/ /g, "___SPACE___");
        var itemValue = objData[2];
        if (typeof parent[attribute] == "undefined") {
            parent[attribute] = new Array();
        }
        parent[attribute].push(window[itemValue]);
    }
    for (var item in objectDictionaryReferences) {
        var objData = objectDictionaryReferences[item];
        if (parent == undefined) { parent = GetObject("game"); }
        var parent = window[objData[0]];
        var attribute = objData[1].replace(/ /g, "___SPACE___");
        var itemKey = objData[2];
        var itemValue = objData[3];
        if (typeof parent[attribute] == "undefined") {
            parent[attribute] = new Object();
        }
        parent[attribute][itemKey] = window[itemValue];
    }
}

function setObjectChildAttributes() {
    for (var idx in allObjects) {
        var obj = allObjects[idx];
        if (obj.parent) {
            addChildObject(obj.parent, obj);
        }
    }
}

function addChildObject(parent, child) {
    if (!parent["_children"]) {
        parent["_children"] = new Array();
    }
    parent["_children"].push(child);
}

function updateLists() {
    setTimeout(function () {
        updateListsInternal();
    }, 1000);
}

function updateListsInternal() {
    updateObjectsLists();
    updateExitsList();
    if (typeof UpdateStatusAttributes == "function") {
        UpdateStatusAttributes();
    }
}

function updateObjectsLists() {
    updateObjectsList("GetPlacesObjectsList", "placesobjects");
    updateObjectsList("ScopeInventory", "inventory");
}

/* function updateObjectsList(scope, listName) {
    var listItems = window[scope]();
    if (scope == "GetPlacesObjectsList") {
        listItems = listItems.concat(ScopeExits());
    }
    var listData = new Array();
    for (var item in listItems) {
        var verbs = (listName == "inventory") ? listItems[item].inventoryverbs : listItems[item].displayverbs;
        if (verbs != undefined) {
            var verbsList = verbs.join("/");
        }
        else {
            var verbsList = "";
        }
        listData.push(GetDisplayAlias(listItems[item]) + ":" + verbsList);
    }
    updateList(listName, listData);
} */

function updateObjectsList(scope, listName) {
    var listItems = window[scope]();
    if (scope == "GetPlacesObjectsList") {
        listItems = listItems.concat(ScopeExits());
    }
    var listData = new Array();
    for (var item in listItems) {
        var verbs = GetDisplayVerbs(listItems[item]);
        if (verbs != undefined) {
            var verbsList = verbs.join("/");
        }
        else {
            var verbsList = "";
        }
        listData.push(GetDisplayAlias(listItems[item]) + ":" + verbsList);
    }
    updateList(listName, listData);
}

function updateExitsList() {
    var listItems = ScopeExits();
    var listData = new Array();
    for (var item in listItems) {
        listData.push(listItems[item].alias);
    }
    updateCompass(listData);
}

function attributeChanged(object, attribute, runscript) {
    // TO DO: "Meta" field SortIndex - changed when object moves to a new parent, so it appears at the end of the list
    // of children.
    markAttributeModified(object, attribute);
    if (runscript) {
        var changedScript = "changed" + attribute;
        if (typeof object[changedScript] == "function") {
            object[changedScript]();
        }
    }
}

var nextObjectId = 0;

function getUniqueId() {
    nextObjectId++;
    return "dynid" + nextObjectId;
}

var transactions = new Array();
var currentTransaction;

function preAttributeChange(object, attribute, newValue) {
    if (currentTransaction != undefined) {
        // store the old value on the undo list
        var oldValue = object[attribute];
        var undoFunction;
        if (attribute == "parent") {
            undoFunction = function () {
                newValue = object[attribute];
                object[attribute] = oldValue;
                objectMoved(object, newValue, oldValue);
            };
        }
        else {
            undoFunction = function () {
                object[attribute] = oldValue;
            };
        }

        currentTransaction.undolist.push(undoFunction);
    }

    var type = TypeOf(newValue);

    // if value requires cloning first then return a clone
    if (type == "stringdictionary" || type == "objectdictionary" || type == "scriptdictionary") {
        var result = new Object();
        for (key in newValue) {
            result[key] = newValue[key];
        }
        return result;
    }
    else if (type == "objectlist" || type == "stringlist") {
        var result = new Array();
        for (idx in newValue) {
            result.push(newValue[idx]);
        }
        return result;
    }

    return newValue;
}

function markAttributeModified(object, attribute) {
    if (object["__modified"] == undefined) {
        object["__modified"] = new Array();
    }
    if (object["__modified"].indexOf(attribute) == -1) {
        object["__modified"].push(attribute);
    }
}

var thisTurnModifiedItems = new Array();

function markModified(item) {
    if (thisTurnModifiedItems.indexOf(item) == -1) {
        thisTurnModifiedItems.push(item);
    }
}

// Javascript magic to support function overloading
// from http://ejohn.org/blog/javascript-method-overloading/
// addMethod - By John Resig (MIT Licensed)

function addMethod(object, name, fn) {
    var old = object[name];
    object[name] = function () {
        if (fn.length == arguments.length)
            return fn.apply(this, arguments);
        else if (typeof old == 'function')
            return old.apply(this, arguments);
    };
}

// Script commands

var objectTag = new XRegExp("\<object (id='(.*?)' )?verbs='(?<verbs>.*?)'\>(?<text>.*?)\<\/object\>");
var colorTag = /\<color color="(.*?)"\>(.*?)\<\/color\>/;
var commandTag = /\<command input="(.*?)"\>(.*?)\<\/command\>/;
var alignTag = /\<align align="(.*?)"\>(.*?)\<\/align\>/;
var fontTag = /\<font size="(.*?)"\>(.*?)\<\/font\>/;
var currentFont = "";
var currentFontSize = "";
var currentForeground = "";
var currentLinkForeground = "";
var nextID = 1;
var allOutput = "";

function msg(text) {
    //%%MIN V540
    OutputText(text);
    //%%END MIN V540

    //%%MAX V530
    if (allOutput.length > 0) allOutput += "<br/>";
    allOutput += text;
    var menuBindings = new Array();
    var cmdBindings = new Array();

    var count = 0;

    XRegExp.iterate(text, objectTag, function (matches, index, str) {
        count++;
    });

    var outputCount = 100 - count;

    while (objectTag.test(text)) {
        outputCount++;
        var matches = objectTag.exec(text);
        var style = "";
        if (currentLinkForeground.length > 0) {
            style = "style=\"color:" + currentLinkForeground + "\" ";
        }
        var linkToAdd;
        if (outputCount > 0) {
            var linkID = "verbLink" + nextID;
            linkToAdd = "<a id=\"" + linkID + "\" " + style + "class=\"cmdlink\">" + matches.text + "</a>";
            menuBindings.push([linkID, matches.verbs, matches.text]);
            nextID++;
        }
        else {
            linkToAdd = matches[3];
        }
        text = text.substring(0, matches.index) + linkToAdd + text.substring(matches.index + matches[0].length);
    }

    while (colorTag.test(text)) {
        var matches = colorTag.exec(text);
        var textToAdd = "<span style=\"color:" + matches[1] + "\">" + matches[2] + "</span>";
        text = text.substring(0, matches.index) + textToAdd + text.substring(matches.index + matches[0].length);
    }

    while (alignTag.test(text)) {
        var matches = alignTag.exec(text);
        var textToAdd = "<div style=\"text-align:" + matches[1] + "\">" + matches[2] + "</div>";
        text = text.substring(0, matches.index) + textToAdd + text.substring(matches.index + matches[0].length);
    }

    while (fontTag.test(text)) {
        var matches = fontTag.exec(text);
        var textToAdd = "<span style=\"font-size:" + matches[1] + "pt\">" + matches[2] + "</span>";
        text = text.substring(0, matches.index) + textToAdd + text.substring(matches.index + matches[0].length);
    }

    while (commandTag.test(text)) {
        var matches = commandTag.exec(text);
        var linkID = "cmdLink" + nextID;
        var style = "";
        if (currentLinkForeground.length > 0) {
            style = "style=\"color:" + currentLinkForeground + "\" ";
        }
        nextID++;
        var linkToAdd = "<a id=\"" + linkID + "\" " + style + "class=\"cmdlink\">" + matches[2] + "</a>";
        text = text.substring(0, matches.index) + linkToAdd + text.substring(matches.index + matches[0].length);
        (function(m) {
            cmdBindings.push([linkID, function() {
                sendCommand(m);
            }]);
        })(matches[1]);
    }

    var style = "";
    if (currentFont.length > 0) {
        style += "font-family:" + currentFont + ";";
    }
    if (currentFontSize.length > 0) {
        style += "font-size:" + currentFontSize + "pt;";
    }
    if (currentForeground.length > 0) {
        style += "color:" + currentForeground + ";";
    }
    if (style.length > 0) {
        text = "<span style=\"" + style + "\">" + text + "</span>";
    }

    addText(text + "<br/>");

    for (var menuBinding in menuBindings) {
        var thisBinding = menuBindings[menuBinding];
        bindMenu(thisBinding[0], thisBinding[1], thisBinding[2], true);
    }

    for (var cmdBinding in cmdBindings) {
        var thisBinding = cmdBindings[cmdBinding];
        $("#" + thisBinding[0]).click(thisBinding[1]);
    }
    //%%END MAX V530
    scrollToEnd();
}

function listadd(list, item) {
    if (currentTransaction != undefined) {
        var undoFunction = function () {
            list.splice(list.length - 1, 1);
        }
        currentTransaction.undolist.push(undoFunction);
    }
    list.push(item);
    markModified(list);
}

function listremove(list, item) {
    if (!Array.isArray(list)) { console.log ("List does not exist."); return; }; /* this line altered by KV 20240803 */
    var index = list.indexOf(item);
    if (index != -1) {
        if (currentTransaction != undefined) {
            var undoFunction = function () {
                listadd(list, item);
            }
            currentTransaction.undolist.push(undoFunction);
        }

        list.splice(index, 1);
    }
    markModified(list);
}

function dictionaryadd(dictionary, key, item) {
    if (currentTransaction != undefined) {
        var oldValue = dictionary[key];
        if (oldValue != undefined) {
            var undoFunction = function () {
                dictionary[key] = oldValue;
            }
        }
        else {
            var undoFunction = function () {
                delete dictionary[key];
            }
        }
        currentTransaction.undolist.push(undoFunction);
    }
    dictionary[key] = item;
    markModified(dictionary);
}

function dictionaryremove(dictionary, key) {
    if (currentTransaction != undefined) {
        var oldValue = dictionary[key];
        var undoFunction = function () {
            dictionary[key] = oldValue;
        }
        currentTransaction.undolist.push(undoFunction);
    }
    delete dictionary[key];
    markModified(dictionary);
}



function request(requestType, data) {
    switch (requestType) {
        case "UpdateLocation":
            updateLocation(data);
            break;
        case "SetStatus":
            updateStatus(data);
            break;
        case "SetInterfaceString":
            var splitString = data.split("=");
            var element = splitString[0];
            var string = splitString[1];
            setInterfaceString(element, string);
            break;
        case "SetCompassDirections":
            setCompassDirections(data.split(";"));
            break;
        case "Show":
            uiShow(requestShowHide_GetElement(data));
            break;
        case "Hide":
            uiHide(requestShowHide_GetElement(data));
            break;
        case "Foreground":
            currentForeground = data;
            break;
        case "Background":
            setBackground(data);
            break;
        case "LinkForeground":
            currentLinkForeground = data;
            break;
        case "FontName":
            currentFont = data;
            break;
        case "FontSize":
            currentFontSize = data;
            break;
        case "ClearScreen":
            clearScreen();
            break;
        case "SetPanelContents":
            setPanelContents(data);
            break;
        case "Log":
		    console.log(data);
            break;
        case "Speak":
            break;
        case "RestartGame":
            uiDoRestart();
            break;
        case "RequestSave":
            msg("This game automatically saves after each successful turn.");
            break;
        default:
            throw "Request not supported: " + requestType + "; " + data;
    }
}


function requestShowHide_GetElement(element) {
    switch (element) {
        case "Panes":
            return "#gamePanes";
        case "Location":
            return "#location";
        case "Command":
            return "#divCommand";
        default:
            return "";
    }
}

function setPanelHeight() {
    setTimeout(function () {
        var height = $("#gamePanel").height();
        if ($("#gamePanel").html() == "") {
            // workaround for IE weirdness where an empty div has height
            height = 0;
            $("#gamePanel").hide();
        }
        else {
            $("#gamePanel").show();
        }
        $("#gamePanelSpacer").height(height);
        scrollToEnd();
    }, 100);
}

function setPanelContents(html) {
    $("#gamePanel").html(html);
    setPanelHeight();
}

function starttransaction(command) {
    var previousTransaction = currentTransaction;
    currentTransaction = new Object();
    transactions.push(currentTransaction);
    currentTransaction.undolist = new Array();
    currentTransaction.previous = previousTransaction;
    currentTransaction.command = command;
}

function undo() {
    if (currentTransaction) {
        var transactionToUndo = currentTransaction;
        if (dynamicTemplates["UndoTurn"]) {
            msg(overloadedFunctions.DynamicTemplate("UndoTurn", transactionToUndo.command));
        }
        else {
            msg("Undo: " + transactionToUndo.command);
        }
        currentTransaction = undefined;
        transactionToUndo.undolist.reverse();
        for (idx in transactionToUndo.undolist) {
            var fn = transactionToUndo.undolist[idx];
            fn();
        }
        currentTransaction = transactionToUndo.previous;
    }
    else {
        if (templates["NothingToUndo"]) {
            msg(templates["NothingToUndo"]);
        }
        else {
            msg("Nothing to undo");
        }
    }
}

function runscriptattribute2(object, attribute) {
    var fn = GetAttribute(object, attribute);
    fn.call(object, attribute);
}

/*
function runscriptattribute3(object, attribute, parameters) {
	if (attribute === "scopebackdrop"){
		game.scopebackdropitems = parameters.items;
	}
    var fn = GetAttribute(object, attribute);
    fn.call(object, parameters);
}
*/

function runscriptattribute3(object, attribute, parameters) { /* scopebackdrop fix */
	if (attribute === "scopebackdrop"){
		game.scopebackdropitems = parameters.items;
	}
	//clog ("runscriptattribute3 parameters:");
	//clog (parameters);
    var fn = GetAttribute(object, attribute);
    fn.call(object, parameters);
}

/*
function invoke(script, parameters) {
    if (parameters) {
        if (parameters["this"]) {
            script.apply(parameters["this"], [parameters]);
        } else if (parameters["section"]) {
            script.apply(null, [parameters["section"], parameters["data"]]);
        } else if (parameters["result"]) {
            script.apply(null, [parameters["result"]], parameters);
        } else {
            console.log("invoke is blindly sending 'parameters'");
            console.log(parameters);
            script.apply(null, parameters);
        }
    } else {
        script();
    }
}
*/

function invoke(script, parameters) { 
/* Fix for Quest 5.8.0 Build 5.8.7753.35198 */
	if (parameters) {
    
    if (parameters["this"]) {
        script.apply(parameters["this"], [parameters]);
        
    /*} else if (parameters["section"]) {
        var sectionVar = parameters["section"];
        var dataVar = parameters["data"];
        script.apply(section = sectionVar, data=dataVar);*/
        
    } else if (parameters["result"]) {
        script.apply(null, [parameters["result"]], parameters);
        
    } else {
        function findParams(key){
          window[key] = parameters[key];
        }
        Object.keys(parameters).forEach(findParams);
        script.apply(null, parameters);
    }
  } else {
      script();
  }
}

function error(message) {
    throw message;
}

function set(object, attribute, value, runscript) {
    if (typeof object === 'undefined'){
      console.error("[game.js]: [set()]: 'object' is undefined. Exiting script!");
      return;
    }
    if (runscript === undefined) {
        runscript = true;
    }
    attribute = attribute.replace(/ /g, "___SPACE___");
    var changed = (object[attribute] != value);

    value = preAttributeChange(object, attribute, value);

    if (attribute == "parent") {
        var oldParent = object[attribute];
    }

    object[attribute] = value;

    if (changed) {
        if (attribute == "parent") {
            objectMoved(object, oldParent, value);
        }

        attributeChanged(object, attribute, runscript);
    }
}

// modded to run onexit scripts
function objectMoved(object, oldParent, newParent) {
    if (object.elementtype == "object" && object.type == "object") {
        if (oldParent) {
            var idx = oldParent["_children"].indexOf(object);
            if (idx == -1) {
                throw "Object wasn't in room!";
            }
            oldParent["_children"].splice(idx, 1);
            if (object == GetObject("game").pov) {
                if (HasAttribute(oldParent, "onexit")) {
                    runscriptattribute2(oldParent, "onexit");
                    //console.log("RUNNING");
                }
            }
        }
        if (newParent) {
            if (!newParent["_children"]) {
                newParent["_children"] = new Array();
            }
            newParent["_children"].push(object);
        }
    }
}

var menuOptions;
var menuCallback;
var finishTurnAfterSelection;

function showmenu_async(title, options, allowCancel, callback) {
    showmenu_async_internal(title, options, allowCancel, callback, true);
}

function showmenu_async_internal(title, options, allowCancel, callback, finishTurn) {
    menuOptions = options;
    menuCallback = callback;
    awaitingCallback = true;
    finishTurnAfterSelection = finishTurn;

    if (runningWalkthrough) {
        var step = currentWalkthroughSteps.splice(0, 1);
        var response = step[0];
        if (response.substring(0, 5) == "menu:") {
            var selection = response.substring(5);
            var selectionKey = "";
            for (var option in options) {
                msg(options[option]);
                if (options[option] == selection) {
                    selectionKey = option;
                }
            }
            if (selectionKey.length == 0) {
                msg("Error running walkthrough - menu response was not present in menu");
            }
            else {
                postStep = function () {
                    msg(" - " + selection);
                    SetMenuSelection(selectionKey);
                };
            }
        }
        else {
            msg("Error running walkthrough - expected menu response");
        }
    }
    else {
        showMenu(title, options, allowCancel);
    }
}

function ask(question, callback) {
    if (runningWalkthrough) {
        var step = currentWalkthroughSteps.splice(0, 1);
        var response = step[0];
        if (response.substring(0, 7) == "answer:") {
            awaitingCallback = true;
            postStep = function () {
                awaitingCallback = false;
                callback(response.substring(7) == "yes");
                TryFinishTurn();
            };
        }
        else {
            msg("Error running walkthrough - expected ask response");
        }
    }
    else {
        var result = confirm(question);
        callback(result);
        TryFinishTurn();
    }
}

var waitCallback;

function wait_async(callback) {
    waitCallback = callback;
    awaitingCallback = true;
    beginWait();
}

var getinputCallback;
var awaitingInputCallback = false;

function getinput_async(callback) {
    getinputCallback = callback;
    awaitingCallback = true;
    awaitingInputCallback = true;
}

function create(name) {
    createInternal(name, allObjects, GetObject("defaultobject"), "object");
}
function create_withtype(name, type) {
    createInternal(name, allObjects, GetObject("defaultobject"), "object");
    addTypeToObject(GetObject(name), GetObject(type))
}
function ShallowClone(name) {
    // The 'name' variable is actually an object.
    if (!name) return false;
    //console.log(name);
    // Declare this as false, assuming the object has no child objects. 
    var hasKids = false;
    // Declare this for any children while cloning
    var protos = [];
    // Declare this for any clones of children
    var newkids = [];
    // QuestJS has a '_children' attribute which points to the object's child objects
    if (HasAttribute(name, "_children")) {
        //console.log(name.name + " has child objects"); // Let me know what's going on!
        if (GetDirectChildren(name).length > 0) {
            hasKids = true;
            // There are children, so point this array to that attribute
            protos = name["_children"];
            // Back it up again, just to be safe
            //name.kidsBak = name["_children"];
            // Clear it out, to avoid recursion errors while setting the clone's attributes
            name["_children"] = [];
            // Move children to game object while cloning
            //protos.forEach(function (o) {
                //MoveObject(o, GetObject("game"));
            //});
        }
    }
    //console.log("STILL GOING"); // This is just to make sure something hasn't gone wrong!
    //console.log(name.name);
    // This is how QuestJS avoids duplicate object names.
    var clonename = GetUniqueElementName(name.name).replace(/dynid/, "");
    // And we finally create a blank object
    create(clonename);
    // Just like Quest, we must declare a variable which points to the actual object
    var newObject = GetObject(clonename);
    //console.log(newObject);  // Just to make sure things are in order
    // Get all the attribute names of the prototype
    var atts = GetAttributeNames(name);
    for (var att in name) {
        //console.log(att);  // Just to see what is going on!
        // Make sure the attribute exists
        if (name != undefined && att != undefined && name[att] != undefined) {
            // Make sure the attribute isn't either of the names
            if (att != 'name' && att != '_js_name') {
                //console.log(name[att]);  // Just to see what is going on!
                // Copy the attribute from the prototype to the clone
                set(newObject, att, name[att]);
            }
        }
    }
    //console.log(newObject.name+" is set up!");  // Just to see what is going on!
    if (hasKids) {
        // Move children back to the prototype
        protos.forEach(function (o) {
            MoveObject(o, name);
        });
        // We had child objects in the prototype, so we need to clone them and move them into the main clone
        for (var kid in protos) {
            var nclone = CloneObjectAndMove(protos[kid], newObject);
            //console.log(nclone);
        }
        // Set the prototype's attribute back to it's original state
        //name["_children"] = name.kidsBak;
        // Delete the backup attribute
        //name.kidsBak = null;
    }
    return newObject;
}


function ObjectListSort(list) {
    return list.sort();
}

function IsInt(data) {
    return (/^\d+$/.test(data));
}

function Chr(data) {
    return String.fromCharCode(data);
}
function Asc(data) {
    return data.charCodeAt(0);
}

function createexit(name, from, to) {
    var newExit = createInternal(getUniqueId(), allExits, GetObject("defaultexit"), "exit");
    set(newExit, "alias", name);
    set(newExit, "parent", from);
    set(newExit, "to", to);
    return newExit;
}

function createexit_withtype(name, from, to, type) {
    var newExit = createexit(name, from, to);
    if (type) {
        addTypeToObject(newExit, type);
    }
}

function createtimer(name) {
    createdObjects.push(name + ";;timer");

    if (currentTransaction != undefined) {
        var undoFunction = function () {
            destroy(name);
        }
        currentTransaction.undolist.push(undoFunction);
    }

    newObject = new Object();
    // TODO: Add to object map
    window["object_" + name] = newObject;
    allTimers.push(newObject);
    newObject.elementtype = "timer";
    newObject.name = name;
    newObject["_js_name"] = name;
    return newObject;
}

function createturnscript(name) {
    return createInternal(name, allTurnScripts, "defaultturnscript", "turnscript");
}

var createdObjects = new Array();

function createInternal(name, array, defaultTypeObject, objectType) {

    createdObjects.push(name + ";" + defaultTypeObject.name + ";" + objectType);

    if (currentTransaction != undefined) {
        var undoFunction = function () {
            destroy(name);
        }
        currentTransaction.undolist.push(undoFunction);
    }

    newObject = new Object();
    window[name] = newObject;
    objectsNameMap[name] = newObject;
    elementsNameMap[name] = newObject;
    array.push(newObject);
    newObject.elementtype = "object";
    newObject.name = name;
    newObject["_js_name"] = name;
    newObject.type = objectType;
    addTypeToObject_NoLog(newObject, defaultTypeObject);
    return newObject;
}

var addedTypes = new Array();

function addTypeToObject(object, type) {
    addedTypes.push(object.name + ";" + type.name);
    addTypeToObject_NoLog(object, type);
}

function addTypeToObject_NoLog(object, type) {
    if (type != undefined) {
        for (var attribute in type) {
            if (object[attribute] == undefined) {
                object[attribute] = type[attribute];
            }
        }
    }
}

var destroyedObjects = new Array();

function destroy(name) {
    MoveObject(GetObject(name), GetObject("game"));
    destroyedObjects.push(name);
    destroyObject(GetObject(name));
}

function destroyObject(object) {
    var childObjects = new Array();
    for (var idx in allObjects) {
        var thisObject = allObjects[idx];
        if (thisObject.parent == object) {
            childObjects.push(thisObject);
        }
    }
    for (var childObject in childObjects) {
        destroyObject(childObjects[childObject]);
    }
    destroyObject_removeFromArray(object, allObjects);
    destroyObject_removeFromArray(object, allExits);
    destroyObject_removeFromArray(object, allCommands);
    destroyObject_removeFromArray(object, allTurnScripts);

    if (currentTransaction != undefined) {
        var undoFunction = function () {
            delete object["__destroyed"];
        }
        currentTransaction.undolist.push(undoFunction);
    }
    object["__destroyed"] = true;
}

function destroyObject_removeFromArray(object, array) {
    var removeIdx = $.inArray(object, array);
    if (removeIdx != -1) {
        if (currentTransaction != undefined) {
            var undoFunction = function () {
                array.push(object);
            }
            currentTransaction.undolist.push(undoFunction);
        }
        array.splice(removeIdx, 1);
    }
}

function insertHtml(filename) {
    addText(embeddedHtml[filename]);
}

function picture(filename) {
    msg("<img src=\"" + filename + "\" onload=\"scrollToEnd();\" /><br />");
}

function playsound(file, wait, loop) {
    // TO DO: support wav format
    playMp3(file, wait, loop);
}

function stopsound() {
    stopAudio();
}

function pauseEvent() {
    gameActive = false;
}

function resumeEvent() {
    gameActive = true;
}

function timerTick() {
    if (!gameRunning) return;
    if (!gameActive) return;
    var tickCount = GetObject("game").timeelapsed + 1;
    set(GetObject("game"), "timeelapsed", tickCount);
    var scriptRan = false;
    for (var idx in allTimers) {
        var timer = allTimers[idx];
        if (timer.enabled) {
            if (tickCount >= timer.trigger) {
                set(timer, "trigger", timer.trigger + timer.interval);
                timer.script();
                scriptRan = true;
            }
        }
    }
    if (scriptRan) {
        saveGame();
        updateLists();
    }
}

function finish() {
    gameRunning = false;
    if (localStorage) {
        localStorage.clear();
    }
    $("#divCommand").hide();
}

var onReadyCallback = null;

function on_ready(callback) {
    if (!awaitingCallback) {
        callback();
    }
    else {
        onReadyCallback = callback;
    }
}

function getElement(name) {
    return elementsNameMap[name];
}

function setGameWidth(size) {
    $("#gameContent").width(size+"px");
}

function setGamePadding() {
}

function hideBorder() {
}

// Functions

function NewObjectList() {
    return new Array();
}

function NewStringList() {
    return new Array();
}

function NewDictionary() {
    return new Object();
}

function NewObjectDictionary() {
    return new Object();
}

function NewStringDictionary() {
    return new Object();
}

function ToString(value) {
    return value.toString();
}

function ToInt(value) {
    return parseInt(value);
}

function ToDouble(value) {
    return parseFloat(value);
}

function Join(array, separator) {
    return array.join(separator);
}

function Split(input, delimiter) {
    return input.split(delimiter);
}

function Trim(input) {
    return $.trim(input);
}

function LengthOf(input) {
    if (input == null) return 0;
    return input.length;
}

function StartsWith(input, text) {
    return input.indexOf(text) == 0;
}

function EndsWith(input, text) {
    return input.endsWith(text);
}


function LCase(text) {
    return text.toLowerCase();
}

function UCase(text) {
    return text.toUpperCase();
}

function CapFirst(text) {
    return text.substring(0, 1).toUpperCase() + text.substring(1);
}

function Left(text, count) {
    return text.substring(0, count);
}

function Right(text, count) {
    return text.substring(text.length - count - 1);
}

function Mid(text, start, count) {
    return text.substr(start - 1, count);
}

function Instr(p1, p2, p3) {
    var input, search;
    if (p3 === undefined) {
        input = p1;
        search = p2;
        return input.indexOf(search) + 1;
    } else {
        var start = p1;
        input = p2;
        search = p3;
        return input.indexOf(search, start - 1) + 1;
    }
}

function Replace(input, text, newText) {
    return input.split(text).join(newText);
}

function LTrim(txt){
  return txt.trimLeft();
};

function RTrim(txt){
  return txt.trimRight();
};

function startsWith(txt,s){
  return StartsWith(txt,s);
}

Date.prototype.today = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

let CurrentDate = function(){
  return new Date().today();
};

let CurrentUtcDate = ()=>{
  var now = new Date();
  var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  return utc.today();
};

let CurrentTime = function(){
  return new Date().timeNow();
};

let CurrentUtcTime = ()=>{
  var now = new Date();
  var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  return utc.timeNow();
};


var regexCache = new Object();

function getRegex(regexString, cacheID) {
    var result = regexCache[cacheID];
    if (result) {
        return result;
    }
    result = new XRegExp(regexString, "i");
    regexCache[cacheID] = result;
    return result;
}

function IsRegexMatch(regexString, input, cacheID) {
    var regex = getRegex(regexString, cacheID);
    return regex.test(input);
}

function GetMatchStrength(regexString, input, cacheID) {
    var regex = getRegex(regexString, cacheID);
    var lengthOfTextMatchedByGroups = 0;
    var matches = regex.exec(input);
    var namedGroups = GetRegexNamedGroups(matches);
    for (var groupIdx in namedGroups) {
        if (matches[namedGroups[groupIdx]] != undefined) {
            lengthOfTextMatchedByGroups += matches[namedGroups[groupIdx]].length;
        }
    }
    return input.length - lengthOfTextMatchedByGroups;
}

function Populate(regexString, input, cacheID) {
    var regex = getRegex(regexString, cacheID);
    var matches = regex.exec(input);
    var result = new Object();
    var namedGroups = GetRegexNamedGroups(matches);
    for (var groupIdx in namedGroups) {
        if (matches[namedGroups[groupIdx]] != undefined) {
            var varName = namedGroups[groupIdx];
            var mapIndex = varName.indexOf("_map_");
            if (mapIndex != -1) {
                varName = varName.substring(mapIndex + 5);
            }
            result[varName] = matches[namedGroups[groupIdx]];
        }
    }
    return result;
}

function GetRegexNamedGroups(matches) {
    var result = new Array();
    //console.log("Matches:", matches);

    // Handle the case when matches is an array
    if (Array.isArray(matches)) {
        for (var i = 0; i < matches.length; i++) {
            var prop = matches[i];
            if (prop !== undefined) {
                //console.log("Checking array element:", prop);
                if (StartsWith(prop, "object") || 
                    prop.indexOf("_map_object") !== -1 || 
                    StartsWith(prop, "text") || 
                    prop.indexOf("_map_text") !== -1 || 
                    StartsWith(prop, "exit") || 
                    prop.indexOf("_map_exit") !== -1 || 
                    StartsWith(prop, "before") || 
                    StartsWith(prop, "padding") || 
                    StartsWith(prop, "sep") || 
                    StartsWith(prop, "places") || 
                    StartsWith(prop, "after")) {
                    result.push(prop);
                    //console.log("Array element added:", prop);
                }
            } else {
                //console.log("Array element is undefined.");
            }
        }
    }

    // Handle the case when matches is an object
    if (typeof matches === 'object') {
        for (var prop in matches) {
            if (matches.hasOwnProperty(prop) && matches[prop] !== undefined) {
                //console.log("Checking object property:", prop);
                if (StartsWith(prop, "object") || 
                    prop.indexOf("_map_object") !== -1 || 
                    StartsWith(prop, "text") || 
                    prop.indexOf("_map_text") !== -1 || 
                    StartsWith(prop, "exit") || 
                    prop.indexOf("_map_exit") !== -1 || 
                    StartsWith(prop, "before") || 
                    StartsWith(prop, "padding") || 
                    StartsWith(prop, "sep") || 
                    StartsWith(prop, "places") || 
                    StartsWith(prop, "after")) {
                    result.push(prop);
                    //console.log("Object property added:", prop);
                }
            } else {
                //console.log("Object property is undefined or not owned.");
            }
        }
    }

    //console.log("Result:", result);
    return result;
}

/*function GetRegexNamedGroups(matches) {
    var found = false;
    var result = new Array();
    for (var prop in matches) {
        if (matches.hasOwnProperty(prop)) {
            if (StartsWith(prop, "before") || StartsWith(prop, "padding") || StartsWith(prop, "sep") || StartsWith(prop, "places") || StartsWith(prop, "after") || prop.indexOf("_map_object") != -1 || StartsWith(prop, "text") || prop.indexOf("_map_text") != -1 || StartsWith(prop, "exit") || prop.indexOf("_map_exit") != -1) {
                found = true;
                result.push(prop);
            }
        }
    }
    return result;
}*/

function GetAttribute(object, attribute) {
    // Check if the object has the attribute
    if (object && object.hasOwnProperty(attribute)) {
        return object[attribute];
    }
    // If attribute is not found, return undefined or handle it as needed
    return undefined;
}

function GetBoolean(element, attribute) {
    if (HasBoolean(element, attribute)) {
        return GetAttribute(element, attribute);
    }
    return false;
}

function GetInt(element, attribute) {
    if (HasInt(element, attribute)) {
        return GetAttribute(element, attribute);
    }
    return 0;
}

function GetObject(element) {
    result = objectsNameMap[element];
    if (result == undefined) return result;
    if (result["__destroyed"]) return null;
    return result;
}

function GetTimer(name) {
    return GetObject(name);
}

function GetString(element, attribute) {
    if (HasString(element, attribute)) {
        return GetAttribute(element, attribute);
    }
    return null;
}

function HasAttribute(element, attribute) {
    return (GetAttribute(element, attribute) != undefined);
}

function HasBoolean(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "boolean");
}

function HasInt(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "int");
}

function HasObject(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "object");
}

function HasString(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "string");
}

function HasScript(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "script");
}

function HasDelegateImplementation(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "script");
}

function GetAttributeNames(element, includeInheritedAttributes) {
    var result = [];
    for (var name in element) {
        result.push(name);
    }
    return result;
}

function AllObjects() {
    return allObjects;
}

function AllExits() {
    return allExits;
}

function AllCommands() {
    return allCommands;
}

function AllTurnScripts() {
    return allTurnScripts;
}

function TypeOf(value) {
    return overloadedFunctions.TypeOf(value);
}

function OverloadedFunctions() {
    addMethod(this, "TypeOf", function (value) {
        var type = typeof value;
        if (type == "function") return "script";
        if (type == "object") {
            if (value == null) return "null";
            if (Object.prototype.toString.call(value) === '[object Array]') {
                // could be an objectlist or stringlist
                var allObjects = true;
                var allStrings = true;

                for (var index in value) {
                    var item = value[index];
                    if (typeof item != "string") allStrings = false;
                    if (typeof item != "object") allObjects = false;
                    if (!allStrings && !allObjects) break;
                }

                if (allStrings) return "stringlist";
                if (allObjects) return "objectlist";
                return "unknown";
            }
            else {
                // could be an object, stringdictionary, objectdictionary or scriptdictionary
                var allObjects = true;
                var allStrings = true;
                var allScripts = true;

                for (var key in value) {
                    var item = value[key];
                    if (typeof item != "string") allStrings = false;
                    if (TypeOf(item) != "object") allObjects = false;
                    if (typeof item != "function") allScripts = false;
                    if (!allStrings && !allObjects && !allScripts) break;
                }

                if (allStrings) {
                    return "stringdictionary";
                }
                if (allObjects) {
                    return "objectdictionary";
                }
                if (allScripts) {
                    return "scriptdictionary";
                }
                return "object";
            }
        }
        if (type == "boolean") return "boolean";
        if (type == "string") return "string";
        if (type == "number") {
            // TO DO: Also need to handle double
            return "int";
        }
        if (type == "undefined") return "null";

        // TO DO: Also valid: Delegate name
    });

    addMethod(this, "TypeOf", function (object, attribute) {
        return TypeOf(GetAttribute(object, attribute));
    });

    addMethod(this, "DynamicTemplate", function (name, arg1) {
        params = new Object();
        params["object"] = arg1;
        params["exit"] = arg1;
        params["text"] = arg1;
        return dynamicTemplates[name](params);
    });

    addMethod(this, "DynamicTemplate", function (name, arg1, arg2) {
        params = new Object();
        params["object1"] = arg1;
        params["object2"] = arg2;
        return dynamicTemplates[name](params);
    });
    
    addMethod(this, "DynamicTemplate", function (name) {
        return (dynamicTemplates[name]());
    });

    addMethod(this, "Eval", function (expression) {
        return eval(expression);
    });

    addMethod(this, "Eval", function (expression, params) {
        for (var varname in params) {
            var varvalue = params[varname];
            eval("var " + varname + "=varvalue");
        }
        return eval(expression);
    });
}

var overloadedFunctions = new OverloadedFunctions();

function DictionaryContains(dictionary, key) {
    return dictionary[key] != undefined;
}

function DictionaryItem(dictionary, key) {
    return dictionary[key];
}

function StringDictionaryItem(dictionary, key) {
    return dictionary[key];
}

function ScriptDictionaryItem(dictionary, key) {
    return dictionary[key];
}

function ObjectDictionaryItem(dictionary, key) {
    return dictionary[key];
}

function DictionaryCount(dictionary) {
    var count = 0;
    for (key in dictionary) {
        count++;
    }
    return count;
}

function NewList(){
	return [];
}

function ListCombine(list1, list2) {
    return list1.concat(list2);
}

function ListExclude(list, element) {
    var listCopy = list.slice(0);
    var index = listCopy.indexOf(element);
    if (index != -1) {
        listCopy.splice(index, 1);
    }
    return listCopy;
}

function ListContains(list, element) {
    return ($.inArray(element, list) != -1);
}

function ListCount(list) {
    return list.length;
}

function ListItem(list, index) {
    return list[index];
}

function StringListItem(list, index) {
    return list[index];
}

function ObjectListItem(list, index) {
    return list[index];
}

function Template(name) {
    return templates["t_" + name];
}

// TO DO: Need overloads to handle passing function parameters
function RunDelegateFunction(object, attribute) {
    return GetAttribute(object, attribute)();
}

function Contains(parent, child) {
    if (child.parent == null || child.parent == undefined) return false;
    if (child.parent == parent) return true;
    return Contains(parent, child.parent);
}

function ShowMenu() {
    throw "Synchronous ShowMenu function is not supported. Use showmenu_async function instead";
}

function SetMenuSelection(result) {
    if (Object.prototype.toString.call(menuOptions) === '[object Array]') {
        awaitingCallback = false;
        menuCallback(menuOptions[result]);
    }
    else {
        awaitingCallback = false;
        menuCallback(result);
    }
    if (finishTurnAfterSelection) {
        TryFinishTurn();
    }
}

function GetExitByName(parent, name) {
    for (var idx in allExits) {
        var obj = allExits[idx];
        if (obj.parent == parent && obj.alias == name) {
            return obj.name;
        }
    }
}

function GetExitByLink(parent, to) {
    for (var idx in allExits) {
        var obj = allExits[idx];
        if (obj.parent == parent && obj.to == to) {
            return obj.name;
        }
    }
}

function GetFileURL(file) {
    return file;
}

function Ask(question) {
    if (runningWalkthrough) {
        msg("<i>" + question + "</i>");
        var step = currentWalkthroughSteps.splice(0, 1);
        var response = step[0];
        if (response.substring(0, 7) == "answer:") {
            return (response.substring(7) == "yes");
        }
        else {
            msg("Error running walkthrough - expected menu response");
        }
    }
    else {
        return confirm(question);
    }
}

function GetUniqueElementName(prefix) {
    return prefix + getUniqueId();
}

function TryFinishTurn() {
    updateLists();
    TryRunOnReadyScripts();
    if (!awaitingCallback) {
        saveGame();
        if (typeof FinishTurn == "function") {
            FinishTurn();
        }
    }
}

function TryRunOnReadyScripts() {
    if (awaitingCallback) return;
    if (onReadyCallback != null) {
        var callback = onReadyCallback;
        onReadyCallback = null;
        callback();
    }
}

function GetDirectChildren(element) {
    if (!element["_children"]) {
        return new Array();
    }
    return element["_children"];
}

function GetAllChildObjects(element) {
    var result = new Array();
    var directChildren = GetDirectChildren(element);
    for (var idx in directChildren) {
        var obj = directChildren[idx];
        result.push(obj);
        result = result.concat(GetAllChildObjects(obj));
    }
    return result;
}

function IsGameRunning() {
    return gameRunning;
}

function IsDefined(variable) {
	//TODO
    //return true;
    return (typeof variable != null);
}

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function SafeXML(input) {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function GetUIOption() {
    return null;
}

function DoesInherit(obj, type) {
    return ListContains(obj._types, type);
}


//Added by KV 10042017
//Modified by KV 08-14-2024
function setCss(element, cssString) {
  el = $(element);
  cssString = cssString.replace("; ", ";"); //Allow spaces
  ary = cssString.split(";");
  for (i = 0; i < ary.length; i++) {
    ary2 = ary[i].split(':');
    el.css(ary2[0], ary2[1]);
  }
}


function Sin(int) {
    return Math.sin(int);
}
function Abs(int) {
    return Math.abs(int);
}
function Acos(val) {
    return Math.acos(val);
}
function Asin(val) {
    return Math.asin(val);
}
function Atan(val) {
    return Math.atan(val);
}
function Cos(val) {
    return Math.cos(val);
}
function Exp(val) {
    return Math.exp(val);
}
function Log(val) {
    return Math.log(val);
}
function Log10(val) {
    return Math.log10(val);
}
function Sinh(val) {
    return Math.sinh(val);
}
function Sqrt(val) {
    return Math.sqrt(val);
}
function Tan(val) {
    return Math.tan(val);
}
function Tanh(val) {
    return Math.tanh(val);
}
function Ceiling(val) {
    return Math.ceil(val);
}
function Floor(val) {
    return Math.floor(val);
}
function Round(val) {
    return Math.round(val);
}

const Pi = Math.PI;

function abs(int){
	return Math.abs(int);
};
function pow(base, exp) {
    return Math.pow(base, exp);
};
function floor(val) {
    return Math.floor(val);
};

function addTextAndScroll(text) {
  addText('<br/>' + text); 
  scrollToEnd(); 
};


// These variables added by KV for the transcript
var savingTranscript = false;
var noTranscript = false;
var transcriptName = "";

// This function altered by KV for the transcript
function addText(text) {
    if (getCurrentDiv() == null) {
        createNewDiv("left");
    }
    _currentDiv.append(text);
    $("#divOutput").css("min-height", $("#divOutput").height());
    if (savingTranscript && !noTranscript) {
      writeToTranscript(text);
    }
}

function whereAmI() {
    ASLEvent("WhereAmI", platform);
}
var platform = "webplayer";

var templates = new Object();
var dynamicTemplates = new Object();
var allObjects = new Array();
var allExits = new Array();
var allCommands = new Array();
var allTurnScripts = new Array();
var allTimers = new Array();
var objectReferences = new Array();
var objectListReferences = new Array();
var objectDictionaryReferences = new Array();
var embeddedHtml = new Object();
var objectsNameMap = new Object();
var elementsNameMap = new Object();

function RequestSave() {
    msg("This game automatically saves after each successful turn.");
}

function addScript(text) {
    $('body').prepend(text);
}

function setCommands(s, colour) {
    if (arguments.length == 2) commandColour = colour;
    ary = s.split(";");
    el = $('#commandPaneHeading');
    el.empty();
    for (i = 0; i < ary.length; i++) {
        ary2 = ary[i].split(":");
        comm = ary2[0];
        commLower = ary2[0].toLowerCase().replace(/ /g, "_");
        commComm = (ary2.length == 2 ? ary2[1] : ary2[0]).toLowerCase();
        //alert("ary[i]=" + ary[i] + ", Comm=" + comm + ", commComm=" + commComm + ", ary2[0].length=" + ary2.length);
        el.append(' <span id="' + commLower + '_command_button"  class="accordion-header-text" style="padding:5px;"><a id="verblink' + commLower + '" class="cmdlink commandlink" style="text-decoration:none;color:' + commandColour + ';font-size:12pt;" data-elementid="" data-command="' + commComm + '">' + comm + '</a></span> ');
    }
}
var commandColour = "black";


function requestsave() {
    // Do nothing.
}

function requestspeak(data) {
    request("Speak", data);
}

var evalBak = eval

eval = function(data){
    try {
        return evalBak(data);
    } catch (e) {
        for (o in allObjects){
            if(data.indexOf(allObjects[o].name) > -1){
                data = data.split(allObjects[o].name).join("GetObject(\""+allObjects[o].name+"\")");
            }
        }
        return evalBak(data);
    }
}

function showPopup(title, text) {
    $('#msgboxCaption').html(text);

    var msgboxOptions = {
        modal: true,
        autoOpen: false,
        title: title,
        buttons: [
			{
			    text: 'OK',
			    click: function () { $(this).dialog('close'); }
			},
        ],
        closeOnEscape: false,
    };

    $('#msgbox').dialog(msgboxOptions);
    $('#msgbox').dialog('open');
};

function showPopupCustomSize(title, text, width, height) {
    $('#msgboxCaption').html(text);

    var msgboxOptions = {
        modal: true,
        autoOpen: false,
        title: title,
        width: width,
        height: height,
        buttons: [
			{
			    text: 'OK',
			    click: function () { $(this).dialog('close'); }
			},
        ],
        closeOnEscape: false,
    };

    $('#msgbox').dialog(msgboxOptions);
    $('#msgbox').dialog('open');
};

function showPopupFullscreen(title, text) {
    $('#msgboxCaption').html(text);

    var msgboxOptions = {
        modal: true,
        autoOpen: false,
        title: title,
        width: $(window).width(),
        height: $(window).height(),
        buttons: [
			{
			    text: 'OK',
			    click: function () { $(this).dialog('close'); }
			},
        ],
        closeOnEscape: false,
    };

    $('#msgbox').dialog(msgboxOptions);
    $('#msgbox').dialog('open');
};

function GetFileData(file) {
    throw ("FIXME");
};
function Clone(name) {
    // The 'name' variable is actually an object.
    if (!name) return false;
    //console.log(name);
    // Declare this as false, assuming the object has no child objects. 
    var hasKids = false;
    // Declare this for any children while cloning
    var protos = [];
    // Declare this for any clones of children
    var newkids = [];
    // QuestJS has a '_children' attribute which points to the object's child objects
    if (HasAttribute(name, "_children")) {
        //console.log(name.name + " has child objects"); // Let me know what's going on!
        if (GetDirectChildren(name).length > 0) {
            hasKids = true;
            // There are children, so point this array to that attribute
            protos = name["_children"];
            // Back it up again, just to be safe
            //name.kidsBak = name["_children"];
            // Clear it out, to avoid recursion errors while setting the clone's attributes
            name["_children"] = [];
            // Move children to game object while cloning
            //protos.forEach(function (o) {
                //MoveObject(o, GetObject("game"));
            //});
        }
    }
    //console.log("STILL GOING"); // This is just to make sure something hasn't gone wrong!
    //console.log(name.name);
    // This is how QuestJS avoids duplicate object names.
    var clonename = GetUniqueElementName(name.name).replace(/dynid/, "");
    // And we finally create a blank object
    create(clonename);
    // Just like Quest, we must declare a variable which points to the actual object
    var newObject = GetObject(clonename);
    //console.log(newObject);  // Just to make sure things are in order
    // Get all the attribute names of the prototype
    var atts = GetAttributeNames(name);
    for (var att in name) {
        //console.log(att);  // Just to see what is going on!
        // Make sure the attribute exists
        if (name != undefined && att != undefined && name[att] != undefined) {
            // Make sure the attribute isn't either of the names
            if (att != 'name' && att != '_js_name') {
                //console.log(name[att]);  // Just to see what is going on!
                // Copy the attribute from the prototype to the clone
                set(newObject, att, name[att]);
            }
        }
    }
    //console.log(newObject.name+" is set up!");  // Just to see what is going on!
    if (hasKids) {
        // Move children back to the prototype
        protos.forEach(function (o) {
            MoveObject(o, name);
        });
        // We had child objects in the prototype, so we need to clone them and move them into the main clone
        for (var kid in protos) {
            var nclone = CloneObjectAndMove(protos[kid], newObject);
            console.log(nclone);
        }
        // Set the prototype's attribute back to it's original state
        //name["_children"] = name.kidsBak;
        // Delete the backup attribute
        //name.kidsBak = null;
    }
    return newObject;
}

/*function GetRegexNamedGroups(matches) {
    var result = new Array();
    for (var prop in matches) {
        if (matches.hasOwnProperty(prop)) {
                result.push(prop);
        }
    }
    return result;
}*/

function ScopeReachableNotHeldForRoom(room)
{
var result = NewObjectList();
var list_obj = GetAllChildObjects(room);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (ContainsReachable(room, obj) && obj != _obj323.pov && !(Contains(_obj323.pov, obj))) {
listadd (result, obj);
} }
}
if (HasScript(_obj323, "scopebackdrop")) {
var dict = NewDictionary();
dictionaryadd (dict, "items", result);
set(_obj323, "scopebackdropitems", result);
runscriptattribute3 (_obj323, "scopebackdrop", dict);
}
return (result);
}

/* -- ATTEMPTING TO FIX setCustomStatus() -- */

function setPanes(fore, back, secFore, secBack, highlight) {
  if (arguments.length == 2) {
    secFore = back;
    secBack = fore;
  }
  if (arguments.length < 5) {
    highlight = 'orange'
  }
  commandColour = fore;
  for (i = 0; i < elements.length; i++) {
    setElement(elements[i], fore, back);
  }
  for (i = 0; i < dirs.length; i++) {
    setElement(dirs[i], fore, back);
  }

  var head = $('head');
  head.append('<style>.ui-button-text { color: ' + fore + ';}</style>');
  head.append('<style>.ui-state-active { color: ' + fore + ';}</style>');
  head.append('<style>.ui-widget-content { color: ' + fore + ';}</style>');
  head.append('<style>.ui-widget-header .ui-state-default { background-color: ' + secBack + ';}</style>');
  head.append('<style>.ui-selecting { color: ' + secFore + '; background-color: ' + highlight + ';}</style>');
  head.append('<style>.ui-selected { color: ' + secFore + '; background-color: ' + secBack + ';}</style>');

  //$('.ui-button-text').css('color', fore);
  //$('.ui-state-active').css('color', fore);
  //$('.ui-widget-content').css('color', fore);
  
}

elements = [
  '#statusVarsLabel', '#statusVarsAccordion',// '#statusVars',
  '#inventoryLabel', '#inventoryAccordion', '#inventoryAccordion.ui-widget-content',
  '#placesObjectsLabel', '#placesObjectsAccordion', '#placesObjectsAccordion.ui-widget-content',
  '#compassLabel', '#compassAccordion', '.ui-button', //'.ui-button-text',
  '#commandPane', '#customStatusPane'
];

dirs = ['N', 'E', 'S', 'W', 'NW', 'NE', 'SW', 'SE', 'U', 'In', 'D', 'Out'];

commandColour = 'orange'

function setElement(name, fore, back) {
  el = $(name);
  el.css('background', back);
  el.css('color', fore);
  el.css('border', 'solid 1px ' + fore);
  if (endsWith(name, "Accordion")) {
    el.css('border-top', 'none');
  }
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function setCustomStatus(s) {
    el = $('#customStatusPane');
    el.html(s);
}

// Added by KV  

function isMobilePlayer() {
    return false;
};

function getTimeAndDateForLog(){
  var date = new Date();
  var currentDateTime = date.toLocaleString('en-US', { timeZoneName: 'short' }).replace(/,/g, "").replace(/[A-Z][A-Z][A-Z].*/g, "");
  return currentDateTime;
};

// **********************************
// TRANSCRIPT STUFF

/**
  * Added by KV
  *
  * This will write/append to localStorage if the player has the transcript enabled
  *  and if noTranscript is not set to true (it is false by default).
*/
function writeToTranscript(text){
  if (!noTranscript && savingTranscript) {
    var faker = document.createElement('div');
    faker.innerHTML = text;
    text = faker.innerHTML;
    for (var key in Object.keys(faker.getElementsByTagName('img'))){
      var elem = faker.getElementsByTagName('img')[key];
      if (elem != null) {
        var altProp = $(faker.getElementsByTagName('img')[key]).attr('alt') || "";
        text = text.replace(elem.outerHTML, altProp) || text;
      }
    }
    for (var key in Object.keys(faker.getElementsByTagName('area'))){
      var elem = faker.getElementsByTagName('area')[key];
      if (elem != null) {
        var altProp = $(faker.getElementsByTagName('area')[key]).attr('alt') || "";
        text = text.replace(elem.outerHTML, altProp) || text;
      }
    }
    for (var key in Object.keys(faker.getElementsByTagName('input'))){
      var elem = faker.getElementsByTagName('input')[key];
      if (elem != null) {
        var altProp = $(faker.getElementsByTagName('input')[key]).attr('alt') || "";
        text = text.replace(elem.outerHTML, altProp) || text;
      }
    }
    WriteToTranscript(transcriptName + "___SCRIPTDATA___" + $("<div>" + text.replace(/<br\/>/g,"@@@NEW_LINE@@@").replace(/<br>/g,"@@@NEW_LINE@@@").replace(/<br \/>/g,"@@@NEW_LINE@@@") + "</div>").text());
  }
}

/**
  * This will enable the transcript unless noTranscript is set to true.
*/
function enableTranscript(name){
  if (noTranscript) return;
  transcriptName = name || transcriptName || gameName;
  savingTranscript = true;
}

/**
  * This will disable the transcript.
  * 
*/
function disableTranscript(){
  savingTranscript = false;
}

/**
  * This will completely kill the transcript.
  * 
*/
function killTranscript(){
  noTranscript = true;
  disableTranscript();
}

/**
  * Make it easy to control transcript settings from Quest.
*/
function setTranscriptStatus(status){
  switch (status){
    case "enabled":
      var name = transcriptName || gameName;
      enableTranscript(name);
      break;
    case "disabled":
      disableTranscript();
      break;
    case "prohibited":
    case "none":
    case "killed":
      killTranscript();
      break;
    case "allowed":
      noTranscript = false;
  }
}

var showedSaveTranscriptWarning = false;
/**
  * This function was missing from the webplayer in Quest 5.8.0
  * Leaving this here as a fallback
*/
function SaveTranscript(text){
  if(!showedSaveTranscriptWarning){
    console.log("[QUEST]: SaveTranscript has been deprecated. Using writeToTranscript instead.");
    showedSaveTranscriptWarning = true;
  }
  writeToTranscript(text);  
}

var transcriptUrl = 'Play.aspx?id=4wqdac8qd0sf7-ilff8mia';
// Another fallback to avoid errors
function showTranscript(){
  if (webPlayer){
    addTextAndScroll('Your transcripts are saved to the localStorage in your browser. You can view, download, or delete them here: <a href="' + transcriptUrl + '" target="_blank">Your Transcripts</a><br/>');
  }
  else {
    addTextAndScroll('Your transcripts are saved to "Documents\\Quest Transcripts\\".<br/>');
  }
};


// Writes data to the transcript's item in localStorage.

function WriteToTranscript(data){
  if (noTranscript){
    // Do nothing.
    return;
  }
  if (!isLocalStorageAvailable()){
    console.error("There is no localStorage. Disabling transcript functionality.");
    noTranscript = true;
    savingTranscript = false;
    return;
  }
  var tName = transcriptName || "Transcript";
  var overwrite = false;
  if (data.indexOf("@@@OVERWRITEFILE@@@") > -1){
    overwrite = true;
    data = data.replace("@@@OVERWRITEFILE@@@", "");
  }
  if (data.indexOf("___SCRIPTDATA___") > -1) {
    tName = data.split("___SCRIPTDATA___")[0].trim() || tName;
    data = data.split("___SCRIPTDATA___")[1];
  }
  var oldData = "";
  if (!overwrite){
    oldData = localStorage.getItem("questtranscript-" + tName) || "";
  }
  localStorage.setItem("questtranscript-" + tName, oldData + data);
}

// Make sure localStorage is available, hopefully without throwing any errors!

/* https://stackoverflow.com/a/16427747 */
function isLocalStorageAvailable(){
    var test = 'test';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

// Unused functions to open a list of transcripts in a separate window


var wnd;
var tName = "";

var tscriptWindow;
function showTranscripts(){
  var choicesScript = "<script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js\"></script><script>var yourTranscriptsVersion = '1.0.9';    var wnd;    var tName = '';    var choices = {};    function getSafeHtmlId(fixme){      return (fixme.replace(/ /g, '___SPACE___').replace(/'/g, '___SINGLE_QUOTE___').replace(/\"/g, '___DOUBLE_QUOTE___').replace(/:/g, '___COLON___').replace(/\\./g, '___DOT___').replace(/\#/g,'___HASH___'));     };    function reverseSafeHtmlId(unfixme){      return(unfixme.replace(/___SPACE___/g, ' ').replace(/___SINGLE_QUOTE___/g, \"\'\").replace(/___DOUBLE_QUOTE___/g, '\"').replace(/___COLON___/g, ':').replace(/___DOT___/g, '.').replace(/___HASH___/g, '#'));    };    function downloadTranscript(tsn){      event.stopPropagation();      var tscriptData = localStorage.getItem('questtranscript-' + reverseSafeHtmlId(tsn)).replace(/@@@NEW_LINE@@@/g,'\\r\\n') || 'No transcript data found.';      let link = document.createElement('a');      link.download = reverseSafeHtmlId(tsn) + '.txt';      let blob = new Blob([tscriptData], {type: 'text/plain'});      link.href = URL.createObjectURL(blob);      link.click();      URL.revokeObjectURL(link.href);    };    function openTranscript(tsn){      event.stopPropagation();      var tscriptData = localStorage.getItem('questtranscript-' + reverseSafeHtmlId(tsn)).replace(/@@@NEW_LINE@@@/g,'<br/>') || 'No transcript data found.';      wnd = window.open('about:blank', '', '_blank');      wnd.document.write(tscriptData);      wnd.document.title = reverseSafeHtmlId(tsn).replace(/questtranscript-/,'') + ' - Transcript';    };    function removeTscript(tscript){      event.stopPropagation();      var result = window.confirm('Delete this transcript?');      if (result){        console.log(tscript);        localStorage.removeItem('questtranscript-' + reverseSafeHtmlId(tscript));        document.getElementById(tscript).style.display = 'none';        delete choices[tscript.replace(/questtranscript-/,'')];      }      if (Object.keys(choices).length < 1){        document.getElementById('transcript-table-header').innerHTML = 'You have no transcripts.';      }    };    var tScriptTemplate = '<tr id=\"TRANSCRIPT_NAME\" class=\"transcript-entry-holder\" style=\"border:1px solid black; padding: 4px;\"><td class=\"transcript-name\" style=\"padding:4px\">TRANSCRIPT_DISPLAYED_NAME</td><td class=\"transcript-open-link-holder\"><button href=\"#\"  name=\"TRANSCRIPT_NAME\" onclick=\"openTranscript(this.name);\" class=\"transcript-open-link\">OPEN</button></td><td class=\"transcript-download-link-holder\"><button href=\"#\"  name=\"TRANSCRIPT_NAME\" onclick=\"downloadTranscript(this.name);\" class=\"transcript-download-link\">DOWNLOAD</button></td><td class=\"transcript-download-link-holder\"><button href=\"#\"  name=\"TRANSCRIPT_NAME\" onclick=\"removeTscript(this.name);\" class=\"transcript-delete-link\">DELETE</button></td></tr>';    function loadTable(){      $('head').append('<link rel=\"icon\" href=\"https://textadventures.blob.core.windows.net/gameresources/b7362b42-1513-408a-9ba5-7c2559820ccf/favicon-16x16.png\">');       if (Object.keys(choices).length > 0){        console.log('Ignoring call to load table. `choices` already exists.');        return;      }      if (!isLocalStorageAvailable()){        document.getElementById('transcript-table-header').innerHTML = 'The transcript feature is not available in this browser.';        return;      }      document.getElementById('transcript-table-header').innerHTML = 'Loading...';      for (var e in localStorage) {        if (e.startsWith('questtranscript-')){          var eName = e.replace(/questtranscript-/,'');          var safeName = getSafeHtmlId(eName);          choices[safeName] = tScriptTemplate.replace(/TRANSCRIPT_NAME/g, safeName).replace(/TRANSCRIPT_DISPLAYED_NAME/g, eName);        }      }      if (Object.keys(choices).length > 0){        document.getElementById('transcript-table-header').innerHTML = 'Your Transcripts';        for (var tname in choices){          $('#transcript-tbody').append(choices[tname]);        }      } else {        document.getElementById('transcript-table-header').innerHTML = 'You have no transcripts.';      }    };       function isLocalStorageAvailable(){        var test = 'test';        try {            localStorage.setItem(test, test);            localStorage.removeItem(test);            return true;        } catch(e) {            return false;        }    }; loadTable();</script>";
  tscriptWindow = window.open("about:blank", "", "_blank");
  tscriptWindow.document.write("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><table id=\"transcript-table\" style=\"margin: 0 auto; font-family: Source Sans Pro, Calibri, Candara, Arial, sans-serif; color: #333333; border-collapse:collapse;\">  <tbody id=\"transcript-tbody\">    <tr>      <th colspan=\"4\" id=\"transcript-table-header\" style=\"text-align: center; border: 1px solid black; background: #5c9ccc\\\">Loading...</th>    </tr>    <!-- PLACEHOLDER -->  </tbody></table>" + choicesScript);
  tscriptWindow.document.title = tName + "Your Transcripts";
}



// END OF TRANSCRIPT FUNCTIONS

/**
  * Adding this to this file because it exists in desktopplayer.js
  *
  * It is doing nothing here if called, but it is here just so it is defined.
  *
  * @param {data} text This would print to the log file if this were the desktop player. It is ignored here.
*/
function WriteToLog(data){
  /* Do nothing at all. */
  return;
}


/*
    END OF DEFAULT FILE
*/
