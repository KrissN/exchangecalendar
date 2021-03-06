/* ***** BEGIN LICENSE BLOCK *****
 * Version: GPL 3.0
 *
 * The contents of this file are subject to the General Public License
 * 3.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.gnu.org/licenses/gpl.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * -- Global Functions for Exchange Calendar and Exchange Contacts.
 * -- For Thunderbird.
 *
 * Author: Michel Verbraak (info@1st-setup.nl)
 * Website: http://www.1st-setup.nl/wordpress/?page_id=133
 * email: info@1st-setup.nl
 *
 *
 * ***** BEGIN LICENSE BLOCK *****/

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;
var Cr = Components.results;
var components = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/Services.jsm");

var EXPORTED_SYMBOLS = ["exchWebService" ];

if (! exchWebService) var exchWebService = {};

exchWebService.commonFunctions = {

	ecTZService: function _ecTZService()
	{
		if (Cc["@mozilla.org/calendar/timezone-service;1"]) {
			return Cc["@mozilla.org/calendar/timezone-service;1"]
		                     .getService(Ci.calITimezoneService);
		}
	
		return null;
	},

	ecDefaultTimeZone: function _ecDefaultTimeZone()
	{
		if (exchWebService.commonFunctions.ecTZService()) {
			return exchWebService.commonFunctions.ecTZService().defaultTimezone;
		}
		return null;
	},

	ecUTC: function _ecUTC()
	{
		if (exchWebService.commonFunctions.ecTZService()) {
			return exchWebService.commonFunctions.ecTZService().UTC;
		}	

		return null;
	},

	splitUriGetParams: function _splitUriGetParams(aUri)
	{
		exchWebService.commonFunctions.LOG("exchWebService.commonFunctions.splitUriGetParams:"+aUri.spec);
		if (aUri.path.indexOf("?") > -1) {
			// We have get params.
			let getParamsStr = aUri.path.substr(aUri.path.indexOf("?")+1);
			// Split is in the individual params.
			var getParams = {};
			while (getParamsStr.indexOf("&") > -1) {
				var tmpParam = getParamsStr.substr(0, getParamsStr.indexOf("&"));
				getParamsStr = getParamsStr.substr(getParamsStr.indexOf("&")+1);
				if (tmpParam.indexOf("=") > -1) {
					getParams[tmpParam.substr(0,tmpParam.indexOf("="))] = decodeURIComponent(tmpParam.substr(tmpParam.indexOf("=")+1));
				}
			}
			if (getParamsStr.indexOf("=") > -1) {
				getParams[getParamsStr.substr(0,getParamsStr.indexOf("="))] = decodeURIComponent(getParamsStr.substr(getParamsStr.indexOf("=")+1));
			}

			return getParams;
		}
		
		return null;
	},


	getBranch: function _getBranche(aName)
	{
		var lBranche = "";
		var lName = "";
		var lastIndexOf = aName.lastIndexOf(".");
		if (lastIndexOf > -1) {
			lBranche = aName.substr(0,lastIndexOf+1);
			lName = aName.substr(lastIndexOf+1); 
		}
		else {
			lName = aName;
		}

		//this.LOG("aName:"+aName+", lBranche:"+lBranche+", lName:"+lName+"|");

		return { branch: Cc["@mozilla.org/preferences-service;1"]
		                    .getService(Ci.nsIPrefService)
				    .getBranch(lBranche),
			   name: lName };
	},

	safeGetCharPref: function _safeGetCharPref(aBranch, aName, aDefaultValue, aCreateWhenNotAvailable)
	{
		if (!aBranch) {
//			return aDefaultValue;
			var realBranche = this.getBranch(aName);
			if (!realBranche.branch) {
				return aDefaultValue;
			}
			var aBranch = realBranche.branch;
			var aName = realBranche.name;
		}
	
		if (!aCreateWhenNotAvailable) { var aCreateWhenNotAvailable = false; }

		try {
			return aBranch.getCharPref(aName);
		}
		catch(err) {
			if (aCreateWhenNotAvailable) { 
				try {
					aBranch.setCharPref(aName, aDefaultValue); 
				}
				catch(er) {
					aBranch.deleteBranch(aName);
					aBranch.setCharPref(aName, aDefaultValue); 
				}
			}
			return aDefaultValue;
		}
	},

	safeGetBoolPref: function _safeGetBoolPref(aBranch, aName, aDefaultValue, aCreateWhenNotAvailable)
	{
		if (!aBranch) {
//			return aDefaultValue;
			var realBranche = this.getBranch(aName);
			if (!realBranche.branch) {
				return aDefaultValue;
			}
			var aBranch = realBranche.branch;
			var aName = realBranche.name;
		}
	
		if (!aCreateWhenNotAvailable) { var aCreateWhenNotAvailable = false; }

		try {
			return aBranch.getBoolPref(aName);
		}
		catch(err) {
			if (aCreateWhenNotAvailable) { 
				try {
					aBranch.setBoolPref(aName, aDefaultValue); 
				}
				catch(er) {
					aBranch.deleteBranch(aName);
					aBranch.setBoolPref(aName, aDefaultValue); 
				}
			}
			return aDefaultValue;
		}
	},

	safeGetIntPref: function _safeGetIntPref(aBranch, aName, aDefaultValue, aCreateWhenNotAvailable)
	{
		if (!aBranch) {
//			return aDefaultValue;
			var realBranche = this.getBranch(aName);
			if (!realBranche.branch) {
				return aDefaultValue;
			}
			var aBranch = realBranche.branch;
			var aName = realBranche.name;
		}
	
		if (!aCreateWhenNotAvailable) { var aCreateWhenNotAvailable = false; }

		try {
			return aBranch.getIntPref(aName);
		}
		catch(err) {
			if (aCreateWhenNotAvailable) { 
				try {
					aBranch.setIntPref(aName, aDefaultValue); 
				}
				catch(er) {
					aBranch.deleteBranch(aName);
					aBranch.setIntPref(aName, aDefaultValue); 
				}
			}
			return aDefaultValue;
		}
	},

// Following code was taken from calUtils.jsm in Lightning

    /**
     * Loads an array of calendar scripts into the passed scope.
     *
     * @param scriptNames an array of calendar script names
     * @param scope       scope to load into
     * @param baseDir     base dir; defaults to calendar-js/
     */
	loadScripts: function _loadScripts(scriptNames, scope, baseDir) 
	{
	        //let scriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
	        //                             .getService(Ci.mozIJSSubScriptLoader);
	        let ioService = Cc["@mozilla.org/network/io-service;1"]
	                                          .getService(Ci.nsIIOService2);

	        if (!baseDir) {
	            baseDir = __LOCATION__.parent.parent.clone();
	            baseDir.append("calendar-js");
	        }

	        for each (let script in scriptNames) {
	            if (!script) {
	                // If the array element is null, then just skip this script.
	                continue;
	            }
	            let scriptFile = baseDir.clone();
	            scriptFile.append(script);
	            let scriptUrlSpec = ioService.newFileURI(scriptFile).spec;
	            try {
			Cu.import(scriptUrlSpec, scope);
	                //scriptLoader.loadSubScript(scriptUrlSpec, scope);
	            } catch (exc) {
	                Cu.reportError(exc + " (" + scriptUrlSpec + ")");
	            }
	        }
	},

// Code from calUtils.jsm

// Following code was taken from calUtils.js in Lightning and modified

/**
 * Creates a string bundle.
 *
 * @param bundleURL The bundle URL
 * @return string bundle
 */
	getStringBundle: function _getStringBundle(bundleURL) {
	    let service = Cc["@mozilla.org/intl/stringbundle;1"]
	                            .getService(Ci.nsIStringBundleService);
	    return service.createBundle(bundleURL);
	},

/**
 * Gets the value of a string in a .properties file from the calendar bundle
 *
 * @param aBundleName  the name of the properties file.  It is assumed that the
 *                     file lives in chrome://calendar/locale/
 * @param aStringName  the name of the string within the properties file
 * @param aParams      optional array of parameters to format the string
 * @param aComponent   required stringbundle component name
 */
	getString: function _getString(aBundleName, aStringName, aParams, aComponent) {
	    try {
	        if (!aComponent) {
	            return "";
	        }
	        var propName = "chrome://" + aComponent + "/locale/" + aBundleName + ".properties";
	        var props = exchWebService.commonFunctions.getStringBundle(propName);
	
	        if (aParams && aParams.length) {
	            return props.formatStringFromName(aStringName, aParams, aParams.length);
	        } else {
	            return props.GetStringFromName(aStringName);
	        }
	    } catch (ex) {
	        var s = ("Failed to read '" + aStringName + "' from " + propName + ".");
	        Cu.reportError(s + " Error: " + ex);
	        return s;
	    }
	},

/**
 * Make a UUID using the UUIDGenerator service available, we'll use that.
 */
	getUUID: function _getUUID() {
	    var uuidGen = Cc["@mozilla.org/uuid-generator;1"]
	                  .getService(Ci.nsIUUIDGenerator);
	    // generate uuids without braces to avoid problems with
	    // CalDAV servers that don't support filenames with {}
	    return uuidGen.generateUUID().toString().replace(/[{}]/g, '');
	},


	/* Shortcut to the console service */
	getConsoleService: function _getConsoleService() {
	    return Cc["@mozilla.org/consoleservice;1"]
	                     .getService(Ci.nsIConsoleService);
	},


/****
 **** debug code
 ****/

/**
 * Logs a string or an object to both stderr and the js-console only in the case
 * where the calendar.debug.log pref is set to true.
 *
 * @param aArg  either a string to log or an object whose entire set of
 *              properties should be logged.
 */
	shouldLog: function _shouldLog()
	{
	    var prefB = Cc["@mozilla.org/preferences-service;1"].
	                getService(Ci.nsIPrefBranch);
	    return exchWebService.commonFunctions.safeGetBoolPref(prefB, "extensions.1st-setup.debug.log", false, true);
	},

	LOG: function _LOG(aArg) {
	    //var prefB = Cc["@mozilla.org/preferences-service;1"].
	    //            getService(Ci.nsIPrefBranch);
	    //var shouldLog = exchWebService.commonFunctions.safeGetBoolPref(prefB, "extensions.1st-setup.debug.log", false, true);

	    if (!exchWebService.commonFunctions.shouldLog()) {
	        return;
	    }
		
		try {
			exchWebService.commonFunctions.ASSERT(aArg, "Bad log argument.", true);
		}
		catch(exc) {
			var aArg = exc;
		}

	    var string;
	    // We should just dump() both String objects, and string primitives.
	    if (!(aArg instanceof String) && !(typeof(aArg) == "string")) {
	        var string = "1st-setup: Logging object...\n";
	        for (var prop in aArg) {
	            string += prop + ': ' + aArg[prop] + '\n';
	        }
	        string += "End object\n";
	    } else {
	        string = "1st-setup: " + aArg;
	    }

	    // xxx todo consider using function debug()
	    dump(string + '\n');
	    exchWebService.commonFunctions.getConsoleService().logStringMessage(string);

		exchWebService.commonFunctions.writeToLogFile(string);

	},

	writeToLogFile: function _writeToLogFile(aString)
	{
		var prefB = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);

		var file = exchWebService.commonFunctions.safeGetCharPref(prefB, "extensions.1st-setup.debug.file", "/tmp/exchangecalendar.log", true);
		if (file != "") {
			// file is nsIFile, data is a string  
//exchWebService.commonFunctions.getConsoleService().logStringMessage(" >>>>>>>>>>>>>>>");

			var localFile = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);

			try {
				localFile.initWithPath(file); 
			}
			catch(er) {
				return;
			}

			var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].  
				       createInstance(Components.interfaces.nsIFileOutputStream);  
			      
			try {
				// On startup create a new file otherwise append.  
				if (!exchWebService.commonFunctions.debugFileInitialized) {
					foStream.init(localFile, 0x02 | 0x08 | 0x20, 0666, 0);
					exchWebService.commonFunctions.debugFileInitialized = true;   
				}
				else {
					foStream.init(localFile, 0x02 | 0x08 | 0x10, 0666, 0);   
				}
			}
			catch(er) {
				return;
			}
			      
			// if you are sure there will never ever be any non-ascii text in data you can   
			// also call foStream.writeData directly  
			var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].  
					createInstance(Components.interfaces.nsIConverterOutputStream);  
			converter.init(foStream, "UTF-8", 0, 0);  
			converter.writeString(aString+"\n");  
			converter.close(); // this closes foStream  
		}
	},

/**
 * Dumps a warning to both console and js console.
 *
 * @param aMessage warning message
 */
	WARN: function _WARN(aMessage) {
	    dump("1st-setup: Warning: " + aMessage + '\n');
	    var scriptError = Cc["@mozilla.org/scripterror;1"]
	                                .createInstance(Ci.nsIScriptError);
	    scriptError.init("1st-setup: " + aMessage, null, null, 0, 0,
	                     Ci.nsIScriptError.warningFlag,
	                     "component javascript");
	    exchWebService.commonFunctions.getConsoleService().logMessage(scriptError);
	},

/**
 * Dumps an error to both console and js console.
 *
 * @param aMessage error message
 */
	ERROR: function _ERROR(aMessage) {
	    dump("1st-setup: Error: " + aMessage + '\n');
	    var scriptError = Cc["@mozilla.org/scripterror;1"]
	                                .createInstance(Ci.nsIScriptError);
	    scriptError.init("1st-setup: " + aMessage, null, null, 0, 0,
	                     Ci.nsIScriptError.errorFlag,
	                     "component javascript");
	    exchWebService.commonFunctions.getConsoleService().logMessage(scriptError);
	},

/**
 * Returns a string describing the current js-stack with filename and line
 * numbers.
 *
 * @param aDepth (optional) The number of frames to include. Defaults to 5.
 * @param aSkip  (optional) Number of frames to skip
 */
	STACK: function _STACK(aDepth, aSkip) {
	    let depth = aDepth || 10;
	    let skip = aSkip || 0;
	    let stack = "";
	    let frame = components.stack.caller;
	    for (let i = 1; i <= depth + skip && frame; i++) {
	        if (i > skip) {
	            stack += i + ": [" + frame.filename + ":" +
	                     frame.lineNumber + "] " + frame.name + "\n";
	        }
	        frame = frame.caller;
	    }
	    return stack;
	},

	STACKshort: function _STACKshort() {
	    let depth = 1;
	    let skip = 1;
	    let stack = "";
	    let frame = components.stack.caller;
	    if ((frame) && (frame.caller)) {
			var filename = frame.caller.filename.replace(/^.*(\\|\/|\:)/, '');
			stack += frame.caller.name+ " in " + filename + ":" + frame.caller.lineNumber;
	    }

	    return stack;
	},

/**
 * Logs a message and the current js-stack, if aCondition fails
 *
 * @param aCondition  the condition to test for
 * @param aMessage    the message to report in the case the assert fails
 * @param aCritical   if true, throw an error to stop current code execution
 *                    if false, code flow will continue
 *                    may be a result code
 */
	ASSERT: function _ASSERT(aCondition, aMessage, aCritical) {
	    if (aCondition) {
	        return;
	    }

	    let string = "Assert failed: " + aMessage + '\n' + exchWebService.commonFunctions.STACK(0, 1);
	    if (aCritical) {
	        throw new components.Exception(string,
	                                       aCritical === true ? Cr.NS_ERROR_UNEXPECTED : aCritical);
	    } else {
	        Cu.reportError(string);
	    }
	},

// End of functions from calUtils.js

	CreateSimpleEnumerator: function _CreateSimpleEnumerator(aArray) {
	  return {
	    _i: 0,
	    QueryInterface: XPCOMUtils.generateQI([Ci.nsISimpleEnumerator]),
	    hasMoreElements: function CSE_hasMoreElements() {
	      return this._i < aArray.length;
	    },
	    getNext: function CSE_getNext() {
	      return aArray[this._i++];
	    }
	  };
	},

	CreateSimpleObjectEnumerator: function _CreateSimpleObjectEnumerator(aObj) {
	  return {
	    _i: 0,
	    _keys: Object.keys(aObj),
	    QueryInterface: XPCOMUtils.generateQI([Ci.nsISimpleEnumerator]),
	    hasMoreElements: function CSOE_hasMoreElements() {
	      return this._i < this._keys.length;
	    },
	    getNext: function CSOE_getNext() {
	      return aObj[this._keys[this._i++]];
	    }
	  };
	},

	trim: function _trim (str) {
		str = str.replace(/^\s+/, '');
		for (var i = str.length - 1; i >= 0; i--) {
			if (/\S/.test(str.charAt(i))) {
				str = str.substring(0, i + 1);
				break;
			}
		}
		return str;
	},

	copyPreferences: function _copyPreferences(aFromPrefs, aToPrefs)
	{
		var children = aFromPrefs.getChildList("");
		var count = 0;
		if (children.length > 0) {
			// Move prefs from old location to new location.
			for (var index in children) {
				count++;
				switch (aFromPrefs.getPrefType(children[index])) {
				case aFromPrefs.PREF_STRING:
					aToPrefs.setCharPref(children[index], aFromPrefs.getCharPref(children[index]));
					break;
				case aFromPrefs.PREF_INT:
					aToPrefs.setIntPref(children[index], aFromPrefs.getIntPref(children[index]));
					break;
				case aFromPrefs.PREF_BOOL:
					aToPrefs.setBoolPref(children[index], aFromPrefs.getBoolPref(children[index]));
					break;
				}
			}
		
		}
		return count;
	},

	copyCalendarSettings: function _copyCalendarSettings(aFromId, aToId)
	{
		var fromCalPrefs = Cc["@mozilla.org/preferences-service;1"]
		            .getService(Ci.nsIPrefService)
			    .getBranch("extensions.exchangecalendar@extensions.1st-setup.nl."+aFromId+".");

		if (aToId == undefined) {
			var toId = exchWebService.commonFunctions.getUUID();
		}
		else {
			var toId = aToId;
		}

		var toCalPrefs = Cc["@mozilla.org/preferences-service;1"]
		            .getService(Ci.nsIPrefService)
			    .getBranch("extensions.exchangecalendar@extensions.1st-setup.nl."+toId+".");

		
		exchWebService.commonFunctions.copyPreferences(fromCalPrefs, toCalPrefs);

		fromCalPrefs = Cc["@mozilla.org/preferences-service;1"]
		            .getService(Ci.nsIPrefService)
			    .getBranch("calendar.registry."+aFromId+".");

		toCalPrefs = Cc["@mozilla.org/preferences-service;1"]
		            .getService(Ci.nsIPrefService)
			    .getBranch("calendar.registry."+toId+".");

		exchWebService.commonFunctions.copyPreferences(fromCalPrefs, toCalPrefs);

		return toId;
	},

	addCalendarById: function _addCalendarById(aId)
	{
		var ioService = Cc["@mozilla.org/network/io-service;1"]  
				.getService(Ci.nsIIOService);  
		var tmpURI = ioService.newURI("https://auto/"+aId, null, null);  

		var calManager = Cc["@mozilla.org/calendar/manager;1"]
			.getService(Ci.calICalendarManager);
		var newCal = calManager.createCalendar("exchangecalendar", tmpURI);

		newCal.id = aId;

		calManager.registerCalendar(newCal);
	},
}


