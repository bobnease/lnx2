/* lnx2.js — Application logic for lnx2
 *
 * URL format:  lnx2.io?handle|hexcode
 * Examples:    lnx2.io?bobnease|3f
 *              lnx2.io?bobnease          (shows default platform only)
 *              lnx2.io?h=bobnease|3f     (alternate ?h= form)
 *
 * DEPLOYMENT: Update theStem below to match your deployment URL.
 *
 * ICONS: Newer brand icons (X, Bluesky, Threads) require Font Awesome 6.4+.
 *        Make sure your FA Kit is configured for v6.4 or later.
 */


// ─── CONFIGURATION ────────────────────────────────────────────────────────────

/* URL to redirect users who arrive without a handle */
var configURL = "config.html";

/* Base URL for generated links — update this for your deployment.
   e.g. "yourusername.github.io/lnx2/" for GitHub Pages */
var theStem = 'www.lnx2.io/';

/* Display layout */
var maxIconCols  = 4;
var iconColWidth = 3; // must equal 12 / maxIconCols

const useHex = true;  // use hexadecimal in the display code

/* HTML scaffolding */
var htmlPrefixLinks     = '<div class="row"><div class="col-1 text-left">&nbsp;</div><div class="col-10 text-center">';
var htmlSuffixLinks     = '</div><div class="col-1 text-left">&nbsp;</div></div><div class="spacer10"></div>';
var htmlIconGroupPrefix = '<div class="row m-1">';
var htmlIconGroupSuffix = '<div class="spacer5"></div></div>';
var htmlIconPrefix      = '<div class="col-' + iconColWidth + ' text-center px-1">';
var htmlIconSuffix      = '</div>';


// ─── PLATFORM DEFINITIONS ─────────────────────────────────────────────────────
//
// dec:   bitmask value (must be a unique power of 2).
//        WARNING: changing an existing dec value will break URLs that use it.
// order: display sort order (lower number = shown first).
// live:  whether this platform's button is shown (set at runtime, not here).

let lnxObjects = [
    { index:  0, dec:      1, order: 18, tag: 'Website',   root: 'https://www.',                  suffix: '.com', icon: 'fas fa-globe',          live: false },
    { index:  1, dec:      2, order:  1, tag: 'Instagram',  root: 'https://www.instagram.com/',    suffix: '',     icon: 'fab fa-instagram',       live: true  },
    { index:  2, dec:      4, order:  2, tag: 'X',          root: 'https://www.x.com/',            suffix: '',     icon: 'fa-brands fa-x-twitter', live: false },
    { index:  3, dec:      8, order:  3, tag: 'YouTube',    root: 'https://www.youtube.com/',      suffix: '',     icon: 'fab fa-youtube',         live: false },
    { index:  4, dec:     16, order:  5, tag: 'Facebook',   root: 'https://www.facebook.com/',     suffix: '',     icon: 'fab fa-facebook',        live: false },
    { index:  5, dec:     32, order:  4, tag: 'TikTok',     root: 'https://www.tiktok.com/',       suffix: '',     icon: 'fab fa-tiktok',          live: false },
    { index:  6, dec:     64, order: 12, tag: 'Twitch',     root: 'https://www.twitch.tv/',        suffix: '',     icon: 'fab fa-twitch',          live: false },
    { index:  7, dec:    128, order: 13, tag: 'Pinterest',  root: 'https://www.pinterest.com/',    suffix: '',     icon: 'fab fa-pinterest',       live: false },
    { index:  8, dec:    256, order:  8, tag: 'LinkedIn',   root: 'https://www.linkedin.com/in/',  suffix: '',     icon: 'fab fa-linkedin',        live: false },
    { index:  9, dec:    512, order: 16, tag: 'Tumblr',     root: 'https://www.tumblr.com/',       suffix: '',     icon: 'fab fa-tumblr',          live: false },
    { index: 10, dec:   1024, order: 14, tag: 'Telegram',   root: 'https://t.me/',                 suffix: '',     icon: 'fab fa-telegram',        live: false },
    { index: 11, dec:   2048, order: 17, tag: 'Vimeo',      root: 'https://www.vimeo.com/',        suffix: '',     icon: 'fab fa-vimeo',           live: false },
    { index: 12, dec:   4096, order:  6, tag: 'Bluesky',    root: 'https://bsky.app/profile/',     suffix: '',     icon: 'fa-brands fa-bluesky',   live: false },
    { index: 13, dec:   8192, order:  7, tag: 'Threads',    root: 'https://www.threads.net/@',     suffix: '',     icon: 'fa-brands fa-threads',   live: false },
    { index: 14, dec:  16384, order:  9, tag: 'GitHub',     root: 'https://github.com/',           suffix: '',     icon: 'fab fa-github',          live: false },
    { index: 15, dec:  32768, order: 10, tag: 'Reddit',     root: 'https://www.reddit.com/user/',  suffix: '',     icon: 'fab fa-reddit-alien',    live: false },
    { index: 16, dec:  65536, order: 11, tag: 'Snapchat',   root: 'https://www.snapchat.com/add/', suffix: '',     icon: 'fab fa-snapchat',        live: false },
    { index: 17, dec: 131072, order: 15, tag: 'Substack',   root: 'https://substack.com/@',        suffix: '',     icon: 'fas fa-newspaper',       live: false },
];


// ─── DOM HELPERS ──────────────────────────────────────────────────────────────

function ReplaceContentInContainer(id, content) {
    document.getElementById(id).innerHTML = content;
}

function setValueOfInput(id, theValue) {
    document.getElementById(id).value = theValue;
}

function GetElementValue(theID) {
    return document.getElementById(theID).value;
}


// ─── CLIPBOARD ────────────────────────────────────────────────────────────────

function copyLinkField() {
    var text = document.getElementById("theLink").value;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for non-secure contexts or older browsers
        var input = document.getElementById("theLink");
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand("copy");
    }
}


// ─── CONVERSION UTILITIES ─────────────────────────────────────────────────────

function DecimalToBinary(x)   { return parseFloat(x).toString(2); }
function BinaryToDecimal(y)   { return parseInt(y, 2); }
function DecimalToHex(n)      { return n.toString(16); }
function HexToDecimal(hexStr) { return parseInt(hexStr, 16); }


// ─── PLATFORM HELPERS ─────────────────────────────────────────────────────────

function setLive(theIndex, theLive) {
    lnxObjects[theIndex].live = theLive;
}

function setAllLive() {
    for (var i = 0; i < lnxObjects.length; i++) {
        lnxObjects[i].live = true;
    }
}

function compare_order(a, b) {
    return a.order - b.order;
}

function reorderLnxObjects() {
    lnxObjects.sort(compare_order);
}


// ─── DISPLAY CODE ─────────────────────────────────────────────────────────────

/* Reads checked checkboxes in theFormID and returns the combined bitmask.
   Returns a hex string when useHex is true, a number otherwise. */
function CalculateDispCode(theFormID) {
    var theInputs = document.getElementById(theFormID).getElementsByTagName("input");
    var theValue  = 0;

    for (var i = 0; i < theInputs.length; i++) {
        if (theInputs[i].type === "checkbox" && theInputs[i].checked) {
            theValue += parseFloat(theInputs[i].value);
        }
    }

    return useHex ? DecimalToHex(theValue) : theValue;
}


// ─── HTML GENERATION ──────────────────────────────────────────────────────────

/* Generates button/icon HTML for all platforms.
 *   links   = true  → clickable link buttons (index page)
 *   links   = false → checkbox selectors    (config page)
 *   showURL         → show full URL beneath the icon label
 */
function getHTML(handle, showURL, links) {

    reorderLnxObjects();

    var theHTML   = '';
    var iconCount = 0;
    var theRem    = 0;

    for (let i = 0; i < lnxObjects.length; i++) {
        let obj      = lnxObjects[i];
        var urlLink  = obj.root + handle + obj.suffix;
        var thisHTML = '';

        if (links) {
            // Index page — render live platforms as clickable buttons
            if (obj.live) {
                var label = showURL
                    ? '<i class="' + obj.icon + '"></i>&nbsp;&nbsp;' + obj.tag + '<br><small>' + urlLink + '</small>'
                    : '<i class="' + obj.icon + '"></i>&nbsp;&nbsp;' + obj.tag;

                thisHTML = '<button class="btn-social" onclick="window.location.href=\'' + urlLink + '\'">' + label + '</button>';
                thisHTML = htmlPrefixLinks + thisHTML + htmlSuffixLinks;
            }

        } else {
            // Config page — render all platforms as toggle checkboxes
            iconCount = i + 1;
            theRem    = iconCount % maxIconCols;

            var theID      = 'chk_' + obj.index;
            var innerLabel = showURL
                ? '<i class="' + obj.icon + '"></i>&nbsp;&nbsp;' + obj.tag + '<br>' + urlLink
                : '<i class="' + obj.icon + '"></i><br>' + obj.tag;

            thisHTML = '<input class="hidden" id="' + theID + '" type="checkbox" onClick="updateAll()" value="' + obj.dec + '">'
                     + '<label class="" for="' + theID + '"><span class="text">' + innerLabel + '</span></label>';

            thisHTML = htmlIconPrefix + thisHTML + htmlIconSuffix;

            if (theRem === 1) { thisHTML = htmlIconGroupPrefix + thisHTML; }
            if (theRem === 0) { thisHTML = thisHTML + htmlIconGroupSuffix; }
        }

        theHTML += thisHTML;
    }

    // Close the last row if total platforms isn't a multiple of maxIconCols
    if (!links && theRem !== 0) {
        theHTML += htmlIconGroupSuffix;
    }

    return theHTML;
}


// ─── CONFIG PAGE ──────────────────────────────────────────────────────────────

function updateAll() {
    var handle   = GetElementValue("handle");
    var dispCode = CalculateDispCode("config_form");
    var theLink  = '';

    ReplaceContentInContainer("handleHeader", "@" + handle);

    if (handle !== '') {
        theLink = theStem + '?' + handle;
        // Only append a display code if at least one platform is selected
        if (dispCode !== '0' && dispCode !== 0) {
            theLink += '|' + dispCode.toString();
        }
        setValueOfInput("theLink", theLink);
    }
}

function renderConfigPage() {
    ReplaceContentInContainer("handleHeader", "@yournamehere");
    ReplaceContentInContainer("linkOptionsHTML", getHTML('yournamehere', false, false));
}


// ─── INDEX PAGE ───────────────────────────────────────────────────────────────

/* Extracts handle+dispcode from the URL.
 * Supports:  ?h=handle|code   ?handle|code   ?h=handle   ?handle  */
function getRawHandle() {
    var urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('h')) {
        return urlParams.get('h');
    }

    var theQlocation = window.location.href.indexOf('?');
    if (theQlocation >= 0) {
        return window.location.href.split('?')[1];
    }

    return '';
}

function renderLinkPage() {
    var rawHandle   = getRawHandle();
    var hasHandle   = false;
    var handle      = '';
    var dispCode    = '';
    var hasDispCode = false;

    if (rawHandle !== '') {
        var thePipeLocation = rawHandle.indexOf('|');
        if (thePipeLocation > 0) {
            handle      = rawHandle.split('|')[0];
            dispCode    = rawHandle.split('|')[1];
            hasDispCode = true;
        } else {
            handle = rawHandle;
        }
        hasHandle = (handle !== '');
    }

    if (!hasHandle) {
        window.location.href = configURL;
        return;
    }

    ReplaceContentInContainer("userHandle", "@" + handle);

    if (hasDispCode) {
        // Parse the hex display code into binary, then set each platform's
        // live flag based on its bit position (LSB = index 0).
        var dispCodeBin = DecimalToBinary(HexToDecimal(dispCode));
        var j = 0;
        for (let i = dispCodeBin.length; i > 0; i--) {
            setLive(j, dispCodeBin.charAt(i - 1) === '1');
            j++;
        }
    }
    // If no display code, lnxObjects retains its default live values
    // (Instagram only by default).

    ReplaceContentInContainer("links_html", getHTML(handle, false, true));
}
