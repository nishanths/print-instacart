// proxyURL returns the URL to use to fetch the resource at u, 
// in order to work around cross-origin restrictions.
function proxyURL(u: string): string { 
  return "https://x.concurrent.space/ic-proxy?url=" + encodeURIComponent(u); 
}

function doc(): HTMLDocument { return window.top.document; }

var frame_: HTMLIFrameElement;

function frameDoc(): HTMLDocument {
  if (!frame_) {
    frame_ = doc().createElement("iframe");
    frame_.style.display = "none";
    doc().body.appendChild(frame_);
  }
  return frame_.contentDocument;
}

// styleIDKey is the key used in the style element's data attribute.
const styleIDKey = "id";

// sheetMap is a map from style ID to the corresponding <link> element on the Instacart page.
var sheetMap: {[id: string]: CSSStyleSheet} = {};

var styleId_ = -1;

function nextStyleId(): string {
  styleId_++
  return ""+styleId_;
}

// Fixes the stylesheets of the <link> elements.
function fixLinkElements(list: StyleSheetList) {
  let promises: Promise<void>[] = [];

  for (let i = 0; i < list.length; i++) {
    let sheet = list.item(i) as CSSStyleSheet;
    if ((sheet.ownerNode as Element).tagName != "LINK") {
      continue;
    }
    // TODO: ignore print stylesheets here (but, for now, doesn't matter for Instacart)
    let p = makeFrameStyleElement(sheet);
    promises.push(p);
  }

  Promise.all(promises).then(() => {
    rewriteLinkElements();
  }).catch(e => {
    console.log(e);
  })
}

function rewriteLinkElements() {
  fixStyleElements(frameDoc().styleSheets, (frameSheet) => {
    let id = (frameSheet.ownerNode as HTMLStyleElement).dataset[styleIDKey];
    let linkSheet = sheetMap[id];
    if (!linkSheet) {
      console.log("sheet not found in sheetMap for key=%s", id)
      return;
    }
    // disable the sheet; use the fixed up <style> element instead.
    linkSheet.disabled = true;
    let n = doc().createElement("style");
    n.textContent = serializeRules(frameSheet.cssRules);
    linkSheet.ownerNode.parentNode.insertBefore(n, linkSheet.ownerNode);
  });
}

// Really, no built-in API for this?
function serializeRules(rules: CSSRuleList): string {
  let s = "";
  for (let i = 0; i < rules.length; i++) {
    let r = rules.item(i);
    s += r.cssText + "\n";
  }
  return s;
}

// Creates a <style> element with the contents at the sheet's href,
// and associates the <style> element's data ID with sheet in sheetMap.
function makeFrameStyleElement(sheet: CSSStyleSheet): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fetch(proxyURL(sheet.href)).then(rsp => {
      rsp.text().then(v => {
        let id = nextStyleId();
        // create the style element; we will use it later.
        let style = frameDoc().createElement("style");
        style.textContent = v;
        style.dataset[styleIDKey] = id;
        frameDoc().head.appendChild(style);
        // associate the ID with the sheet.
        sheetMap[id] = sheet;
        resolve();
      });
    }).catch(e => {
      reject(e);
    });
  });
}

// Fixes the stylesheets of <style> elements in the supplied list.
function fixStyleElements(list: StyleSheetList, cb?: (sheet: CSSStyleSheet) => void) {
  for (let i = 0; i < list.length; i++) {
    let sheet = list.item(i) as CSSStyleSheet;
    if ((sheet.ownerNode as Element).tagName != "STYLE") {
      continue;
    }
    fixStyleSheet(sheet);
    if (cb) {
      cb(sheet);
    }
  }
}

// Fixes the rules in a single sheet. The sheet can belong to any
// kind of owner.
function fixStyleSheet(sheet: CSSStyleSheet) {
  if (!sheet.cssRules) {
    return;
  }
  for (let j = 0; j < sheet.cssRules.length; j++) {
    let rule = sheet.cssRules.item(j);
    if (rule.type != 4) { // 4 is MEDIA_RULE
      continue;
    }
    let c = rule as CSSMediaRule;
    c.conditionText = fixMedia(c.conditionText);
  }
}

const screenRx_ = /(?:only\s+)?screen?/g;
const notAllRx_ = /not\s+all/

// fixMedia fixes up the supplied media condition.
function fixMedia(m: string): string {
  return m.split(",")
    .map(s => s.trim())
    // keep "not print" and others; remove "print"
    .filter(s => isPrint(s))
    .filter(s => !notAllRx_.test(s))
    .map(s => s.replace(screenRx_, "all"))
    .join(",");
}

function isPrint(s: string): boolean {
  return s.indexOf("print") == -1 || s.indexOf("not") != -1;
}

// hideElement hides the first element matching the selector specified.
// It tries the supplied selectors in order until a matching element is found.
// Returns whether a matching element was found and hidden.
function hideElement(...s: string[]): boolean {
  return s.some(sel => {
    let e = doc().querySelector(sel) as HTMLElement;
    if (!e) {
      return false;
    }
    e.style.setProperty("display", "none", "important");
    return true;
  });
}

function formatDate(date: Date) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const months = [
    "Jan", "Feb", "Mar",
    "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec"
  ];

  let day = date.getDay();
  let d = date.getDate();
  let m = date.getMonth();
  let y = date.getFullYear();
  return days[day] + ", " + d + " " + months[m] + " " + y;
}

function addDetails(): boolean {
  let elem = doc().querySelector(".order-summary-header-text");
  if (!elem) {
    return false;
  }

  let loc = window.location.href;
  let d = formatDate(new Date());

  let storeLink = doc().createElement("div");
  storeLink.textContent = loc;
  storeLink.style.fontSize = "13px";
  storeLink.style.fontWeight = "600";
  storeLink.style.color = "rgb(67, 142, 173)";
  elem.appendChild(storeLink);

  let date = doc().createElement("div");
  date.textContent = d;
  date.style.fontSize = "13px";
  date.style.fontWeight = "600";
  elem.appendChild(date);

  return true;
}

function main() {
  hideElement(".ic-nav-new", "#header") || console.log("failed to find main header");
  hideElement(".order-status-header")   || console.log("failed to find order status header");
  hideElement(".order-status-bulletin") || console.log("failed to find sidebar");
  hideElement(".order-summary-header-actions");
  hideElement("#toast-container");

  fixStyleElements(doc().styleSheets);
  fixLinkElements(doc().styleSheets);
  // TODO: fix @import sheets also? (but, for now, Instacart doesn't have anything meaningful there)  
  // See https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet#Notes

  addDetails() || console.log("failed to add details");
}

main();
